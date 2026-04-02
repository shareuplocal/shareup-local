import React from 'react';
import { Donation, UserProfile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Calendar, ShoppingBag, Navigation, Share2, AlertTriangle, ShieldAlert, UserPlus, Info, Award, Utensils, Droplets } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DonationDetailModalProps {
  donation: Donation | null;
  onClose: () => void;
  onReserve: (donation: Donation) => void;
  onNavigate: (lat: number, lng: number) => void;
  onShare: (donation: Donation) => void;
  onReport: (donation: Donation, type: 'donation' | 'user') => void;
  onDelete: (donationId: string) => void;
  isAdmin: boolean;
  currentUser: UserProfile | null;
}

const DonationDetailModal = ({
  donation,
  onClose,
  onReserve,
  onNavigate,
  onShare,
  onReport,
  onDelete,
  isAdmin,
  currentUser
}: DonationDetailModalProps) => {
  if (!donation) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[7000] bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-white w-full max-w-lg rounded-t-[3.5rem] sm:rounded-[3.5rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-64 sm:h-72 bg-slate-100 shrink-0">
          {donation.imageUrl ? (
            <img src={donation.imageUrl} alt={donation.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <ShoppingBag size={80} strokeWidth={1} />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur-md rounded-2xl text-slate-900 shadow-xl hover:bg-white transition-all active:scale-90"
          >
            <X size={24} />
          </button>
          <div className="absolute bottom-6 left-6 flex gap-2">
            <span className="bg-brand-600 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg uppercase tracking-widest">
              {donation.category}
            </span>
            {donation.nutriscore && (
              <span className={cn(
                "text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg uppercase tracking-widest",
                donation.nutriscore === 'a' ? 'bg-green-600' : 
                donation.nutriscore === 'b' ? 'bg-lime-500' :
                donation.nutriscore === 'c' ? 'bg-yellow-500' :
                donation.nutriscore === 'd' ? 'bg-orange-500' : 'bg-red-600'
              )}>
                Nutri {donation.nutriscore.toUpperCase()}
              </span>
            )}
            {donation.ecoscore && (
              <span className={cn(
                "text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg uppercase tracking-widest",
                ['a', 'b'].includes(donation.ecoscore) ? 'bg-green-600' : 
                donation.ecoscore === 'c' ? 'bg-yellow-500' :
                donation.ecoscore === 'd' ? 'bg-orange-500' : 'bg-red-600'
              )}>
                Eco {donation.ecoscore.toUpperCase()}
              </span>
            )}
            {donation.novaGroup && (
              <span className={cn(
                "text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg uppercase tracking-widest",
                donation.novaGroup === 1 ? 'bg-green-600' : 
                donation.novaGroup === 2 ? 'bg-yellow-400' :
                donation.novaGroup === 3 ? 'bg-orange-500' : 'bg-red-600'
              )}>
                Nova {donation.novaGroup}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{donation.title}</h2>
              <p className="text-slate-500 font-medium flex items-center gap-2">
                <MapPin size={16} className="text-brand-500" />
                {isAdmin 
                  ? (donation.location.address || donation.location.commune)
                  : (donation.location.address?.replace(/^\d+([^\d\s]*)\s+/, '').split(',')[0].trim() || donation.location.commune)
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Poids estimé</p>
              <p className="text-xl font-black text-brand-600">{donation.weight || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Calendar size={12} /> Expire le
              </p>
              <p className="font-black text-slate-900">{donation.expiryDate || 'Non spécifié'}</p>
            </div>
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Award size={12} /> Impact
              </p>
              <p className="font-black text-brand-600">~{(donation.weightValue || 0).toFixed(1)} kg sauvés</p>
            </div>
          </div>

          <div className="mb-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Description</h4>
            <p className="text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-6 rounded-3xl border border-slate-100/50">
              {donation.description || "Aucune description fournie."}
            </p>
          </div>

          <div className="flex items-center gap-4 p-6 bg-brand-50 rounded-[2.5rem] border border-brand-100 mb-8">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-600 shadow-sm border border-brand-100">
              <UserPlus size={28} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-0.5">Donneur</p>
              <p className="font-black text-slate-900">{donation.donorName || 'Voisin ShareUP'}</p>
            </div>
            <button 
              onClick={() => onReport(donation, 'user')}
              className="p-3 text-slate-400 hover:text-red-500 transition-colors"
              title="Signaler l'utilisateur"
            >
              <ShieldAlert size={20} />
            </button>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {currentUser?.uid !== donation.donorId && (
              <button
                onClick={() => onReserve(donation)}
                className="w-full bg-brand-600 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-brand-200 flex items-center justify-center gap-3 hover:bg-brand-700 transition-all active:scale-95"
              >
                <ShoppingBag size={24} />
                Réserver ce don maintenant
              </button>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => onNavigate(donation.location.lat, donation.location.lng)}
                className="bg-slate-100 text-slate-600 font-black py-5 rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-brand-50 hover:text-brand-600 transition-all active:scale-95"
              >
                <Navigation size={20} />
                <span className="text-[9px] uppercase tracking-widest">Y aller</span>
              </button>
              <button
                onClick={() => onShare(donation)}
                className="bg-slate-100 text-slate-600 font-black py-5 rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-brand-50 hover:text-brand-600 transition-all active:scale-95"
              >
                <Share2 size={20} />
                <span className="text-[9px] uppercase tracking-widest">Partager</span>
              </button>
              <button
                onClick={() => onReport(donation, 'donation')}
                className="bg-slate-100 text-slate-600 font-black py-5 rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
              >
                <AlertTriangle size={20} />
                <span className="text-[9px] uppercase tracking-widest">Signaler</span>
              </button>
            </div>

            {(isAdmin || currentUser?.uid === donation.donorId) && (
              <button
                onClick={() => onDelete(donation.id)}
                className="w-full bg-red-50 text-red-600 font-black py-4 rounded-[1.5rem] border-2 border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-all mt-4"
              >
                <ShieldAlert size={18} />
                {isAdmin ? 'Supprimer (Admin)' : 'Supprimer mon annonce'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DonationDetailModal;
