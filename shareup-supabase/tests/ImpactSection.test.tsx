/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ImpactSection from '../src/components/profile/ImpactSection';
import { PublicProfile } from '../src/types';
import React from 'react';

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Leaf: () => <div data-testid="leaf-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Utensils: () => <div data-testid="utensils-icon" />,
  Droplets: () => <div data-testid="droplets-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  Award: () => <div data-testid="award-icon" />,
}));

describe('ImpactSection Component', () => {
  const mockProfile: PublicProfile = {
    uid: '123',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    badges: ['pioneer'],
    stats: {
      donationsCount: 10,
      impactScore: 150,
      receivedCount: 5,
      foodSavedKg: 15.5,
      friendsCount: 0,
      sharedCount: 0
    },
    isApproved: true,
    welcomeMessageSent: true,
    role: 'user',
    createdAt: new Date().toISOString()
  };

  it('should render impact statistics correctly', () => {
    render(<ImpactSection publicProfile={mockProfile} />);
    
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('150')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
  });

  it('should display labels correctly', () => {
    render(<ImpactSection publicProfile={mockProfile} />);
    
    expect(screen.getByText('KG SAUVÉS')).toBeDefined();
    expect(screen.getByText('DONS EFFECTUÉS')).toBeDefined();
    expect(screen.getByText('SCORE IMPACT')).toBeDefined();
    expect(screen.getByText('DONS REÇUS')).toBeDefined();
  });
});
