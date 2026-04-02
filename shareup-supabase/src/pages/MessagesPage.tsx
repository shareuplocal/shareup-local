import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'motion/react';
import { MessageSquare, User, ChevronRight, Sparkles, Search, Trash2 } from 'lucide-react';
import { supabase, mapConversation } from '../supabase';
import { useAuth } from '../AuthContext';
import ChatWindow from '../components/ChatWindow';
import { useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ChatService } from '../lib/ChatService';
import { Conversation } from '../types';

const SwipeableConversation = ({
  conv,
  onSelect,
  onDelete,
}: {
  conv: Conversation;
  onSelect: () => void;
  onDelete: (id: string) => Promise<void>;
}) => {
  const { user } = useAuth();
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, -20], [1, 0]);
  const scale = useTransform(x, [-100, -20], [1, 0.5]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -80 || info.velocity.x < -500) {
      onDelete(conv.id);
    }
    x.set(0);
  };

  const isUnread = conv.lastMessageSenderId !== user?.uid;
  const isSupport = conv.donationId === 'admin_support';

  // Formatage de la date (string ISO)
  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] mb-4 group shadow-sm">
      <div className="absolute inset-0 flex justify-end items-center px-8 bg-red-500">
        <motion.div
          style={{ opacity, scale }}
          className="flex items-center gap-3 text-white font-black uppercase tracking-widest text-xs"
        >
          <Trash2 size={20} /> Supprimer
        </motion.div>
      </div>
      <motion.button
        drag="x"
        dragConstraints={{ left: -140, right: 0 }}
        dragElastic={0.05}
        style={{ x }}
        onDragEnd={handleDragEnd}
        onClick={onSelect}
        className="relative z-10 w-full p-6 glass-card flex items-center gap-5 cursor-grab active:cursor-grabbing text-left border-white/60 hover:bg-white/90 transition-colors"
      >
        <div className="w-16 h-16 bg-brand-50 rounded-[1.5rem] flex items-center justify-center text-brand-600 shrink-0 relative shadow-inner border-2 border-white">
          <User size={32} />
          {isUnread && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 border-4 border-white rounded-full animate-pulse shadow-lg" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1.5">
            <h3 className={cn('font-black text-slate-900 truncate text-lg tracking-tight', isUnread && 'text-brand-600')}>
              {isSupport ? "Équipe ShareUP" : `Conversation #${conv.id.slice(0, 4)}`}
            </h3>
            {conv.updatedAt && (
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-2">
                {formatTime(conv.updatedAt as string)}
              </span>
            )}
          </div>
          <p className={cn('text-sm truncate leading-relaxed', isUnread ? 'text-slate-900 font-black' : 'text-slate-500 font-medium')}>
            {conv.lastMessage || 'Aucun message'}
          </p>
        </div>
        <ChevronRight size={20} className="text-slate-300 shrink-0 group-hover:text-brand-400 transition-colors" />
      </motion.button>
    </div>
  );
};

const MessagesPage = () => {
  const { user, isQuotaExceeded } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<{ id: string; donationId: string } | null>(null);

  useEffect(() => {
    if (location.state?.activeChat) {
      setActiveChat(location.state.activeChat);
    }
  }, [location.state]);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [user.id])
        .order('updated_at', { ascending: false });
      const docs = (data || []).map(mapConversation);
      setConversations(docs);
      if (activeChat && !docs.some(d => d.id === activeChat.id)) {
        setActiveChat(null);
      }
    };

    fetchConversations();

    const channel = supabase
      .channel('conversations-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchConversations)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const handleDeleteConversation = async (id: string) => {
    await ChatService.deleteConversationById(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="p-6 pb-32 bg-slate-50 min-h-screen"
    >
      <header className="mb-10 pt-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-brand-100 p-2.5 rounded-2xl text-brand-600 shadow-sm">
            <Sparkles className="text-brand-600" size={22} />
          </div>
          <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em]">Messagerie</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Messages</h1>
        <p className="text-slate-500 mt-2 font-medium">Discutez avec vos voisins pour organiser les remises.</p>
      </header>

      <div className="space-y-4 max-w-2xl mx-auto">
        {conversations.map((conv) => (
          <div key={conv.id}>
            <SwipeableConversation
              conv={conv}
              onSelect={() => setActiveChat({ id: conv.id, donationId: conv.donationId })}
              onDelete={handleDeleteConversation}
            />
          </div>
        ))}

        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-slate-300">
            <div className="bg-slate-100 p-10 rounded-[3rem] mb-8 shadow-inner">
              <MessageSquare size={80} className="opacity-10" />
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">Aucune conversation</p>
            <p className="text-sm text-center max-w-xs mt-3 font-medium text-slate-500 leading-relaxed">
              Les messages apparaîtront ici quand vous contacterez un donneur.
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeChat && (
          <ChatWindow
            conversationId={activeChat.id}
            donationId={activeChat.donationId}
            onClose={() => setActiveChat(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MessagesPage;
