import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface InfoModalConfig {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning';
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalConfig> = ({ title, message, type = 'info', onClose }) => {
  const icons = {
    info: <Info className="text-indigo-600" size={24} />,
    success: <CheckCircle className="text-green-600" size={24} />,
    warning: <AlertCircle className="text-amber-600" size={24} />,
  };

  const colors = {
    info: "text-indigo-600 bg-indigo-50",
    success: "text-green-600 bg-green-50",
    warning: "text-amber-600 bg-amber-50",
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", colors[type])}>
            {icons[type]}
          </div>
          <h3 className="text-xl font-black text-slate-800 leading-tight">
            {title}
          </h3>
        </div>
        
        <div className="text-slate-500 text-sm font-medium mb-8 leading-relaxed whitespace-pre-wrap">
          {message}
        </div>

        <button
          onClick={onClose}
          className="w-full px-6 py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
        >
          D'ACCORD
        </button>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>
      </motion.div>
    </div>
  );
};

export default InfoModal;
