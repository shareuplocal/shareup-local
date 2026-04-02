import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';
import { supabase, mapPublicProfile, mapFriendRequest } from '../supabase';
import { ArrowLeft, Search, Users, Loader2, User, Check, X, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, handleFirestoreError, OperationType } from '../lib/utils';
import { PublicProfile, FriendRequest } from '../types';
import ProfileModal from '../components/friends/ProfileModal';
import NearbyUserCard from '../components/friends/NearbyUserCard';
import FriendCard from '../components/friends/FriendCard';

const FriendsPage = () => {
  const { profile, user, isQuotaExceeded } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<PublicProfile[]>([]);
  const [friends, setFriends] = useState<PublicProfile[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn('Location access denied', err)
      );
    }
  }, []);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Charger amis, demandes + écoute temps réel
  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      // Amis
      const { data: friendRows } = await supabase
        .from('friends').select('friend_id').eq('user_id', user.id);
      const friendIds = (friendRows || []).map(r => r.friend_id);

      if (friendIds.length > 0) {
        const { data: friendProfiles } = await supabase
          .from('public_profiles').select('*').in('id', friendIds);
        setFriends((friendProfiles || []).map(mapPublicProfile));
      } else {
        setFriends([]);
      }

      // Demandes reçues
      const { data: recvData } = await supabase
        .from('friend_requests').select('*').eq('to_id', user.id).eq('status', 'pending');
      setReceivedRequests((recvData || []).map(mapFriendRequest));

      // Demandes envoyées
      const { data: sentData } = await supabase
        .from('friend_requests').select('*').eq('from_id', user.id).eq('status', 'pending');
      setSentRequests((sentData || []).map(mapFriendRequest));
    };

    fetchAll();

    const channel = supabase.channel('friends-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, fetchAll)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // Utilisateurs à proximité
  useEffect(() => {
    if (!user || !userLocation) return;
    const fetchNearby = async () => {
      const { data } = await supabase.from('public_profiles').select('*').limit(50);
      const nearby = (data || [])
        .map(mapPublicProfile)
        .filter(u => {
          if (u.uid === user.id) return false;
          if (!u.lastLocation) return false;
          const dist = Math.sqrt(
            Math.pow((u.lastLocation.lat || 0) - userLocation.lat, 2) +
            Math.pow((u.lastLocation.lng || 0) - userLocation.lng, 2)
          );
          return dist < 0.1;
        })
        .slice(0, 5);
      setNearbyUsers(nearby);
    };
    fetchNearby();
  }, [user?.id, userLocation]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('public_profiles')
        .select('*')
        .ilike('display_name', `%${searchQuery.trim()}%`)
        .limit(5);
      setSearchResults((data || []).map(mapPublicProfile));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'public_profiles');
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (friend: PublicProfile) => {
    if (!user || !profile) return;
    try {
      await supabase.from('friend_requests').insert({
        from_id: user.id,
        from_name: profile.displayName,
        from_photo: profile.photoURL || '',
        to_id: friend.uid || friend.id,
        to_name: friend.displayName,
        to_photo: friend.photoURL || '',
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      setStatusMessage(`Demande envoyée à ${friend.displayName} !`);
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'friend_requests');
    }
  };

  const acceptRequest = async (request: FriendRequest) => {
    if (!user) return;
    try {
      await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', request.id);

      await supabase.from('friends').insert([
        { user_id: user.id, friend_id: request.fromId, friend_name: request.fromName, friend_photo: request.fromPhoto, created_at: new Date().toISOString() },
        { user_id: request.fromId, friend_id: user.id, friend_name: profile?.displayName || '', friend_photo: profile?.photoURL || '', created_at: new Date().toISOString() },
      ]);

      for (const uid of [user.id, request.fromId]) {
        const { data } = await supabase.from('public_profiles').select('stats').eq('id', uid).single();
        if (data) {
          const newStats = { ...data.stats, friendsCount: (data.stats?.friendsCount || 0) + 1 };
          await supabase.from('public_profiles').update({ stats: newStats }).eq('id', uid);
        }
      }
      setStatusMessage(`Vous êtes maintenant ami avec ${request.fromName} !`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'friend_requests');
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', requestId);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'friend_requests');
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return;
    try {
      await supabase.from('friends').delete().eq('user_id', user.id).eq('friend_id', friendId);
      await supabase.from('friends').delete().eq('user_id', friendId).eq('friend_id', user.id);

      for (const uid of [user.id, friendId]) {
        const { data } = await supabase.from('public_profiles').select('stats').eq('id', uid).single();
        if (data) {
          const newStats = { ...data.stats, friendsCount: Math.max(0, (data.stats?.friendsCount || 0) - 1) };
          await supabase.from('public_profiles').update({ stats: newStats }).eq('id', uid);
        }
      }
      setStatusMessage('Ami retiré.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'friends');
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      await supabase.from('friend_requests').delete().eq('id', requestId);
      setStatusMessage('Demande annulée.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'friend_requests');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="p-6 pb-32 max-w-md mx-auto"
    >
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[8000] bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {statusMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mes Amis</h1>
      </header>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom..."
            className="w-full bg-gray-50 border border-gray-100 rounded-[2rem] py-5 pl-14 pr-6 font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
          />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          <button type="submit" disabled={loading}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white p-2.5 rounded-2xl hover:bg-black transition-all disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {nearbyUsers.length > 0 && searchQuery === '' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-green-600 uppercase tracking-widest">Voisins à proximité</h3>
              <MapPin size={16} className="text-green-300" />
            </div>
            {nearbyUsers.map((res) => (
              <NearbyUserCard key={res.id} user={res} onAddFriend={addFriend}
                isFriend={friends.some(f => f.id === res.id)} currentUserId={user?.uid} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 space-y-3">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Résultats</h3>
            {searchResults.map((res) => (
              <NearbyUserCard key={res.id} user={res} onAddFriend={addFriend}
                isFriend={friends.some(f => f.uid === res.id)} currentUserId={user?.uid} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {receivedRequests.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8 space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Demandes reçues ({receivedRequests.length})</h3>
              <Clock size={16} className="text-orange-300" />
            </div>
            {receivedRequests.map((req) => (
              <div key={req.id} className="bg-orange-50/50 p-4 rounded-3xl border border-orange-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={req.fromPhoto || `https://ui-avatars.com/api/?name=${req.fromName}`}
                    alt={req.fromName} className="w-12 h-12 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <p className="font-bold text-gray-900">{req.fromName}</p>
                    <p className="text-[10px] text-gray-400">Souhaite être votre ami</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => acceptRequest(req)}
                    className="bg-green-600 text-white p-2.5 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100">
                    <Check size={20} />
                  </button>
                  <button onClick={() => rejectRequest(req.id)}
                    className="bg-white text-gray-400 p-2.5 rounded-xl border border-gray-100 hover:text-red-500 transition-all">
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sentRequests.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8 space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Demandes envoyées ({sentRequests.length})</h3>
              <Clock size={16} className="text-blue-300" />
            </div>
            {sentRequests.map((req) => (
              <div key={req.id} className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={req.toPhoto || `https://ui-avatars.com/api/?name=${req.toName}`}
                    alt={req.toName} className="w-12 h-12 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <p className="font-bold text-gray-900">{req.toName}</p>
                    <p className="text-[10px] text-gray-400">En attente de réponse</p>
                  </div>
                </div>
                <button onClick={() => cancelRequest(req.id)}
                  className="bg-white text-gray-400 p-2.5 rounded-xl border border-gray-100 hover:text-red-500 transition-all">
                  <X size={20} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ma Liste ({friends.length})</h3>
          <Users size={16} className="text-gray-300" />
        </div>
        <div className="space-y-3">
          {friends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} onClick={setSelectedProfile} />
          ))}
          {friends.length === 0 && !loading && (
            <div className="text-center py-12 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
              <div className="bg-white w-16 h-16 rounded-3xl flex items-center justify-center text-gray-300 mx-auto mb-4 shadow-sm">
                <User size={32} />
              </div>
              <p className="text-gray-400 font-bold text-sm">Vous n'avez pas encore d'amis.</p>
              <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-2">Partagez votre nom pour être ajouté !</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedProfile && (
          <ProfileModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} onRemoveFriend={removeFriend} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FriendsPage;
