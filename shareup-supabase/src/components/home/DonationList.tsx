import React from 'react';
import { Donation } from '../../types';
import { motion } from 'motion/react';
import { Leaf, MapPin, ShoppingBag, Navigation, Share2, AlertTriangle } from 'lucide-react';
import L from 'leaflet';

interface DonationListProps {
  donations: Donation[];
  userPos: [number, number] | null;
  onSelectDonation: (donation: Donation) => void;
  onReserve: (donation: Donation) => void;
  onShare: (donation: Donation) => void;
  onReport: (donation: Donation) => void;
  onNavigate: (lat: number, lng: number) => void;
}

const DonationList = ({
  donations,
  userPos,
  onSelectDonation,
  onReserve,
  onShare,
  onReport,
  onNavigate
}: DonationListProps) => {
  return (
    <div className="h-full w-full bg-slate-50 p-6 pt-48 overflow-y-auto custom-scrollbar">
      <div className="grid gap-8 max-w-2xl mx-auto">
        {donations.map((donation) => (
          <motion.div 
            key={donation.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 rounded-[3rem] shadow-2xl shadow-slate-900/5 border-white/60 flex flex-col gap-6 group hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex gap-6 items-center">
              <div className="w-24 h-24 bg-brand-50 rounded-[2rem] flex items-center justify-center text-brand-600 overflow-hidden border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-500">
                {donation.imageUrl ? (
                  <img src={donation.imageUrl} alt={donation.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Leaf size={40} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-brand-100 text-brand-700 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-[0.15em]">
                    {donation.category}
                  </span>
                </div>
                <h3 className="font-black text-slate-900 text-2xl leading-tight tracking-tight">{donation.title}</h3>
                <p className="text-xs text-slate-400 font-bold flex items-center gap-1.5 mt-2">
                  <MapPin size={14} className="text-brand-500" /> {donation.location.commune} • {donation.weight || 'Poids inconnu'}
                  {userPos && (
                    <span className="text-brand-600 ml-2 bg-brand-50 px-2 py-0.5 rounded-lg">
                      {(L.latLng(userPos).distanceTo(L.latLng(donation.location.lat, donation.location.lng)) / 1000).toFixed(1)} km
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 mt-2 pt-6 border-t border-slate-100">
              <div className="flex gap-3">
                <button
                  onClick={() => onSelectDonation(donation)}
                  className="flex-1 bg-white text-brand-600 text-[11px] font-black py-5 rounded-[1.5rem] border-2 border-brand-600 hover:bg-brand-50 transition-all active:scale-95"
                >
                  DÉTAILS
                </button>
                <button
                  onClick={() => onReserve(donation)}
                  className="flex-[2] bg-brand-600 text-white text-[11px] font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-2xl shadow-brand-100 hover:bg-brand-700 transition-all active:scale-95"
                >
                  <ShoppingBag size={20} />
                  RÉCUPÉRER
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => onNavigate(donation.location.lat, donation.location.lng)}
                  className="bg-slate-50 text-slate-400 p-5 rounded-[1.5rem] flex items-center justify-center hover:bg-brand-50 hover:text-brand-600 transition-all active:scale-90"
                  title="Naviguer"
                >
                  <Navigation size={24} />
                </button>
                <button
                  onClick={() => onShare(donation)}
                  className="bg-slate-50 text-slate-400 p-5 rounded-[1.5rem] flex items-center justify-center hover:bg-brand-50 hover:text-brand-600 transition-all active:scale-90"
                  title="Partager"
                >
                  <Share2 size={24} />
                </button>
                <button
                  onClick={() => onReport(donation)}
                  className="bg-slate-50 text-slate-400 p-5 rounded-[1.5rem] flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all active:scale-90"
                  title="Signaler"
                >
                  <AlertTriangle size={24} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DonationList;
