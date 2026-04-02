import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';
import { supabase, logout } from '../supabase';
import { ArrowLeft, Save, User, Loader2, Bell, MessageSquare, Radius, ShieldAlert, Mail, HelpCircle, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationService } from '../lib/NotificationService';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { ChatService } from '../lib/ChatService';

const SettingsPage = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [notifDonations, setNotifDonations] = useState(profile?.notifications?.newDonations ?? true);
  const [notifMessages, setNotifMessages] = useState(profile?.notifications?.newMessages ?? true);
  const [notifRadius, setNotifRadius] = useState(profile?.notifications?.radius ?? 10);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setNotifDonations(profile.notifications?.newDonations ?? true);
      setNotifMessages(profile.notifications?.newMessages ?? true);
      setNotifRadius(profile.notifications?.radius ?? 10);
    }
  }, [profile]);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      if (notifDonations || notifMessages) {
        await NotificationService.getInstance().requestPermission();
      }

      await supabase.from('profiles').update({
        display_name: displayName,
        notifications: { newDonations: notifDonations, newMessages: notifMessages, radius: notifRadius },
      }).eq('id', user.id);

      await supabase.from('public_profiles').update({ display_name: displayName }).eq('id', user.id);

      setStatusMessage('Paramètres mis à jour !');
      setTimeout(() => navigate('/profile'), 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setStatusMessage('Erreur lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setLoading(true);
    setShowDeleteConfirm(false);
    try {
      await supabase.from('donations').delete().eq('donor_id', user.id);
      await supabase.from('friend_requests').delete().or(`from_id.eq.${user.id},to_id.eq.${user.id}`);
      await supabase.from('friends').delete().or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
      await ChatService.deleteConversationsByUserId(user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.from('public_profiles').delete().eq('id', user.id);
      await supabase.rpc('delete_user');
      setStatusMessage('Compte supprimé avec succès.');
      navigate('/login');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.id}`);
      setStatusMessage('Erreur lors de la suppression.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAllStats = async () => {
    if (profile?.role !== 'admin') { setStatusMessage('Accès refusé.'); return; }
    setShowResetConfirm(false);
    setLoading(true);
    try {
      await supabase.from('donations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      const { data: allPublic } = await supabase.from('public_profiles').select('id, stats');
      for (const p of allPublic || []) {
        await supabase.from('public_profiles').update({
          stats: { donationsCount: 0, foodSavedKg: 0, friendsCount: p.stats?.friendsCount || 0, receivedCount: 0, sharedCount: 0 },
          badges: ['pioneer'],
        }).eq('id', p.id);
      }
      setStatusMessage('Remise à zéro effectuée !');
    } catch (error) {
      setStatusMessage(`Erreur : ${(error as Error).message || 'Une erreur est survenue'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
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
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Paramètres</h1>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-col items-center mb-8">
          <img
            src={profile?.photoURL || `https://ui-avatars.com/api/?name=${displayName}`}
            alt="Avatar"
            className="w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-2xl object-cover"
            referrerPolicy="no-referrer"
          />
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">Photo Google</p>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nom d'affichage</label>
            <div className="relative">
              <User className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input
                type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-8 py-2 font-bold text-gray-900 focus:outline-none placeholder:text-gray-200"
                placeholder="Votre nom" required
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Notifications</h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-50 p-2 rounded-xl text-green-600"><Bell size={20} /></div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Nouveaux dons</p>
                  <p className="text-[10px] text-gray-400">Dons à proximité</p>
                </div>
              </div>
              <button type="button" onClick={() => setNotifDonations(!notifDonations)}
                className={`w-12 h-6 rounded-full transition-colors relative ${notifDonations ? 'bg-green-600' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifDonations ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><MessageSquare size={20} /></div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Messages</p>
                  <p className="text-[10px] text-gray-400">Nouvelles conversations</p>
                </div>
              </div>
              <button type="button" onClick={() => setNotifMessages(!notifMessages)}
                className={`w-12 h-6 rounded-full transition-colors relative ${notifMessages ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifMessages ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="pt-4 border-t border-gray-50">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Radius size={14} className="text-gray-400" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rayon de notification</span>
                </div>
                <span className="text-sm font-black text-green-600">{notifRadius} km</span>
              </div>
              <input type="range" min="1" max="20" step="1" value={notifRadius}
                onChange={(e) => setNotifRadius(parseInt(e.target.value))}
                className="w-full h-1.5 bg-green-100 rounded-lg appearance-none cursor-pointer accent-green-600" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-gray-900 text-white font-black py-5 rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          Enregistrer les paramètres
        </button>

        <div className="pt-8 space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Support & Aide</h3>
          <a href={`mailto:shareuplocal@gmail.com?subject=[SUPPORT] ${profile?.displayName}&body=Bonjour,%0D%0A%0D%0A[Décrivez votre problème ici]%0D%0A%0D%0AUtilisateur : ${profile?.displayName}`}
            className="w-full flex items-center justify-between p-5 bg-white rounded-3xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Mail size={20} /></div>
              <span className="font-bold text-gray-700">Contacter le support</span>
            </div>
            <HelpCircle size={18} className="text-gray-300" />
          </a>
        </div>

        <div className="pt-10 border-t border-red-100">
          <h3 className="text-xs font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2">
            <UserX size={16} /> Zone de danger
          </h3>
          <button type="button" onClick={() => setShowDeleteConfirm(true)} disabled={loading}
            className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl border-2 border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : <UserX size={20} />}
            Supprimer mon compte définitivement
          </button>
        </div>

        {profile?.role === 'admin' && (
          <div className="pt-10 border-t border-red-100">
            <h3 className="text-xs font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldAlert size={16} /> Administration
            </h3>
            <button type="button" onClick={() => setShowResetConfirm(true)} disabled={loading}
              className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl border-2 border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-all disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" /> : <ShieldAlert size={20} />}
              Remettre toutes les stats à zéro
            </button>
          </div>
        )}
      </form>

      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-[9000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Action Critique</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                Cette action va supprimer <strong>TOUS</strong> les dons et remettre à zéro les statistiques. Irréversible.
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={handleResetAllStats} className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-200">
                  Confirmer la réinitialisation
                </button>
                <button onClick={() => setShowResetConfirm(false)} className="w-full bg-gray-100 text-gray-600 font-black py-4 rounded-2xl">
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[9000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <UserX size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Supprimer le compte ?</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                Cette action est irréversible. Toutes vos données seront supprimées définitivement.
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={handleDeleteAccount} className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-200">
                  Confirmer la suppression
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="w-full bg-gray-100 text-gray-600 font-black py-4 rounded-2xl">
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SettingsPage;
