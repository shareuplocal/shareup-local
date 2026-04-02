import React, { useState, useEffect, useRef } from 'react';
import { supabase, mapMessage, mapDonation, mapConversation } from '../supabase';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2, X } from 'lucide-react';
import { cn, handleFirestoreError, OperationType } from '../lib/utils';
import { checkBadges } from '../lib/badges';
import { Donation, Conversation, FirestoreDate } from '../types';

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: FirestoreDate;
  isSystem?: boolean;
}

interface ChatWindowProps {
  conversationId: string;
  donationId: string;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, donationId, onClose }) => {
  const { user, isQuotaExceeded } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [donation, setDonation] = useState<Donation | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isSupport = donationId === 'admin_support';

  useEffect(() => {
    const fetchInitialData = async () => {
      // Charger les messages
      const { data: msgData } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages((msgData || []).map(row => ({
        id: row.id,
        text: row.text,
        senderId: row.sender_id,
        createdAt: row.created_at,
        isSystem: row.sender_id === 'system',
      })));

      // Charger la donation ou la conversation support
      if (isSupport) {
        const { data: convData } = await supabase
          .from('conversations').select('*').eq('id', conversationId).single();
        if (convData) setConversation(mapConversation(convData));
      } else {
        const { data: donData } = await supabase
          .from('donations').select('*').eq('id', donationId).single();
        if (donData) setDonation(mapDonation(donData));
      }
    };

    fetchInitialData();

    // Écoute des nouveaux messages en temps réel
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const row = payload.new as any;
        setMessages(prev => [...prev, {
          id: row.id,
          text: row.text,
          senderId: row.sender_id,
          createdAt: row.created_at,
          isSystem: row.sender_id === 'system',
        }]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'donations',
        filter: `id=eq.${donationId}`,
      }, (payload) => {
        if (payload.new) setDonation(mapDonation(payload.new));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, donationId, isSupport]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        text,
        created_at: new Date().toISOString(),
      });

      await supabase.from('conversations').update({
        last_message: text,
        last_message_sender_id: user.id,
        updated_at: new Date().toISOString(),
      }).eq('id', conversationId);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `conversations/${conversationId}`);
    }
  };

  const handleConfirm = async () => {
    if (!user || !donation) return;

    const isDonor = user.id === donation.donorId;
    const isReceiver = user.id === donation.receiverId;

    try {
      const updates: any = {};
      if (isDonor) updates.is_confirmed_by_donor = true;
      if (isReceiver) updates.is_confirmed_by_receiver = true;

      // Relire la donation pour vérifier la confirmation de l'autre côté
      const { data: current } = await supabase
        .from('donations').select('*').eq('id', donationId).single();
      if (!current) return;

      const currentDonation = mapDonation(current);
      const willBeFullyConfirmed =
        (isDonor && currentDonation.isConfirmedByReceiver) ||
        (isReceiver && currentDonation.isConfirmedByDonor);

      if (willBeFullyConfirmed) {
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();

        const weight = currentDonation.weightValue || 0;
        const currentYear = new Date().getFullYear();
        const yearKey = `donationsCount_${currentYear}`;

        // Stats du donneur
        const { data: donorPub } = await supabase
          .from('public_profiles').select('stats, badges').eq('id', currentDonation.donorId).single();
        if (donorPub) {
          const ds = donorPub.stats || {};
          const newStats = {
            ...ds,
            donationsCount: (ds.donationsCount || 0) + 1,
            foodSavedKg: (ds.foodSavedKg || 0) + weight,
            [yearKey]: (ds[yearKey] || 0) + 1,
          };
          await supabase.from('public_profiles').update({ stats: newStats }).eq('id', currentDonation.donorId);
          checkBadges(currentDonation.donorId, newStats, donorPub.badges || []);
        }

        // Stats du receveur
        if (currentDonation.receiverId) {
          const { data: recvPub } = await supabase
            .from('public_profiles').select('stats, badges').eq('id', currentDonation.receiverId).single();
          if (recvPub) {
            const rs = recvPub.stats || {};
            const newStats = {
              ...rs,
              receivedCount: (rs.receivedCount || 0) + 1,
              foodSavedKg: (rs.foodSavedKg || 0) + weight,
              [yearKey]: (rs[yearKey] || 0) + 1,
            };
            await supabase.from('public_profiles').update({ stats: newStats }).eq('id', currentDonation.receiverId);
            checkBadges(currentDonation.receiverId, newStats, recvPub.badges || []);
          }
        }
      }

      await supabase.from('donations').update(updates).eq('id', donationId);

      // Message système
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: 'system',
        text: `✅ ${user.displayName || 'Un utilisateur'} a validé le don.`,
        created_at: new Date().toISOString(),
      });

      if (willBeFullyConfirmed) {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: 'system',
          text: '🎉 Le don est maintenant finalisé ! Merci à tous les deux.',
          created_at: new Date(Date.now() + 100).toISOString(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `donations/${donationId}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-white flex flex-col">
      <header className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
          <div>
            <h2 className="font-bold text-gray-900">{isSupport ? 'Équipe ShareUP' : (donation?.title || 'Chat')}</h2>
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">En direct</p>
          </div>
        </div>
        {!isSupport && donation?.status !== 'completed' && (
          <button
            onClick={handleConfirm}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2',
              (user?.id === donation?.donorId ? donation?.isConfirmedByDonor : donation?.isConfirmedByReceiver)
                ? 'bg-green-100 text-green-700'
                : 'bg-green-600 text-white shadow-lg shadow-green-100'
            )}
          >
            <CheckCircle2 size={16} />
            {(user?.id === donation?.donorId ? donation?.isConfirmedByDonor : donation?.isConfirmedByReceiver)
              ? 'Confirmé' : 'Valider le don'}
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {!isSupport && donation?.status !== 'completed' && (
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-blue-800">Confirmation du don</p>
              <p className="text-[10px] text-blue-600">Les deux parties doivent valider pour finaliser le don.</p>
            </div>
            <button
              onClick={handleConfirm}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap',
                (user?.id === donation?.donorId ? donation?.isConfirmedByDonor : donation?.isConfirmedByReceiver)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-green-600 text-white shadow-lg shadow-green-100'
              )}
            >
              <CheckCircle2 size={16} />
              {(user?.id === donation?.donorId ? donation?.isConfirmedByDonor : donation?.isConfirmedByReceiver)
                ? 'Confirmé' : 'Valider'}
            </button>
          </div>
        )}

        {donation?.status === 'completed' && (
          <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center">
            <CheckCircle2 className="mx-auto text-green-600 mb-2" size={32} />
            <p className="font-bold text-green-800">Don validé !</p>
            <p className="text-xs text-green-600">Merci d'avoir contribué à ShareUP.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'max-w-[85%] p-4 rounded-3xl text-sm font-medium shadow-sm',
                msg.isSystem
                  ? 'self-center bg-gray-50 text-gray-500 text-[10px] uppercase tracking-widest font-black border border-gray-100 text-center'
                  : msg.senderId === user?.uid
                    ? 'bg-green-600 text-white rounded-tr-none self-end'
                    : 'bg-gray-100 text-gray-800 rounded-tl-none self-start'
              )}
            >
              {msg.text}
            </div>
          ))}
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
        {conversation?.type === 'welcome' ? (
          <div className="text-center py-2 text-gray-400 text-xs font-bold italic">
            Ceci est un message automatique, vous ne pouvez pas y répondre.
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Écrivez votre message..."
              className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit"
              className="bg-green-600 text-white p-3 rounded-2xl shadow-lg shadow-green-100 hover:scale-110 active:scale-95 transition-all">
              <Send size={20} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatWindow;
