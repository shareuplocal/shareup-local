import { describe, it, expect, vi } from 'vitest';
import { cn, handleFirestoreError, OperationType } from './utils';
import { auth } from '../firebase';

// Mock firebase auth
vi.mock('../firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-uid',
      email: 'test@example.com',
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerData: [
        {
          providerId: 'google.com',
          displayName: 'Test User',
          email: 'test@example.com',
          photoURL: 'https://example.com/photo.jpg'
        }
      ]
    }
  },
  db: {}
}));

describe('utils.ts', () => {
  describe('cn', () => {
    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2 py-2', 'px-4')).toBe('py-2 px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
      expect(cn('flex items-center', { 'justify-center': true, 'hidden': false })).toBe('flex items-center justify-center');
    });
  });

  describe('handleFirestoreError', () => {
    it('should throw an error with JSON string containing correct info', () => {
      const error = new Error('Permission denied');
      const operation = OperationType.GET;
      const path = 'users/test-uid';

      expect(() => handleFirestoreError(error, operation, path)).toThrow();
      
      try {
        handleFirestoreError(error, operation, path);
      } catch (e) {
        const info = JSON.parse((e as Error).message);
        expect(info.error).toBe('Permission denied');
        expect(info.operationType).toBe(operation);
        expect(info.path).toBe(path);
        expect(info.authInfo.userId).toBe('test-uid');
        expect(info.authInfo.email).toBe('test@example.com');
      }
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      const operation = OperationType.WRITE;
      const path = 'donations/123';

      try {
        handleFirestoreError(error, operation, path);
      } catch (e) {
        const info = JSON.parse((e as Error).message);
        expect(info.error).toBe('String error');
      }
    });
  });
});
