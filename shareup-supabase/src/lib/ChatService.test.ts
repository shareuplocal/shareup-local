import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from './ChatService';
import { collection, query, where, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

// Mock firebase firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => ({
    docs: []
  })),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  writeBatch: vi.fn(() => ({
    delete: vi.fn(),
    commit: vi.fn()
  }))
}));

vi.mock('../firebase', () => ({
  db: {}
}));

describe('ChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call deleteConversationById for each conversation found by userId', async () => {
    const userId = 'user-123';
    const mockDocs = [
      { id: 'conv-1' },
      { id: 'conv-2' }
    ];
    
    (getDocs as any).mockResolvedValueOnce({
      docs: mockDocs
    });

    const deleteSpy = vi.spyOn(ChatService, 'deleteConversationById').mockResolvedValue(undefined);

    await ChatService.deleteConversationsByUserId(userId);

    expect(getDocs).toHaveBeenCalled();
    expect(deleteSpy).toHaveBeenCalledTimes(2);
    expect(deleteSpy).toHaveBeenCalledWith('conv-1');
    expect(deleteSpy).toHaveBeenCalledWith('conv-2');
  });

  it('should delete conversation and its messages by conversationId', async () => {
    const conversationId = 'conv-123';
    const mockMessageDocs = [
      { id: 'msg-1' },
      { id: 'msg-2' }
    ];

    (getDocs as any).mockResolvedValueOnce({
      docs: mockMessageDocs
    });

    const mockBatch = {
      delete: vi.fn(),
      commit: vi.fn()
    };
    (writeBatch as any).mockReturnValue(mockBatch);

    await ChatService.deleteConversationById(conversationId);

    expect(getDocs).toHaveBeenCalled();
    expect(mockBatch.delete).toHaveBeenCalledTimes(3); // 2 messages + 1 conversation
    expect(mockBatch.commit).toHaveBeenCalled();
  });
});
