/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FriendsSection from '../src/components/profile/FriendsSection';
import { Friend, FriendRequest } from '../src/types';
import React from 'react';

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon" />,
  UserPlus: () => <div data-testid="user-plus-icon" />,
  UserMinus: () => <div data-testid="user-minus-icon" />,
  UserCheck: () => <div data-testid="user-check-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  ShieldCheck: () => <div data-testid="shield-check-icon" />,
  Award: () => <div data-testid="award-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
}));

describe('FriendsSection Component', () => {
  const mockFriends: Friend[] = [
    { id: 'friend1', userId: 'me', friendId: 'friend1', friendName: 'Friend One', friendPhoto: 'https://example.com/photo1.jpg', displayName: 'Friend One', photoURL: 'https://example.com/photo1.jpg', createdAt: new Date().toISOString() },
    { id: 'friend2', userId: 'me', friendId: 'friend2', friendName: 'Friend Two', friendPhoto: 'https://example.com/photo2.jpg', displayName: 'Friend Two', photoURL: 'https://example.com/photo2.jpg', createdAt: new Date().toISOString() }
  ];

  const mockRequests: FriendRequest[] = [
    { id: 'req1', fromId: 'user3', fromName: 'User Three', fromPhoto: 'https://example.com/photo3.jpg', toId: 'me', toName: 'Me', toPhoto: 'me.jpg', status: 'pending', createdAt: new Date().toISOString() }
  ];

  const mockOnAccept = vi.fn();
  const mockOnReject = vi.fn();
  const mockOnRemove = vi.fn();
  const mockOnNavigate = vi.fn();

  it('should render friend list correctly', () => {
    render(
      <FriendsSection 
        friends={mockFriends} 
        friendRequests={[]} 
        onAcceptRequest={mockOnAccept} 
        onRejectRequest={mockOnReject} 
        onRemoveFriend={mockOnRemove} 
        onNavigateToUser={mockOnNavigate} 
      />
    );
    
    expect(screen.getByText('Friend One')).toBeDefined();
    expect(screen.getByText('Friend Two')).toBeDefined();
    expect(screen.getByText('2 amis')).toBeDefined();
  });

  it('should render friend requests correctly', () => {
    render(
      <FriendsSection 
        friends={mockFriends} 
        friendRequests={mockRequests} 
        onAcceptRequest={mockOnAccept} 
        onRejectRequest={mockOnReject} 
        onRemoveFriend={mockOnRemove} 
        onNavigateToUser={mockOnNavigate} 
      />
    );
    
    expect(screen.getByText('User Three')).toBeDefined();
    expect(screen.getByText('Demandes en attente')).toBeDefined();
    expect(screen.getByText('1 NOUVEAU')).toBeDefined();
  });

  it('should call onAcceptRequest when accept button is clicked', () => {
    render(
      <FriendsSection 
        friends={mockFriends} 
        friendRequests={mockRequests} 
        onAcceptRequest={mockOnAccept} 
        onRejectRequest={mockOnReject} 
        onRemoveFriend={mockOnRemove} 
        onNavigateToUser={mockOnNavigate} 
      />
    );
    
    const acceptBtns = screen.getAllByTestId('user-check-icon');
    fireEvent.click(acceptBtns[0].parentElement!);
    
    expect(mockOnAccept).toHaveBeenCalledWith(mockRequests[0]);
  });

  it('should call onRemoveFriend when remove button is clicked', () => {
    render(
      <FriendsSection 
        friends={mockFriends} 
        friendRequests={[]} 
        onAcceptRequest={mockOnAccept} 
        onRejectRequest={mockOnReject} 
        onRemoveFriend={mockOnRemove} 
        onNavigateToUser={mockOnNavigate} 
      />
    );
    
    const removeBtns = screen.getAllByTestId('user-minus-icon');
    fireEvent.click(removeBtns[0].parentElement!);
    
    expect(mockOnRemove).toHaveBeenCalledWith(mockFriends[0].id);
  });
});
