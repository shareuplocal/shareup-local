import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Trash2, Loader2, X, MessageSquare, UserX } from 'lucide-react';
import { PublicProfile, Donation, ConfirmActionConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, mapPublicProfile, mapDonation } from '../supabase';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import SwipeableDonation from './SwipeableDonation';

interface AdminDashboardProps {
  onConfirmAction: (config: ConfirmActionConfig) => void;
  setStatusMessage: (msg: string | null) => void;
}

const AdminDashboard = ({ onConfirmAction, setStatusMessage }: AdminDashboardProps) => {
  const { user: adminUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<PublicProfile[]>([]);
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBadge, setFilterBadge] = useState<string>('');
  const [view, setView] = useState<'users' | 'donations' | 'approvals'>('users');
  const [selectedUser, setSelectedUser] = useState<PublicProfile | null>(null);

  const fetchUsers = () =>
    supabase.from('public_profiles').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => { if (data) setUsers(data.map(mapPublicProfile)); setLoading(false); });

  const fetchDonations = () =>
    supabase.from('donations').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setAllDonations(data.map(mapDonation)); });

  useEffect(() => {
    fetchUsers();
    fetchDonations();

    const chanU = supabase.channel('admin-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'public_profiles' }, fetchUsers)
      .subscribe();

    const chanD = supabase.channel('admin-donations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, fetchDonations)
      .subscribe();

    return () => { supabase.removeChannel(chanU); supabase.removeChannel(chanD); };
  }, []);

  const handleApproveUser = async (userId: string) => {
    const { error } = await supabase.from('public_profiles').update({ is_approved: true }).eq('id', userId);
    if (!error) setStatusMessage("Utilisateur approuvé !");
  };

  const handleRejectUser = (userId: string) => {
    onConfirmAction({
      title: "Supprimer le compte ?",
      message: "Voulez-vous supprimer ce compte définitivement ?",
      onConfirm: async () => {
        await supabase.from('public_profiles').delete().eq('id', userId);
        await supabase.from('profiles').delete().eq('id', userId);
        setStatusMessage("Compte supprimé.");
      },
      type: 'danger'
    });
  };

  const handleContactUser = async (targetUser: PublicProfile) => {
    if (!adminUser) return;
    const conversationId = `admin_${adminUser.id}_${targetUser.id}`;
    const { data: existing } = await supabase.from('conversations').select('id').eq('id', conversationId).single();
    if (!existing) {
      await supabase.from('conversations').insert({
        id: conversationId,
        participants: [adminUser.id, targetUser.id],
        last_message: "Contact administrateur ShareUP",
        last_message_sender_id: adminUser.id,
        donation_id: 'admin_support',
        type: 'admin_support',
      });
    }
    navigate('/messages', { state: { activeChat: { id: conversationId, donationId: 'admin_support' } } });
  };

  const handleResetMessages = () => {
    onConfirmAction({
      title: "Réinitialiser tous les messages ?",
      message: "Supprimer TOUTES les conversations et TOUS les messages ? Irréversible.",
      onConfirm: async () => {
        await supabase.from('conversations').delete().neq('id', '');
        setStatusMessage("Toutes les conversations ont été supprimées.");
      },
      type: 'danger'
    });
  };

  const handleResetPlatform = () => {
    onConfirmAction({
      title: "RÉINITIALISER TOUTE LA PLATEFORME ?",
      message: "ATTENTION : Suppression de TOUS les comptes, dons, messages et stats. IRRÉVERSIBLE.",
      onConfirm: async () => {
        if (!adminUser) return;
        setLoading(true);
        await supabase.from('donations').delete().neq('id', '');
        await supabase.from('conversations').delete().neq('id', '');
        await supabase.from('friend_requests').delete().neq('id', '');
        await supabase.from('friends').delete().neq('id', '');
        await supabase.from('public_profiles').delete().neq('id', adminUser.id);
        await supabase.from('profiles').delete().neq('id', adminUser.id);
        await supabase.from('public_profiles').update({
          stats: { donationsCount: 0, receivedCount: 0, foodSavedKg: 0, friendsCount: 0, sharedCount: 0 },
          badges: ['pioneer'],
        }).eq('id', adminUser.id);
        setStatusMessage("Plateforme réinitialisée avec succès.");
        setLoading(false);
      },
      type: 'danger'
    });
  };

  const filteredUsers = filterBadge ? users.filter(u => u.badges?.includes(filterBadge)) : users;
  const pendingApprovals = users.filter(u => !u.isApproved && u.role !== 'admin');

  const badgesList = [
    'pioneer', 'ultimate_donor', 'eco_hero_bronze', 'eco_hero_silver', 'eco_hero_gold', 'eco_hero_diamond',
    'star_donor_bronze', 'star_donor_silver', 'star_donor_gold', 'star_donor_diamond',
    'earth_friend_bronze', 'earth_friend_silver', 'earth_friend_gold', 'zero_waste', 'legend', 'community_pillar'
  ];

  return (
    <div className="bg-gray-950 rounded-[3rem] p-8 text-white mb-10 shadow-2xl border border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[100px] -ml-32 -mb-32" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/20 p-3 rounded-2xl"><ShieldCheck className="text-blue-400" size={28} /></div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Admin Console</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Gestion de la plateforme</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
            {(['users', 'donations', 'approvals'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={cn("px-4 py-2.5 rounded-xl text-xs font-black transition-all relative", view === v ? "bg-white text-gray-900 shadow-lg" : "text-gray-400 hover:text-white")}
              >
                {v === 'users' ? 'Utilisateurs' : v === 'donations' ? 'Dons' : 'Approvals'}
                {v === 'approvals' && pendingApprovals.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-gray-950 font-black">
                    {pendingApprovals.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button onClick={handleResetMessages}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20 text-red-400"
          ><Trash2 size={14} />Reset Chat</button>
          <button onClick={handleResetPlatform}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-900/20"
          ><ShieldCheck size={14} />Reset Platform</button>
        </div>

        {view === 'users' ? (
          <>
            <div className="mb-6">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Filtrer par Badge</label>
              <select value={filterBadge} onChange={(e) => setFilterBadge(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-400"
              >
                <option value="">Tous les utilisateurs</option>
                {badgesList.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : filteredUsers.map((u, i) => (
                <div key={u.uid || u.id} onClick={() => setSelectedUser(u)}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-gray-500 w-4">{i + 1}</span>
                    <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} className="w-10 h-10 rounded-xl" alt="" />
                    <div>
                      <p className="font-bold text-sm">{u.displayName}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">{u.badges?.length || 0} Badges • {u.stats?.donationsCount || 0} Dons</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {u.badges?.slice(0, 3).map((b: string) => (
                      <div key={b} className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center text-[10px]" title={b}>🏆</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : view === 'donations' ? (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {allDonations.map((d) => (
              <div key={d.id} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <SwipeableDonation id={d.id} donation={d} isOwner={false} isAdmin={true} onConfirmAction={onConfirmAction} setStatusMessage={setStatusMessage} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {pendingApprovals.length === 0 ? (
              <p className="text-center text-gray-500 py-8 font-bold">Aucune approbation en attente</p>
            ) : pendingApprovals.map((u) => (
              <div key={u.uid || u.id} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} className="w-12 h-12 rounded-xl" alt="" />
                  <div><p className="font-bold">{u.displayName}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveUser(u.uid || u.id || '')} className="flex-1 bg-green-600 text-white font-black py-3 rounded-xl text-xs hover:bg-green-700 transition-colors">Approuver</button>
                  <button onClick={() => handleRejectUser(u.uid || u.id || '')} className="flex-1 bg-red-600/20 text-red-400 font-black py-3 rounded-xl text-xs hover:bg-red-600/30 transition-colors">Refuser</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal détail utilisateur */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[8000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative bg-gray-900 rounded-[3rem] p-8 w-full max-w-md shadow-2xl border border-white/10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <img src={selectedUser.photoURL || `https://ui-avatars.com/api/?name=${selectedUser.displayName}`} className="w-20 h-20 rounded-[2rem] border-4 border-white/5 shadow-2xl" alt="" />
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight">{selectedUser.displayName}</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/5 rounded-full text-gray-500"><X size={24} /></button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    { label: 'Dons effectués', value: selectedUser.stats?.donationsCount || 0 },
                    { label: 'Dons reçus', value: selectedUser.stats?.receivedCount || 0 },
                    { label: 'Amis', value: selectedUser.stats?.friendsCount || 0 },
                    { label: 'Nourriture sauvée', value: `${selectedUser.stats?.foodSavedKg?.toFixed(1) || 0}kg` },
                  ].map(s => (
                    <div key={s.label} className="bg-white/5 p-4 rounded-3xl border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{s.label}</p>
                      <p className="text-2xl font-black text-white">{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => handleContactUser(selectedUser)}
                    className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  ><MessageSquare size={20} />Contacter l'utilisateur</button>
                  {!selectedUser.isApproved ? (
                    <button onClick={() => { handleApproveUser(selectedUser.uid || selectedUser.id || ''); setSelectedUser(null); }}
                      className="w-full bg-green-600 text-white font-black py-4 rounded-2xl hover:bg-green-700 transition-all"
                    >Approuver</button>
                  ) : (
                    <button onClick={() => {
                      onConfirmAction({
                        title: "Supprimer ce compte ?",
                        message: `Voulez-vous vraiment supprimer le compte de ${selectedUser.displayName} ? Irréversible.`,
                        onConfirm: async () => {
                          const uid = selectedUser.uid || selectedUser.id || '';
                          await supabase.from('public_profiles').delete().eq('id', uid);
                          await supabase.from('profiles').delete().eq('id', uid);
                          setStatusMessage("Compte supprimé.");
                          setSelectedUser(null);
                        },
                        type: 'danger'
                      });
                    }} className="w-full bg-red-600/20 text-red-400 font-black py-4 rounded-2xl hover:bg-red-600/30 transition-all flex items-center justify-center gap-2"
                    ><UserX size={20} />Supprimer</button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
