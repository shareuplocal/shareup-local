import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Loader2, Search } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  exportCommune: string;
  setExportCommune: (commune: string) => void;
  isExporting: boolean;
}

const ExportModal = ({
  isOpen,
  onClose,
  onExport,
  exportCommune,
  setExportCommune,
  isExporting
}: ExportModalProps) => {
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
        className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-brand-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-brand-600 mb-8 mx-auto animate-float">
          <Download size={48} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 text-center mb-3 tracking-tight">Exportation CSV</h3>
        <p className="text-sm text-slate-500 text-center mb-10 font-medium leading-relaxed">
          Téléchargez les données d'impact pour une commune spécifique ou pour toute la plateforme.
        </p>
        
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={exportCommune}
              onChange={(e) => setExportCommune(e.target.value)}
              placeholder="Commune (laisser vide pour global)..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] pl-14 pr-8 py-5 font-black text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-all shadow-inner"
            />
          </div>
          <button
            onClick={onExport}
            disabled={isExporting}
            className="w-full bg-brand-600 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-brand-200 flex items-center justify-center gap-3 hover:bg-brand-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="animate-spin" /> : <Download size={24} />}
            Générer l'export CSV
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ExportModal;
