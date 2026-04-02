import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  type?: 'danger' | 'success';
}

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirmer", 
  type = 'danger' 
}: ConfirmationModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[7000] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          className="relative bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden"
        >
          <div className="relative z-10 text-center">
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{title}</h3>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed">{message}</p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`w-full py-5 rounded-[2rem] font-black text-white shadow-xl transition-all active:scale-95 ${
                  type === 'danger' 
                    ? 'bg-red-600 shadow-red-200 hover:bg-red-700' 
                    : 'bg-brand-600 shadow-brand-200 hover:bg-brand-700'
                }`}
              >
                {confirmText}
              </button>
              <button
                onClick={onClose}
                className="w-full py-5 rounded-[2rem] font-black text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
              >
                Annuler
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default ConfirmationModal;
