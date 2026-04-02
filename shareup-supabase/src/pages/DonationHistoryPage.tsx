import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';
import { supabase, mapDonation } from '../supabase';
import { ShoppingBag, Leaf, ChevronLeft, Calendar, MapPin, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Donation } from '../types';

const DonationHistoryPage = () => {
  const { user, isQuotaExceeded } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  const fetchHistory = async (isNext = false) => {
    if (!user) return;
    setLoading(true);
    try {
      const from = isNext ? page * PAGE_SIZE : 0;
      const to = from + PAGE_SIZE - 1;

      const { data } = await supabase
        .from('donations')
        .select('*')
        .eq('status', 'completed')
        .contains('participant_ids', [user.id])
        .order('completed_at', { ascending: false })
        .range(from, to);

      const docs = (data || []).map(mapDonation);

      if (isNext) {
        setHistory(prev => [...prev, ...docs]);
        setPage(prev => prev + 1);
      } else {
        setHistory(docs);
        setPage(1);
      }

      setHasMore(docs.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-gray-50 p-6 pb-32"
    >
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Historique</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Vos actions passées</p>
        </div>
      </header>

      {loading && history.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-gray-100">
          <ShoppingBag size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="font-bold text-gray-900">Aucun don terminé</p>
          <p className="text-sm text-gray-500 max-w-[200px] mx-auto mt-2">
            Vos dons et récupérations apparaîtront ici une fois validés.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const isDonor = item.donorId === user?.uid;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4"
              >
                <div className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
                  isDonor ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                )}>
                  {isDonor ? <Leaf size={24} /> : <ShoppingBag size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-gray-900 truncate">{item.title}</h4>
                    <span className={cn(
                      'text-[8px] font-black uppercase px-2 py-0.5 rounded-full',
                      isDonor ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    )}>
                      {isDonor ? 'Donné' : 'Reçu'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                      <Calendar size={10} />
                      {item.completedAt
                        ? new Date(item.completedAt as string).toLocaleDateString('fr-FR')
                        : 'Date inconnue'}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                      <MapPin size={10} />
                      {item.location?.commune || 'Inconnue'}
                    </div>
                  </div>
                </div>
                <div className="text-green-500"><CheckCircle size={20} /></div>
              </motion.div>
            );
          })}

          {hasMore && (
            <button
              onClick={() => fetchHistory(true)}
              disabled={loading}
              className="w-full py-4 bg-white text-gray-600 rounded-[2rem] font-black shadow-sm border border-gray-100 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : 'VOIR PLUS'}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default DonationHistoryPage;
