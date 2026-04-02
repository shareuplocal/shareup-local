import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { PublicProfile } from '../../types';

interface FriendCardProps {
  friend: PublicProfile;
  onClick: (friend: PublicProfile) => void;
}

const FriendCard = ({ friend, onClick }: FriendCardProps) => {
  return (
    <motion.button 
      layout
      onClick={() => onClick(friend)}
      className="w-full bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-green-200 transition-all text-left"
      aria-label={`Voir le profil de ${friend.displayName}`}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <img 
            src={friend.photoURL || `https://ui-avatars.com/api/?name=${friend.displayName}`} 
            alt={friend.displayName} 
            className="w-14 h-14 rounded-[1.5rem] object-cover shadow-lg"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white shadow-sm" />
        </div>
        <div>
          <p className="font-black text-gray-900 text-lg tracking-tight">{friend.displayName}</p>
          <div className="flex items-center gap-1 text-green-600">
            <Sparkles size={10} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Ami ShareUP</span>
          </div>
        </div>
      </div>
      <ChevronRight size={20} className="text-gray-300" />
    </motion.button>
  );
};

export default FriendCard;
