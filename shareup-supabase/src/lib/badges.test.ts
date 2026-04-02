import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkBadges } from './badges';
import { UserStats } from '../types';

// Mock firebase firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn(),
  arrayUnion: vi.fn((...args) => args),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(() => ({
    empty: true,
    docs: []
  })),
  where: vi.fn(),
  arrayRemove: vi.fn()
}));

vi.mock('../firebase', () => ({
  db: {}
}));

describe('badges.ts', () => {
  const userId = 'user-123';
  const baseStats: UserStats = {
    donationsCount: 0,
    receivedCount: 0,
    totalWeightSaved: 0,
    impactScore: 0,
    friendsCount: 0,
    foodSavedKg: 0,
    sharedCount: 0,
    badges: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkBadges', () => {
    it('should award eco_hero_bronze for 10kg food saved', async () => {
      const stats = { ...baseStats, foodSavedKg: 10 };
      const newBadges = await checkBadges(userId, stats, []);
      expect(newBadges).toContain('eco_hero_bronze');
    });

    it('should award eco_hero_diamond for 1000kg food saved', async () => {
      const stats = { ...baseStats, foodSavedKg: 1000 };
      const newBadges = await checkBadges(userId, stats, []);
      expect(newBadges).toContain('eco_hero_bronze');
      expect(newBadges).toContain('eco_hero_silver');
      expect(newBadges).toContain('eco_hero_gold');
      expect(newBadges).toContain('eco_hero_diamond');
    });

    it('should award star_donor_bronze for 10 donations', async () => {
      const stats = { ...baseStats, donationsCount: 10 };
      const newBadges = await checkBadges(userId, stats, []);
      expect(newBadges).toContain('star_donor_bronze');
    });

    it('should award earth_friend_bronze for 5 friends', async () => {
      const stats = { ...baseStats, friendsCount: 5 };
      const newBadges = await checkBadges(userId, stats, []);
      expect(newBadges).toContain('earth_friend_bronze');
    });

    it('should award oltiis for donating, receiving and adding friends', async () => {
      const stats = { ...baseStats, donationsCount: 1, receivedCount: 1, friendsCount: 1 };
      const newBadges = await checkBadges(userId, stats, []);
      expect(newBadges).toContain('oltiis');
    });

    it('should not award badges already owned', async () => {
      const stats = { ...baseStats, foodSavedKg: 10 };
      const newBadges = await checkBadges(userId, stats, ['eco_hero_bronze']);
      expect(newBadges).not.toContain('eco_hero_bronze');
    });

    it('should award multiple badges at once', async () => {
      const stats = { ...baseStats, foodSavedKg: 10, donationsCount: 10 };
      const newBadges = await checkBadges(userId, stats, []);
      expect(newBadges).toContain('eco_hero_bronze');
      expect(newBadges).toContain('star_donor_bronze');
    });

    it('should award eco_hero_silver for 50kg food saved', async () => {
      const stats = { ...baseStats, foodSavedKg: 50 };
      const newBadges = await checkBadges(userId, stats, []);
      expect(newBadges).toContain('eco_hero_silver');
    });

    it('should award eco_hero_gold for 200kg food saved', async () => {
      const stats = { ...baseStats, foodSavedKg: 200 };
      const newBadges = await checkBadges(userId, stats, []);
      expect(newBadges).toContain('eco_hero_gold');
    });

    it('should award star_donor_silver for 50 donations', async () => {
      const stats = { ...baseStats, donationsCount: 50 };
      const newBadges = await checkBadges(userId, stats, []);
      expect(newBadges).toContain('star_donor_silver');
    });

    it('should award star_donor_gold for 200 donations', async () => {
      const stats = { ...baseStats, donationsCount: 200 };
      const newBadges = await checkBadges(userId, stats, []);
      expect(newBadges).toContain('star_donor_gold');
    });

    it('should award star_donor_diamond for 1000 donations', async () => {
      const stats = { ...baseStats, donationsCount: 1000 };
      const newBadges = await checkBadges(userId, stats, []);
      expect(newBadges).toContain('star_donor_diamond');
    });

    it('should award earth_friend_silver for 25 friends', async () => {
      const stats = { ...baseStats, friendsCount: 25 };
      const newBadges = await checkBadges(userId, stats, []);
      expect(newBadges).toContain('earth_friend_silver');
    });

    it('should award earth_friend_gold for 100 friends', async () => {
      const stats = { ...baseStats, friendsCount: 100 };
      const newBadges = await checkBadges(userId, stats, []);
      expect(newBadges).toContain('earth_friend_gold');
    });

    it('should award earth_friend_diamond for 500 friends', async () => {
      const stats = { ...baseStats, friendsCount: 500 };
      const newBadges = await checkBadges(userId, stats, []);
      expect(newBadges).toContain('earth_friend_diamond');
    });
  });
});
