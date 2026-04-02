/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsSection from '../src/components/profile/SettingsSection';
import React from 'react';

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Settings: () => <div data-testid="settings-icon" />,
  LogOut: () => <div data-testid="logout-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  ShieldAlert: () => <div data-testid="shield-alert-icon" />,
  UserCog: () => <div data-testid="user-cog-icon" />,
  Bell: () => <div data-testid="bell-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
  HelpCircle: () => <div data-testid="help-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  Share2: () => <div data-testid="share2-icon" />,
  Info: () => <div data-testid="info-icon" />,
}));

describe('SettingsSection Component', () => {
  const mockOnLogout = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnReset = vi.fn();
  const mockOnEditProfile = vi.fn();
  const mockOnShowInfo = vi.fn();

  it('should render settings groups', () => {
    render(
      <SettingsSection 
        onLogout={mockOnLogout} 
        onDeleteAccount={mockOnDelete} 
        onResetStats={mockOnReset} 
        onEditProfile={mockOnEditProfile}
        onShowInfo={mockOnShowInfo}
        isAdmin={false} 
        userDisplayName="Test User"
        userId="test-uid"
      />
    );
    
    expect(screen.getByText('Compte & Sécurité')).toBeDefined();
    expect(screen.getByText('Application')).toBeDefined();
    expect(screen.getByText('Actions Critiques')).toBeDefined();
  });

  it('should call onLogout when logout button is clicked', () => {
    render(
      <SettingsSection 
        onLogout={mockOnLogout} 
        onDeleteAccount={mockOnDelete} 
        onResetStats={mockOnReset} 
        onEditProfile={mockOnEditProfile}
        onShowInfo={mockOnShowInfo}
        isAdmin={false} 
        userDisplayName="Test User"
        userId="test-uid"
      />
    );
    
    const logoutBtn = screen.getByText('Se déconnecter').parentElement!.parentElement!;
    fireEvent.click(logoutBtn);
    
    expect(mockOnLogout).toHaveBeenCalled();
  });

  it('should call onDeleteAccount when delete button is clicked', () => {
    render(
      <SettingsSection 
        onLogout={mockOnLogout} 
        onDeleteAccount={mockOnDelete} 
        onResetStats={mockOnReset} 
        onEditProfile={mockOnEditProfile}
        onShowInfo={mockOnShowInfo}
        isAdmin={false} 
        userDisplayName="Test User"
        userId="test-uid"
      />
    );
    
    const deleteBtn = screen.getByText('Supprimer mon compte').parentElement!.parentElement!;
    fireEvent.click(deleteBtn);
    
    expect(mockOnDelete).toHaveBeenCalled();
  });

  it('should show reset stats button for admin', () => {
    render(
      <SettingsSection 
        onLogout={mockOnLogout} 
        onDeleteAccount={mockOnDelete} 
        onResetStats={mockOnReset} 
        onEditProfile={mockOnEditProfile}
        onShowInfo={mockOnShowInfo}
        isAdmin={true} 
        userDisplayName="Admin User"
        userId="admin-uid"
      />
    );
    
    expect(screen.getByText('Réinitialiser les stats')).toBeDefined();
  });

  it('should NOT show reset stats button for non-admin', () => {
    render(
      <SettingsSection 
        onLogout={mockOnLogout} 
        onDeleteAccount={mockOnDelete} 
        onResetStats={mockOnReset} 
        onEditProfile={mockOnEditProfile}
        onShowInfo={mockOnShowInfo}
        isAdmin={false} 
        userDisplayName="Test User"
        userId="test-uid"
      />
    );
    
    expect(screen.queryByText('Réinitialiser les stats')).toBeNull();
  });
});
