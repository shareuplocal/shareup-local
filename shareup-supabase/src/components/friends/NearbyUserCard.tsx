import React from 'react';
import { UserPlus } from 'lucide-react';
import { PublicProfile } from '../../types';

interface NearbyUserCardProps {
  user: PublicProfile;
  onAddFriend: (user: PublicProfile) => void;
  isFriend: boolean;
  currentUserId?: string;
}

const NearbyUserCard = ({ user, onAddFriend, isFriend, currentUserId }: NearbyUserCardProps) => {
  return (
    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img 
          src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
          alt={user.displayName} 
          className="w-12 h-12 rounded-2xl object-cover"
          referrerPolicy="no-referrer"
        />
        <div>
          <p className="font-bold text-gray-900">{user.displayName}</p>
          <p className="text-[10px] text-gray-400">À proximité</p>
        </div>
      </div>
      {user.id !== currentUserId && !isFriend && (
        <button 
          onClick={() => onAddFriend(user)}
          className="bg-green-600 text-white p-3 rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-100"
          aria-label={`Ajouter ${user.displayName} en ami`}
        >
          <UserPlus size={20} />
        </button>
      )}
    </div>
  );
};

export default NearbyUserCard;
