import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, toAppUser, mapProfile, mapPublicProfile, type AppUser } from './supabase';
import type { UserProfile, PublicProfile } from './types';

interface AuthContextType {
  user: AppUser | null;
  profile: UserProfile | null;
  publicProfile: PublicProfile | null;
  userLocation: { lat: number; lng: number } | null;
  loading: boolean;
  isQuotaExceeded: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, publicProfile: null,
  userLocation: null, loading: true, isQuotaExceeded: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Géolocalisation
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn('Location access denied', err)
    );
  }, []);

  // Crée ou met à jour le profil
  const upsertProfile = async (supabaseUser: AppUser) => {
    const isAdmin = supabaseUser.email === 'shareuplocal@gmail.com';
    const displayName = isAdmin ? "L'équipe ShareUP" : (supabaseUser.displayName || 'Utilisateur');

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .eq('id', supabaseUser.id)
      .single();

    if (!existingProfile) {
      await supabase.from('profiles').insert({
        id: supabaseUser.id,
        display_name: displayName,
        email: supabaseUser.email || '',
        photo_url: supabaseUser.photoURL,
        role: isAdmin ? 'admin' : 'user',
        terms_accepted: false,
        default_city: '',
        notifications: { newDonations: true, newMessages: true, radius: 10 },
        badges: [],
        created_at: new Date().toISOString(),
      });

      await supabase.from('public_profiles').insert({
        id: supabaseUser.id,
        display_name: displayName,
        photo_url: supabaseUser.photoURL,
        badges: ['pioneer'],
        stats: { donationsCount: 0, foodSavedKg: 0, friendsCount: 0, receivedCount: 0, sharedCount: 0 },
        is_approved: isAdmin,
        welcome_message_sent: false,
        role: isAdmin ? 'admin' : 'user',
        email: supabaseUser.email,
        created_at: new Date().toISOString(),
      });
    } else {
      const updates: Record<string, string> = {};
      if (existingProfile.display_name !== displayName) updates.display_name = displayName;
      if (isAdmin && existingProfile.role !== 'admin') updates.role = 'admin';
      if (Object.keys(updates).length > 0) {
        await supabase.from('profiles').update(updates).eq('id', supabaseUser.id);
        await supabase.from('public_profiles').update(updates).eq('id', supabaseUser.id);
      }
    }
  };

  // Charge le profil depuis Supabase
  const loadProfile = async (userId: string) => {
    try {
      const [{ data: profileData }, { data: publicData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('public_profiles').select('*').eq('id', userId).single(),
      ]);
      if (profileData) setProfile(mapProfile(profileData));
      if (publicData) setPublicProfile(mapPublicProfile(publicData));
    } catch (err) {
      console.error('loadProfile error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // FIX: getSession() avec catch pour éviter loading infini si Supabase inaccessible
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          const appUser = toAppUser(session.user);
          setUser(appUser);
          upsertProfile(appUser).then(() => loadProfile(appUser.id));
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('getSession error:', err);
        setLoading(false); // FIX CRITIQUE: ne jamais bloquer indéfiniment
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const appUser = toAppUser(session.user);
        setUser(appUser);
        await upsertProfile(appUser).catch(console.error);
        await loadProfile(appUser.id);
      } else {
        setUser(null);
        setProfile(null);
        setPublicProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Écoute temps réel des changements de profil
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new) setProfile(mapProfile(payload.new));
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'public_profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new) setPublicProfile(mapPublicProfile(payload.new));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{
      user, profile, publicProfile, userLocation, loading,
      isQuotaExceeded: false,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
