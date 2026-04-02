import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReport: () => void;
  reportReason: string;
  setReportReason: (reason: string) => void;
  type: 'donation' | 'user';
}

const ReportModal = ({
  isOpen,
  onClose,
  onReport,
  reportReason,
  setReportReason,
  type
}: ReportModalProps) => {
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
        <div className="bg-red-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-red-600 mb-8 mx-auto animate-float">
          <ShieldAlert size={48} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 text-center mb-3 tracking-tight">
          {type === 'donation' ? 'Signaler ce don' : 'Signaler cet utilisateur'}
        </h3>
        <p className="text-sm text-slate-500 text-center mb-10 font-medium leading-relaxed">
          Aidez-nous à garder ShareUP sûr. Pourquoi signalez-vous cet élément ?
        </p>
        
        <div className="space-y-6">
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Décrivez le problème..."
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-6 font-medium text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none transition-all shadow-inner min-h-[140px] resize-none"
            required
          />
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-600 font-black py-5 rounded-[1.5rem] hover:bg-slate-200 transition-all active:scale-95"
            >
              Annuler
            </button>
            <button
              onClick={onReport}
              disabled={!reportReason.trim()}
              className="flex-[2] bg-red-600 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-red-100 flex items-center justify-center gap-3 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <AlertTriangle size={20} />
              Signaler
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReportModal;
