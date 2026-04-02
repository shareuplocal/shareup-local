import React from 'react';
import { motion } from 'motion/react';
import { Leaf, Award, Users, Utensils, Droplets, Sparkles } from 'lucide-react';
import { PublicProfile } from '../../types';

interface ImpactSectionProps {
  publicProfile: PublicProfile;
}

const ImpactSection: React.FC<ImpactSectionProps> = ({ publicProfile }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-6 rounded-[2rem] shadow-2xl shadow-slate-900/5 border-white/60 flex flex-col items-center text-center group">
          <div className="bg-brand-50 p-3 rounded-2xl text-brand-600 mb-3 group-hover:scale-110 transition-transform">
            <Leaf size={24} />
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tighter">{(publicProfile.stats?.foodSavedKg || 0).toFixed(1)}</p>
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">kg sauvés</p>
        </div>
        <div className="glass-card p-6 rounded-[2rem] shadow-2xl shadow-slate-900/5 border-white/60 flex flex-col items-center text-center group">
          <div className="bg-purple-50 p-3 rounded-2xl text-purple-600 mb-3 group-hover:scale-110 transition-transform">
            <Award size={24} />
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tighter">{publicProfile.badges?.length || 0}</p>
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Badges</p>
        </div>
        <div className="glass-card p-6 rounded-[2rem] shadow-2xl shadow-slate-900/5 border-white/60 flex flex-col items-center text-center group">
          <div className="bg-pink-50 p-3 rounded-2xl text-pink-600 mb-3 group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tighter">{publicProfile.stats?.friendsCount || 0}</p>
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Amis</p>
        </div>
      </div>

      {/* Detailed Impact Stats */}
      <div className="glass-card p-10 rounded-[3rem] shadow-2xl shadow-slate-900/5 border-white/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 text-brand-50 opacity-20">
          <Leaf size={160} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-brand-500 p-3 rounded-2xl text-white shadow-lg shadow-brand-200">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Impact Environnemental</h2>
              <p className="text-slate-500 text-xs font-medium">Vos dons font une réelle différence</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center bg-slate-50/50 p-8 rounded-[2.5rem] border border-white/40 shadow-inner group hover:bg-white transition-all"
            >
              <div className="bg-brand-100 p-5 rounded-3xl mb-5 group-hover:scale-110 transition-transform shadow-sm">
                <Utensils className="text-brand-600" size={36} />
              </div>
              <p className="text-5xl font-black leading-none tracking-tighter text-slate-900">{publicProfile.stats?.donationsCount || 0}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-4">Dons effectués</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center text-center bg-slate-50/50 p-8 rounded-[2.5rem] border border-white/40 shadow-inner group hover:bg-white transition-all"
            >
              <div className="bg-blue-100 p-5 rounded-3xl mb-5 group-hover:scale-110 transition-transform shadow-sm">
                <Droplets className="text-blue-600" size={36} />
              </div>
              <p className="text-5xl font-black leading-none tracking-tighter text-slate-900">{((publicProfile.stats?.foodSavedKg || 0) * 800).toLocaleString()}L</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-4">Eau Préservée</p>
            </motion.div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.2em] text-center italic leading-relaxed">
              Calculé sur la base des données OpenFoodFacts
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ImpactSection;
