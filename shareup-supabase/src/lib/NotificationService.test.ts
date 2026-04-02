/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from './NotificationService';

// Mock Notification API
const mockNotification = vi.fn();
const notificationMock = {
  permission: 'default',
  requestPermission: vi.fn(() => Promise.resolve('granted'))
};

vi.stubGlobal('Notification', Object.assign(mockNotification, notificationMock));

// Mock firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn()
}));

vi.mock('../firebase', () => ({
  db: {}
}));

describe('NotificationService.ts', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = NotificationService.getInstance();
  });

  it('should be a singleton', () => {
    const instance1 = NotificationService.getInstance();
    const instance2 = NotificationService.getInstance();
    expect(instance1).toBe(instance2);
  });

  describe('requestPermission', () => {
    it('should return true if permission is already granted', async () => {
      (Notification as unknown as { permission: string }).permission = 'granted';
      const result = await service.requestPermission();
      expect(result).toBe(true);
    });

    it('should request permission if not granted', async () => {
      (Notification as unknown as { permission: string }).permission = 'default';
      const result = await service.requestPermission();
      expect(Notification.requestPermission).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('showNotification', () => {
    it('should create a new notification if permission is granted', () => {
      (Notification as unknown as { permission: string }).permission = 'granted';
      service.showNotification('Test Title', { body: 'Test Body' });
      expect(mockNotification).toHaveBeenCalledWith('Test Title', expect.objectContaining({
        body: 'Test Body'
      }));
    });

    it('should not create a notification if permission is denied', () => {
      (Notification as unknown as { permission: string }).permission = 'denied';
      service.showNotification('Test Title');
      expect(mockNotification).not.toHaveBeenCalled();
    });
  });

  describe('calculateDistance', () => {
    it('should correctly calculate distance between two points', () => {
      const service = NotificationService.getInstance();
      // Paris to Lyon is roughly 391km
      const dist = (service as any).calculateDistance(48.8566, 2.3522, 45.7640, 4.8357);
      expect(dist).toBeGreaterThan(390);
      expect(dist).toBeLessThan(400);
    });

    it('should return 0 for same point', () => {
      const service = NotificationService.getInstance();
      const dist = (service as any).calculateDistance(48.8566, 2.3522, 48.8566, 2.3522);
      expect(dist).toBe(0);
    });
  });
});
