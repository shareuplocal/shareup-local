import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ 
  isOpen, 
  isDeleting, 
  onClose, 
  onConfirm 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isDeleting && onClose()}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md rounded-[40px] p-10 relative z-10 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
            
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-8 mx-auto">
              <Trash2 size={40} />
            </div>

            <h2 className="text-3xl font-black text-slate-800 text-center mb-4 tracking-tight">Supprimer le compte ?</h2>
            <p className="text-slate-500 font-bold text-center mb-10 italic">
              Cette action est irréversible. Toutes vos données, dons et amis seront définitivement supprimés.
            </p>

            <div className="space-y-4">
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="w-full py-5 bg-red-500 text-white rounded-3xl font-black shadow-xl shadow-red-100 hover:bg-red-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                aria-label="Confirmer la suppression définitive du compte"
              >
                {isDeleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    SUPPRESSION...
                  </>
                ) : (
                  'OUI, SUPPRIMER DÉFINITIVEMENT'
                )}
              </button>
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="w-full py-5 bg-slate-100 text-slate-600 rounded-3xl font-black hover:bg-slate-200 transition-all disabled:opacity-50"
                aria-label="Annuler la suppression du compte"
              >
                ANNULER
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteAccountModal;
