import React from 'react';
import { motion } from 'motion/react';
import { X, User, TrendingUp, Leaf, Users, UserMinus } from 'lucide-react';

import { PublicProfile } from '../../types';

interface ProfileModalProps {
  profile: PublicProfile;
  onClose: () => void;
  onRemoveFriend?: (id: string) => void;
}

const ProfileModal = ({ 
  profile, 
  onClose,
  onRemoveFriend 
}: ProfileModalProps) => {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden"
      >
        <div className="h-32 bg-gradient-to-br from-green-400 to-blue-500 relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="px-8 pb-8 -mt-16 relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="w-32 h-32 bg-white rounded-[2.5rem] p-1 shadow-2xl mb-4">
              <div className="w-full h-full bg-gray-50 rounded-[2.2rem] flex items-center justify-center text-gray-400 overflow-hidden">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={64} />
                )}
              </div>
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{profile.displayName}</h2>
            <p className="text-sm text-gray-500 font-medium mb-6">Membre depuis {profile.createdAt ? new Date(profile.createdAt as string).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'récemment'}</p>
            
            <div className="grid grid-cols-3 gap-3 w-full mb-8">
              <div className="bg-gray-50 p-3 rounded-2xl">
                <TrendingUp size={16} className="text-green-600 mx-auto mb-1" />
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Dons</p>
                <p className="text-sm font-black text-gray-900">{profile.stats?.donationsCount || 0}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl">
                <Leaf size={16} className="text-blue-600 mx-auto mb-1" />
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Sauvé</p>
                <p className="text-sm font-black text-gray-900">{profile.stats?.foodSavedKg?.toFixed(1) || 0}kg</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl">
                <Users size={16} className="text-purple-600 mx-auto mb-1" />
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Amis</p>
                <p className="text-sm font-black text-gray-900">{profile.stats?.friendsCount || 0}</p>
              </div>
            </div>

            <div className="w-full space-y-3">
              {onRemoveFriend && (
                <button
                  onClick={() => {
                    onRemoveFriend(profile.uid);
                    onClose();
                  }}
                  className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                >
                  <UserMinus size={20} />
                  Retirer des amis
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileModal;
