import React from 'react';
import { motion } from 'motion/react';
import { Award, Leaf, ShoppingBag, ShieldCheck, Sparkles, Users, Settings, Wind, HandHeart, Share2, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PublicProfile } from '../../types';

interface BadgeGridProps {
  publicProfile: PublicProfile;
  onBadgeClick: (title: string, desc: string) => void;
}

const BadgeGrid: React.FC<BadgeGridProps> = ({ publicProfile, onBadgeClick }) => {
  const badgeGroups = [
    {
      category: "Spécial",
      badges: [
        { id: 'master_of_all', title: 'Maître de ShareUP', desc: 'Le badge ultime pour avoir débloqué tous les autres badges !', icon: ShieldCheck, color: 'bg-indigo-600 text-white' },
        { id: 'pioneer', title: 'Pionnier', desc: 'Badge accordé aux premiers membres de la communauté.', icon: Award, color: 'bg-purple-600 text-white' },
        { id: 'ultimate_donor', title: 'Donneur Ultime', desc: 'Le plus grand nombre de dons sur l\'année en cours !', icon: Sparkles, color: 'bg-yellow-500 text-white' },
        { id: 'ultimate_donor_2025', title: 'Légende 2025', desc: 'Donneur Ultime de l\'année 2025.', icon: Award, color: 'bg-amber-600 text-white' },
        { id: 'ultimate_donor_2026', title: 'Légende 2026', desc: 'Donneur Ultime de l\'année 2026.', icon: Award, color: 'bg-amber-700 text-white' },
      ]
    },
    {
      category: "Impact Écologique",
      badges: [
        { id: 'eco_hero_bronze', title: 'Éco-Héros Bronze', desc: 'Sauvez plus de 10kg de nourriture. Saviez-vous que 10kg de nourriture gaspillée équivaut à 25kg de CO2 émis ?', icon: Leaf, color: 'bg-orange-600 text-white' },
        { id: 'eco_hero_silver', title: 'Éco-Héros Argent', desc: 'Sauvez plus de 50kg de nourriture. C\'est l\'équivalent de 125 repas sauvés de la poubelle !', icon: Leaf, color: 'bg-slate-400 text-white' },
        { id: 'eco_hero_gold', title: 'Éco-Héros Or', desc: 'Sauvez plus de 200kg de nourriture. Vous avez évité le gaspillage de 50 000 litres d\'eau nécessaires à sa production !', icon: Leaf, color: 'bg-yellow-500 text-white' },
        { id: 'eco_hero_diamond', title: 'Éco-Héros Diamant', desc: 'Sauvez plus de 1000kg de nourriture. Un impact colossal : c\'est le poids d\'une petite voiture en nourriture sauvée !', icon: Sparkles, color: 'bg-blue-500 text-white' },
        { id: 'zero_waste', title: 'Zéro Gaspi', desc: 'Sauvez plus de 500kg de nourriture. En France, 10 millions de tonnes sont jetées chaque année. Vous faites partie de la solution !', icon: Wind, color: 'bg-emerald-500 text-white' },
      ]
    },
    {
      category: "Générosité (Dons)",
      badges: [
        { id: 'star_donor_bronze', title: 'Donneur Bronze', desc: 'Effectuez au moins 10 dons.', icon: ShoppingBag, color: 'bg-orange-600 text-white' },
        { id: 'star_donor_silver', title: 'Donneur Argent', desc: 'Effectuez au moins 50 dons.', icon: ShoppingBag, color: 'bg-slate-400 text-white' },
        { id: 'star_donor_gold', title: 'Donneur Or', desc: 'Effectuez au moins 200 dons.', icon: ShoppingBag, color: 'bg-yellow-500 text-white' },
        { id: 'star_donor_diamond', title: 'Donneur Diamant', desc: 'Effectuez au moins 500 dons.', icon: Sparkles, color: 'bg-blue-500 text-white' },
        { id: 'legend', title: 'Légende Vivante', desc: 'Effectuez 1000 dons.', icon: ShieldCheck, color: 'bg-red-600 text-white' },
      ]
    },
    {
      category: "Communauté",
      badges: [
        { id: 'earth_friend_bronze', title: 'Ami de la Terre B', desc: 'Invitez 5 amis.', icon: Users, color: 'bg-pink-500 text-white' },
        { id: 'earth_friend_silver', title: 'Ami de la Terre A', desc: 'Invitez 20 amis.', icon: Users, color: 'bg-purple-500 text-white' },
        { id: 'earth_friend_gold', title: 'Ami de la Terre O', desc: 'Invitez 50 amis.', icon: Users, color: 'bg-indigo-500 text-white' },
      ]
    },
    {
      category: "Entraide",
      badges: [
        { id: 'receiver_bronze', title: 'Receveur Bronze', desc: 'Recevez 5 dons.', icon: HandHeart, color: 'bg-orange-600 text-white' },
        { id: 'receiver_silver', title: 'Receveur Argent', desc: 'Recevez 20 dons.', icon: HandHeart, color: 'bg-slate-400 text-white' },
        { id: 'community_pillar', title: 'Pilier de la Communauté', desc: 'Recevez 50 dons.', icon: Users, color: 'bg-indigo-600 text-white' },
        { id: 'receiver_gold', title: 'Receveur Or', desc: 'Recevez 150 dons.', icon: HandHeart, color: 'bg-yellow-500 text-white' },
      ]
    },
    {
      category: "Partage",
      badges: [
        { id: 'share_bronze', title: 'Partageur Bronze', desc: 'Partagez 5 dons.', icon: Share2, color: 'bg-orange-600 text-white' },
        { id: 'share_silver', title: 'Partageur Argent', desc: 'Partagez 20 dons.', icon: Share2, color: 'bg-slate-400 text-white' },
        { id: 'share_gold', title: 'Partageur Or', desc: 'Partagez 50 dons.', icon: Share2, color: 'bg-yellow-500 text-white' },
      ]
    },
    {
      category: "Maîtrise",
      badges: [
        { id: 'oltiis', title: 'Maître Oltiis', desc: 'Maîtrise complète des outils ShareUP (Don, Réception, Amis).', icon: Settings, color: 'bg-slate-700 text-white' },
      ]
    }
  ];

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6 ml-2">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Mes Badges & Défis</h3>
        <span className="text-[10px] font-bold text-gray-300 italic">{publicProfile.badges?.length || 0} débloqués</span>
      </div>
      
      <div className="space-y-8">
        {badgeGroups.map((group) => (
          <div key={group.category} className="space-y-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{group.category}</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {group.badges.map((badge) => {
                const isUnlocked = publicProfile.badges?.includes(badge.id);
                return (
                  <motion.div 
                    key={badge.id}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onBadgeClick(badge.title, badge.desc)}
                    className={cn(
                      "aspect-square rounded-2xl flex items-center justify-center relative cursor-pointer transition-all duration-500",
                      badge.color,
                      !isUnlocked && "opacity-40 grayscale scale-95"
                    )}
                    title={badge.title}
                  >
                    <badge.icon size={24} />
                    {isUnlocked && (
                      <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                        <CheckCircle size={10} className="text-green-500" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BadgeGrid;
