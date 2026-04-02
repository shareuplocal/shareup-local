import React from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus, UserMinus, UserCheck, Search, Clock, ShieldCheck, Award, Sparkles } from 'lucide-react';
import { PublicProfile, FriendRequest, Friend } from '../../types';
import { cn } from '../../lib/utils';

interface FriendsSectionProps {
  friends: Friend[];
  friendRequests: FriendRequest[];
  onAcceptRequest: (request: FriendRequest) => void;
  onRejectRequest: (request: FriendRequest) => void;
  onRemoveFriend: (friendId: string) => void;
  onNavigateToUser: (userId: string) => void;
}

const FriendsSection: React.FC<FriendsSectionProps> = ({
  friends,
  friendRequests,
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend,
  onNavigateToUser
}) => {
  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-8 ml-2">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Ma Communauté</h3>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-gray-300 italic">{friends.length} amis</span>
          {friendRequests.length > 0 && (
            <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse">
              {friendRequests.length} NOUVEAU
            </span>
          )}
        </div>
      </div>

      {/* Demandes d'amis */}
      {friendRequests.length > 0 && (
        <div className="mb-10 space-y-4">
          <div className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
            <Clock size={10} /> Demandes en attente
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {friendRequests.map((request) => (
              <motion.div 
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border-2 border-slate-100 rounded-3xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => onNavigateToUser(request.fromId)}>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border-2 border-slate-50">
                    {request.fromPhoto ? (
                      <img src={request.fromPhoto} alt={request.fromName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Users size={20} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{request.fromName}</p>
                    <p className="text-[10px] font-bold text-slate-400 italic">Souhaite devenir votre ami</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onAcceptRequest(request)}
                    className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all duration-300 shadow-sm"
                  >
                    <UserCheck size={18} />
                  </button>
                  <button 
                    onClick={() => onRejectRequest(request)}
                    className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm"
                  >
                    <UserMinus size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Liste d'amis */}
      <div className="space-y-4">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Mes Amis</p>
        {friends.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <motion.div 
                key={friend.id}
                whileHover={{ y: -4 }}
                className="bg-white border-2 border-slate-100 rounded-3xl p-4 flex items-center justify-between group hover:border-indigo-100 transition-all duration-300"
              >
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => onNavigateToUser(friend.id)}>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border-2 border-slate-50 group-hover:border-indigo-50 transition-colors">
                    {friend.friendPhoto ? (
                      <img src={friend.friendPhoto} alt={friend.friendName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Users size={20} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{friend.friendName}</p>
                    <div className="flex items-center gap-1">
                      {friend.badges?.includes('pioneer') && <Award size={10} className="text-purple-500" />}
                      {friend.badges?.includes('master_of_all') && <ShieldCheck size={10} className="text-indigo-500" />}
                      <p className="text-[10px] font-bold text-slate-400 italic">Ami depuis peu</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => onRemoveFriend(friend.id)}
                  className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
                  title="Retirer de mes amis"
                >
                  <UserMinus size={18} />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
              <Users size={32} />
            </div>
            <p className="text-slate-500 font-bold text-sm">Vous n'avez pas encore d'amis.</p>
            <p className="text-slate-400 text-xs mt-1 italic">Invitez vos proches pour partager ensemble !</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsSection;
