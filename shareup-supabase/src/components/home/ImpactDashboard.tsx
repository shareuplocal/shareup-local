import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Leaf, Award, Utensils, Droplets, ShoppingBag, Users, TrendingUp, Wind, Info, Search, Loader2, ChevronRight, MapPin } from 'lucide-react';

interface Commune {
  nom: string;
  code: string;
}

interface ImpactStats {
  personal: {
    kg: number;
    meals: number;
    water: number;
  };
  global: {
    kg: number;
    meals: number;
    water: number;
    products: number;
    donors: number;
    communes: number;
  };
}

interface ImpactDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  impactCommune: Commune | null;
  setImpactCommune: (commune: Commune | null) => void;
  communeSearch: string;
  setCommuneSearch: (search: string) => void;
  communeSuggestions: Commune[];
  fetchCommuneSuggestions: (query: string) => void;
  impactStats: ImpactStats;
  setCommuneSuggestions: (suggestions: Commune[]) => void;
}

const ImpactDashboard = ({
  isOpen,
  onClose,
  impactCommune,
  setImpactCommune,
  communeSearch,
  setCommuneSearch,
  communeSuggestions,
  fetchCommuneSuggestions,
  impactStats,
  setCommuneSuggestions
}: ImpactDashboardProps) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[8000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-[3.5rem] p-10 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-brand-100">
              <Leaf size={32} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Impact ShareUP</h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Tableau de bord écologique</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-4 bg-slate-50 text-slate-400 rounded-3xl hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
          {/* Commune Selector */}
          <div className="mb-10 relative">
            <div className="flex items-center gap-3 mb-4">
              <Search size={18} className="text-brand-500" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrer par commune</h4>
            </div>
            <div className="relative">
              <input
                type="text"
                value={communeSearch}
                onChange={(e) => {
                  setCommuneSearch(e.target.value);
                  fetchCommuneSuggestions(e.target.value);
                }}
                placeholder="Rechercher une ville..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-5 font-black text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-all shadow-inner"
              />
              {communeSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-10">
                  {communeSuggestions.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setImpactCommune(c);
                        setCommuneSearch(c.nom);
                        setCommuneSuggestions([]);
                      }}
                      className="w-full px-8 py-4 text-left hover:bg-brand-50 font-bold text-slate-700 transition-colors flex items-center justify-between group"
                    >
                      {c.nom}
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {impactCommune && (
              <button
                onClick={() => {
                  setImpactCommune(null);
                  setCommuneSearch('');
                }}
                className="mt-4 text-xs font-black text-brand-600 bg-brand-50 px-4 py-2 rounded-xl hover:bg-brand-100 transition-colors flex items-center gap-2 w-fit"
              >
                <X size={14} /> Effacer le filtre : {impactCommune.nom}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="text-brand-400" size={20} />
                  <span className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em]">Votre Impact Personnel</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-black tracking-tighter">{impactStats.personal.kg}</span>
                  <span className="text-xl font-black text-brand-400">kg</span>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">Nourriture sauvée du gaspillage grâce à vos dons.</p>
                
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                  <div>
                    <p className="text-2xl font-black mb-1">{impactStats.personal.meals}</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Dons effectués</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black mb-1">{impactStats.personal.water}</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Litres d'eau sauvés</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-brand-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="text-white/60" size={20} />
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Impact {impactCommune ? impactCommune.nom : 'Global'}</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-black tracking-tighter">{impactStats.global.kg}</span>
                  <span className="text-xl font-black text-white/60">kg</span>
                </div>
                <p className="text-white/70 text-sm font-medium mb-8 leading-relaxed">Total cumulé par la communauté ShareUP.</p>
                
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                  <div>
                    <p className="text-2xl font-black mb-1">{impactStats.global.meals}</p>
                    <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Dons effectués</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black mb-1">{impactStats.global.water}</p>
                    <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Litres d'eau sauvés</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="bg-slate-50 p-6 rounded-[2rem] text-center border border-slate-100">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-600 mx-auto mb-4 shadow-sm">
                <ShoppingBag size={24} />
              </div>
              <p className="text-xl font-black text-slate-900 mb-1">{impactStats.global.products}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dons</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-[2rem] text-center border border-slate-100">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4 shadow-sm">
                <Users size={24} />
              </div>
              <p className="text-xl font-black text-slate-900 mb-1">{impactStats.global.donors}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Donneurs</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-[2rem] text-center border border-slate-100">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 mx-auto mb-4 shadow-sm">
                <MapPin size={24} />
              </div>
              <p className="text-xl font-black text-slate-900 mb-1">{impactStats.global.communes}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Villes</p>
            </div>
          </div>

          <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 flex items-start gap-6">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
              <Info size={28} />
            </div>
            <div>
              <h4 className="font-black text-blue-900 mb-2">Le saviez-vous ?</h4>
              <p className="text-sm text-blue-700/80 font-medium leading-relaxed">
                Produire 1kg de bœuf nécessite environ 15 000 litres d'eau. En sauvant ne serait-ce qu'un steak, vous économisez l'équivalent de 50 douches ! 🚿
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImpactDashboard;
