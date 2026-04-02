import React from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { Trash2, CheckCircle, Leaf, Clock, Sparkles } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';
import { ChatService } from '../lib/ChatService';
import { handleFirestoreError, OperationType, cn } from '../lib/utils';
import { Donation } from '../types';

interface SwipeableDonationProps {
  donation: Donation;
  id: string;
  isOwner: boolean;
  isAdmin?: boolean;
  onConfirmAction: (config: { title: string; message: string; onConfirm: () => void; type?: 'danger' | 'success' }) => void;
  setStatusMessage: (msg: string | null) => void;
}

const SwipeableDonation = ({
  donation,
  id,
  isOwner,
  isAdmin,
  onConfirmAction,
  setStatusMessage,
}: SwipeableDonationProps) => {
  const { user } = useAuth();
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0, 1, 0]);
  const bgColor = useTransform(x, [-100, 0, 100], ['#fee2e2', '#ffffff', '#dcfce7']);

  const isReceiver = donation.receiverId === user?.uid;
  const isSharer = donation.sharedByUids?.includes(user?.uid || '') && donation.donorId !== user?.uid;

  // Incrémenter un champ numérique dans une table
  const incrementStat = async (table: string, userId: string, field: string, amount: number) => {
    const { data } = await supabase.from(table).select('stats').eq('id', userId).single();
    if (data?.stats) {
      const newStats = { ...data.stats, [field]: (data.stats[field] || 0) + amount };
      await supabase.from(table).update({ stats: newStats }).eq('id', userId);
    }
  };

  const handleDragEnd = async (_: unknown, info: { offset: { x: number; y: number } }) => {
    if (info.offset.x < -70) {
      if (isOwner || isAdmin) {
        onConfirmAction({
          title: isAdmin ? "Admin: Supprimer l'annonce ?" : "Supprimer l'annonce ?",
          message: isAdmin
            ? `Voulez-vous supprimer l'annonce de ${donation.donorName} ?`
            : 'Voulez-vous supprimer cette annonce définitivement ? Cette action est irréversible.',
          onConfirm: async () => {
            try {
              await supabase.from('donations').delete().eq('id', donation.id);
              await ChatService.deleteConversationByDonationId(donation.id);
              if (isAdmin) setStatusMessage("Annonce supprimée par l'administrateur.");
            } catch (error) {
              handleFirestoreError(error, OperationType.DELETE, `donations/${donation.id}`);
            }
          },
          type: 'danger',
        });
      } else if (isSharer) {
        onConfirmAction({
          title: 'Retirer le partage ?',
          message: 'Voulez-vous retirer ce partage de votre profil ?',
          onConfirm: async () => {
            try {
              const newSharedBy = (donation.sharedByUids || []).filter((uid: string) => uid !== user?.uid);
              await supabase.from('donations').update({ shared_by_uids: newSharedBy }).eq('id', donation.id);
            } catch (error) {
              handleFirestoreError(error, OperationType.UPDATE, `donations/${donation.id}`);
            }
          },
          type: 'danger',
        });
      }
    } else if (info.offset.x > 70 && (isOwner || isReceiver)) {
      if (donation.status !== 'reserved') {
        onConfirmAction({
          title: "Valider l'annonce ?",
          message: "Confirmez-vous que ce don est terminé ? (Note: Cette action archivera l'annonce sans modifier vos statistiques car elle n'a pas été réservée par un tiers).",
          onConfirm: async () => {
            try {
              await supabase.from('donations').update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                is_placebo: true,
              }).eq('id', donation.id);
              await ChatService.deleteConversationByDonationId(donation.id);
              setStatusMessage('Annonce archivée avec succès.');
            } catch (error) {
              handleFirestoreError(error, OperationType.UPDATE, `donations/${donation.id}`);
            }
          },
          type: 'success',
        });
        return;
      }

      const isDonor = isOwner;
      const alreadyConfirmed = isDonor ? donation.isConfirmedByDonor : donation.isConfirmedByReceiver;
      if (alreadyConfirmed) { setStatusMessage('Vous avez déjà confirmé ce don.'); return; }

      onConfirmAction({
        title: 'Confirmer le don ?',
        message: "Confirmez-vous que le don a bien été remis ? Les statistiques seront mises à jour une fois que les deux parties auront confirmé.",
        onConfirm: async () => {
          try {
            const updates: any = {};
            if (isDonor) updates.is_confirmed_by_donor = true;
            else updates.is_confirmed_by_receiver = true;

            const willBeFullyConfirmed =
              (isDonor && donation.isConfirmedByReceiver) ||
              (!isDonor && donation.isConfirmedByDonor);

            if (willBeFullyConfirmed) {
              updates.status = 'completed';
              updates.completed_at = new Date().toISOString();
              await ChatService.deleteConversationByDonationId(donation.id);

              const weight = donation.weightValue || 0;
              const currentYear = new Date().getFullYear();
              const yearKey = `donationsCount_${currentYear}`;

              // Mise à jour des stats du donneur
              const { data: donorPub } = await supabase.from('public_profiles').select('stats').eq('id', donation.donorId).single();
              if (donorPub) {
                const ds = donorPub.stats || {};
                await supabase.from('public_profiles').update({
                  stats: {
                    ...ds,
                    foodSavedKg: (ds.foodSavedKg || 0) + weight,
                    donationsCount: (ds.donationsCount || 0) + 1,
                    [yearKey]: (ds[yearKey] || 0) + 1,
                  },
                }).eq('id', donation.donorId);
              }

              // Mise à jour des stats du receveur
              if (donation.receiverId) {
                const { data: recvPub } = await supabase.from('public_profiles').select('stats').eq('id', donation.receiverId).single();
                if (recvPub) {
                  const rs = recvPub.stats || {};
                  await supabase.from('public_profiles').update({
                    stats: {
                      ...rs,
                      foodSavedKg: (rs.foodSavedKg || 0) + weight,
                      receivedCount: (rs.receivedCount || 0) + 1,
                      [yearKey]: (rs[yearKey] || 0) + 1,
                    },
                  }).eq('id', donation.receiverId);
                }
              }
            }

            await supabase.from('donations').update(updates).eq('id', donation.id);
            setStatusMessage(
              willBeFullyConfirmed
                ? 'Don validé et statistiques mises à jour !'
                : "Confirmation enregistrée. En attente de l'autre partie."
            );
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `donations/${donation.id}`);
          }
        },
        type: 'success',
      });
    }
  };

  const canConfirm =
    (isOwner && !donation.isConfirmedByDonor) ||
    (isReceiver && !donation.isConfirmedByReceiver);

  return (
    <div className="relative overflow-hidden rounded-3xl mb-3">
      <div className="absolute inset-0 flex justify-between items-center px-6">
        <div className="flex items-center gap-2 text-red-600 font-bold">
          {isOwner ? <><Trash2 size={20} /> Supprimer</> : isSharer ? <><Trash2 size={20} /> Retirer</> : <span className="text-[10px] opacity-50 italic">Action restreinte</span>}
        </div>
        <div className="flex items-center gap-2 text-green-600 font-bold">
          {donation.status === 'reserved' ? (canConfirm ? 'Confirmer' : 'Déjà confirmé') : 'Non réservé'} <CheckCircle size={20} />
        </div>
      </div>
      <motion.div
        drag="x"
        dragConstraints={{
          left: (isOwner || isSharer) ? -120 : 0,
          right: (isOwner || isReceiver) ? 120 : 0,
        }}
        style={{ x, backgroundColor: bgColor }}
        onDragEnd={handleDragEnd}
        className="relative z-10 bg-white p-4 border border-gray-100 flex items-center gap-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
      >
        <div className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner',
          donation.status === 'available' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
        )}>
          {donation.status === 'available' ? <Leaf size={28} /> : <Clock size={28} />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-gray-900 truncate leading-tight">{donation.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              'text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest',
              donation.status === 'available' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
            )}>
              {donation.status === 'available' ? 'En ligne' : 'Réservé'}
            </span>
            <div className="flex items-center gap-1">
              <span className={cn('w-1.5 h-1.5 rounded-full', donation.isConfirmedByDonor ? 'bg-green-500' : 'bg-gray-300')} />
              <span className={cn('w-1.5 h-1.5 rounded-full', donation.isConfirmedByReceiver ? 'bg-green-500' : 'bg-gray-300')} />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isSharer && (
            <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg">
              <Sparkles size={8} className="text-purple-500" />
              <span className="text-[8px] font-black text-purple-600 uppercase tracking-tighter">Partagé</span>
            </div>
          )}
          <span className="text-xs font-black text-slate-900">{donation.weightValue || 0}kg</span>
        </div>
      </motion.div>
    </div>
  );
};

export default SwipeableDonation;
