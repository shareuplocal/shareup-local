import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, mapProfile, mapPublicProfile, mapFriend, mapFriendRequest, mapDonation } from '../supabase';
import { logout } from '../supabase';
import {
  Camera, ChevronRight, Award, Users, Leaf, Settings as SettingsIcon,
  Trash2, UserCog, X, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, PublicProfile, FriendRequest, Friend, Donation } from '../types';
import { cn, handleFirestoreError, OperationType } from '../lib/utils';
import ImpactSection from '../components/profile/ImpactSection';
import BadgeGrid from '../components/profile/BadgeGrid';
import FriendsSection from '../components/profile/FriendsSection';
import SettingsSection from '../components/profile/SettingsSection';
import ProfileHeader from '../components/profile/ProfileHeader';
import DeleteAccountModal from '../components/profile/DeleteAccountModal';
import InfoModal, { InfoModalConfig } from '../components/ui/InfoModal';
import { ChatService } from '../lib/ChatService';
import AdminDashboard from '../components/AdminDashboard';
import { ConfirmActionConfig } from '../types';
import { useAuth } from '../AuthContext';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { isQuotaExceeded } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sharedDonations, setSharedDonations] = useState<Donation[]>([]);
  const [activeTab, setActiveTab] = useState<'impact' | 'badges' | 'friends' | 'shared' | 'settings' | 'admin'>('impact');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmActionConfig | null>(null);
  const [infoModal, setInfoModal] = useState<Omit<InfoModalConfig, 'onClose'> | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const [{ data: pData }, { data: ppData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('public_profiles').select('*').eq('id', user.id).single(),
      ]);

      if (pData) setProfile(mapProfile(pData));
      if (ppData) setPublicProfile(mapPublicProfile(ppData));
      setLoading(false);

      // Charger les amis
      const { data: friendsData } = await supabase
        .from('friends').select('*').eq('user_id', user.id);
      setFriends((friendsData || []).map(mapFriend));

      // Charger les demandes d'amis
      const { data: reqData } = await supabase
        .from('friend_requests').select('*').eq('to_id', user.id).eq('status', 'pending');
      setFriendRequests((reqData || []).map(mapFriendRequest));

      // Écoute temps réel du profil
      const channel = supabase.channel(`profile-page-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => { if (payload.new) setProfile(mapProfile(payload.new)); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'public_profiles', filter: `id=eq.${user.id}` },
          (payload) => { if (payload.new) setPublicProfile(mapPublicProfile(payload.new)); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, async () => {
          const { data } = await supabase.from('friends').select('*').eq('user_id', user.id);
          setFriends((data || []).map(mapFriend));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `to_id=eq.${user.id}` }, async () => {
          const { data } = await supabase.from('friend_requests').select('*').eq('to_id', user.id).eq('status', 'pending');
          setFriendRequests((data || []).map(mapFriendRequest));
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    loadUser();
  }, [navigate]);

  // Charger les donations partagées
  useEffect(() => {
    const ids = profile?.sharedDonationIds?.slice(-10);
    if (!ids?.length) { setSharedDonations([]); return; }

    const fetchShared = async () => {
      const { data } = await supabase.from('donations').select('*').in('id', ids);
      setSharedDonations((data || []).map(mapDonation));
    };
    fetchShared();
  }, [profile?.sharedDonationIds]);

  const handlePhotoChange = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upload dans Supabase Storage
    const fileName = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
    const { data: uploadData, error } = await supabase.storage
      .from('donation-images')
      .upload(fileName, file, { upsert: true });

    if (error) { console.error('Upload error:', error); return; }

    const { data: urlData } = supabase.storage
      .from('donation-images')
      .getPublicUrl(fileName);

    const photoURL = urlData.publicUrl;
    await supabase.from('profiles').update({ photo_url: photoURL }).eq('id', user.id);
    await supabase.from('public_profiles').update({ photo_url: photoURL }).eq('id', user.id);
    setStatusMessage('Photo de profil mise à jour !');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Ajouter à la table amis dans les deux sens
      await supabase.from('friends').insert([
        { user_id: user.id, friend_id: request.fromId, friend_name: request.fromName, friend_photo: request.fromPhoto },
        { user_id: request.fromId, friend_id: user.id, friend_name: profile?.displayName || '', friend_photo: profile?.photoURL || '' },
      ]);

      // Mettre à jour le statut de la demande
      await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', request.id);

      // Incrémenter friendsCount pour les deux
      for (const uid of [user.id, request.fromId]) {
        const { data } = await supabase.from('public_profiles').select('stats').eq('id', uid).single();
        if (data) {
          const newStats = { ...data.stats, friendsCount: (data.stats?.friendsCount || 0) + 1 };
          await supabase.from('public_profiles').update({ stats: newStats }).eq('id', uid);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'friend_requests');
    }
  };

  const handleRejectRequest = async (request: FriendRequest) => {
    try {
      await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', request.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'friend_requests');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !window.confirm('Voulez-vous vraiment retirer cet ami ?')) return;

    try {
      await supabase.from('friends').delete().eq('user_id', user.id).eq('friend_id', friendId);
      await supabase.from('friends').delete().eq('user_id', friendId).eq('friend_id', user.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'friends');
    }
  };

  const handleDeleteAccount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      setIsDeleting(true);

      // Supprimer toutes les données de l'utilisateur
      await supabase.from('donations').delete().eq('donor_id', user.id);
      await supabase.from('friend_requests').delete().or(`from_id.eq.${user.id},to_id.eq.${user.id}`);
      await supabase.from('friends').delete().or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
      await ChatService.deleteConversationsByUserId(user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.from('public_profiles').delete().eq('id', user.id);

      // Supprimer le compte auth
      await supabase.rpc('delete_user');
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Une erreur est survenue lors de la suppression du compte.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleResetAllStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profile?.isAdmin) return;

    setConfirmConfig({
      title: 'RÉINITIALISER TOUTE LA PLATEFORME ?',
      message: 'ATTENTION : Cette action va supprimer TOUS les dons, messages et statistiques. Irréversible.',
      onConfirm: async () => {
        try {
          setLoading(true);
          await supabase.from('donations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('friend_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('stats').delete().neq('id', 'placeholder');

          // Reset les stats de tout le monde
          const { data: allPublic } = await supabase.from('public_profiles').select('id');
          for (const p of allPublic || []) {
            if (p.id !== user.id) {
              await supabase.from('public_profiles').update({
                stats: { donationsCount: 0, foodSavedKg: 0, friendsCount: 0, receivedCount: 0, sharedCount: 0 },
                badges: [],
              }).eq('id', p.id);
            }
          }
          await supabase.from('public_profiles').update({
            stats: { donationsCount: 0, foodSavedKg: 0, friendsCount: 0, receivedCount: 0, sharedCount: 0 },
            badges: ['pioneer'],
          }).eq('id', user.id);

          setStatusMessage('Plateforme réinitialisée avec succès.');
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, 'platform_reset');
        } finally {
          setLoading(false);
        }
      },
      type: 'danger',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-50 rounded-full animate-spin border-t-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Leaf className="text-indigo-600 animate-pulse" size={20} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {statusMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-xl">
          {statusMessage}
        </div>
      )}

      <ProfileHeader
        profile={profile}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        publicProfile={publicProfile}
        onPhotoChange={handlePhotoChange}
        onLogout={handleLogout}
      />

      {/* Tabs */}
      <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-4">
        <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-none">
          {[
            { id: 'impact', label: 'Impact', icon: <Leaf size={16} /> },
            { id: 'badges', label: 'Badges', icon: <Award size={16} /> },
            { id: 'friends', label: 'Amis', icon: <Users size={16} /> },
            { id: 'settings', label: 'Paramètres', icon: <SettingsIcon size={16} /> },
            ...(profile?.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: <UserCog size={16} /> }] : []),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border-b-2',
                activeTab === tab.id
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              )}
            >
              {tab.icon} {tab.label}
              {tab.id === 'friends' && friendRequests.length > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {friendRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="pb-32">
        {activeTab === 'impact' && <ImpactSection publicProfile={publicProfile} />}
        {activeTab === 'badges' && <BadgeGrid badges={publicProfile?.badges || []} />}
        {activeTab === 'friends' && (
          <FriendsSection
            friends={friends}
            friendRequests={friendRequests}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onRemoveFriend={handleRemoveFriend}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsSection
            profile={profile}
            onLogout={handleLogout}
            onDeleteAccount={() => setShowDeleteConfirm(true)}
          />
        )}
        {activeTab === 'admin' && profile?.role === 'admin' && (
          <AdminDashboard
            onResetStats={handleResetAllStats}
            confirmConfig={confirmConfig}
            setConfirmConfig={setConfirmConfig}
          />
        )}
      </div>

      <DeleteAccountModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeleting}
      />

      {infoModal && (
        <InfoModal {...infoModal} onClose={() => setInfoModal(null)} />
      )}
    </div>
  );
};

export default ProfilePage;


