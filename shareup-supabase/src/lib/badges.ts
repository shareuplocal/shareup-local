import { supabase } from '../supabase';
import type { UserStats } from '../types';

export const checkBadges = async (
  userId: string,
  stats: UserStats,
  currentBadges: string[]
) => {
  const newBadges: string[] = [];
  const addBadge = (id: string) => {
    if (!currentBadges.includes(id) && !newBadges.includes(id)) {
      newBadges.push(id);
    }
  };

  // Pioneer (Top 100 comptes les plus anciens)
  if (!currentBadges.includes('pioneer')) {
    try {
      const { data } = await supabase
        .from('public_profiles')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(100);

      if (data?.some((row) => row.id === userId)) {
        addBadge('pioneer');
      }
    } catch (err) {
      console.error('Error checking pioneer badge:', err);
    }
  }

  // Eco-Hero (kg de nourriture sauvés)
  if (stats.foodSavedKg >= 10) addBadge('eco_hero_bronze');
  if (stats.foodSavedKg >= 50) addBadge('eco_hero_silver');
  if (stats.foodSavedKg >= 200) addBadge('eco_hero_gold');
  if (stats.foodSavedKg >= 1000) addBadge('eco_hero_diamond');

  // Star Donor (nombre de dons)
  if (stats.donationsCount >= 10) addBadge('star_donor_bronze');
  if (stats.donationsCount >= 50) addBadge('star_donor_silver');
  if (stats.donationsCount >= 200) addBadge('star_donor_gold');
  if (stats.donationsCount >= 500) addBadge('star_donor_diamond');

  // Earth Friend (nombre d'amis)
  if (stats.friendsCount >= 5) addBadge('earth_friend_bronze');
  if (stats.friendsCount >= 20) addBadge('earth_friend_silver');
  if (stats.friendsCount >= 50) addBadge('earth_friend_gold');

  // Zero Waste
  if (stats.foodSavedKg >= 500) addBadge('zero_waste');

  // Sharing Badges
  if (stats.sharedCount >= 5) addBadge('share_bronze');
  if (stats.sharedCount >= 20) addBadge('share_silver');
  if (stats.sharedCount >= 50) addBadge('share_gold');

  // Ultimate Donor (meilleur donneur de l'année)
  if (!currentBadges.includes('ultimate_donor')) {
    try {
      const currentYear = new Date().getFullYear();
      const { data } = await supabase
        .from('public_profiles')
        .select('id, stats')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        const sorted = data
          .filter((d) => d.stats)
          .sort((a, b) => {
            const aCount = a.stats[`donationsCount_${currentYear}`] || 0;
            const bCount = b.stats[`donationsCount_${currentYear}`] || 0;
            return bCount - aCount;
          });
        if (sorted[0]?.id === userId && (stats[`donationsCount_${currentYear}`] || 0) > 0) {
          addBadge('ultimate_donor');
        }
      }
    } catch (err) {
      console.warn('Ultimate badge check failed:', err);
    }
  }

  // Legend
  if (stats.donationsCount >= 1000) addBadge('legend');

  // Community Tiers (Received)
  if (stats.receivedCount >= 5) addBadge('receiver_bronze');
  if (stats.receivedCount >= 20) addBadge('receiver_silver');
  if (stats.receivedCount >= 50) addBadge('community_pillar');
  if (stats.receivedCount >= 150) addBadge('receiver_gold');

  // Oltiis
  if (stats.donationsCount > 0 && stats.receivedCount > 0 && stats.friendsCount > 0) {
    addBadge('oltiis');
  }

  // Ultimate Donor Annuel (31 décembre après 22h45)
  const now = new Date();
  if (
    now.getMonth() === 11 &&
    now.getDate() === 31 &&
    (now.getHours() > 22 || (now.getHours() === 22 && now.getMinutes() >= 45))
  ) {
    const currentYear = now.getFullYear();
    try {
      const { data } = await supabase
        .from('public_profiles')
        .select('id, stats');

      if (data) {
        const sorted = data
          .filter((d) => d.stats)
          .sort((a, b) => {
            const aCount = a.stats[`donationsCount_${currentYear}`] || 0;
            const bCount = b.stats[`donationsCount_${currentYear}`] || 0;
            return bCount - aCount;
          });
        if (sorted[0]?.id === userId && (stats[`donationsCount_${currentYear}`] || 0) > 0) {
          addBadge(`ultimate_donor_${currentYear}`);
        }
      }
    } catch (err) {
      console.warn('Legacy ultimate badge check failed:', err);
    }
  }

  // Super Badge (tous les badges principaux)
  const allCoreBadges = [
    'pioneer', 'ultimate_donor', 'eco_hero_bronze', 'eco_hero_silver', 'eco_hero_gold', 'eco_hero_diamond',
    'star_donor_bronze', 'star_donor_silver', 'star_donor_gold', 'star_donor_diamond',
    'earth_friend_bronze', 'earth_friend_silver', 'earth_friend_gold',
    'zero_waste', 'legend', 'community_pillar', 'oltiis',
    'receiver_bronze', 'receiver_silver', 'receiver_gold',
    'share_bronze', 'share_silver', 'share_gold',
  ];
  const hasAllCore = allCoreBadges.every(
    (b) => currentBadges.includes(b) || newBadges.includes(b)
  );
  if (hasAllCore) addBadge('master_of_all');

  if (newBadges.length > 0) {
    const allBadges = [...new Set([...currentBadges, ...newBadges])];
    await supabase.from('public_profiles').update({ badges: allBadges }).eq('id', userId);
  }

  return newBadges;
};
