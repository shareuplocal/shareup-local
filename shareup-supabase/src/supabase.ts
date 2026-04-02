import { createClient } from '@supabase/supabase-js';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile, PublicProfile, Donation, Conversation, Message, Friend, FriendRequest } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ─── Guard: env vars manquantes = erreur claire au lieu d'écran blanc ─────────
if (!supabaseUrl || !supabaseAnonKey) {
  const msg = "❌ SHAREUP — Variables d'environnement Supabase manquantes !\n\nCréez shareup-supabase/.env avec VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY\nOu configurez-les dans Netlify : Site Settings → Environment Variables";
  console.error(msg);
  document.body.innerHTML = `<div style="font-family:monospace;padding:2rem;color:#dc2626;background:#fef2f2;min-height:100vh;display:flex;align-items:center;justify-content:center"><pre style="background:#fff;padding:2rem;border-radius:12px;border:1px solid #fca5a5;white-space:pre-wrap;max-width:600px">${msg}</pre></div>`;
}

export const supabase = createClient(supabaseUrl ?? 'https://placeholder.supabase.co', supabaseAnonKey ?? 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ─── AppUser : wrapper compatible avec le code existant ──────────────────────
export interface AppUser extends SupabaseUser {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

export function toAppUser(user: SupabaseUser): AppUser {
  return {
    ...user,
    uid: user.id,
    displayName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    photoURL: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
  };
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
  return data;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const deleteAccount = async () => {
  const { error } = await supabase.rpc('delete_user');
  if (error) throw error;
};

// ─── Mappers DB (snake_case) ↔ App (camelCase) ───────────────────────────────

export function mapProfile(row: any): UserProfile {
  return {
    uid: row.id,
    displayName: row.display_name || '',
    email: row.email || '',
    photoURL: row.photo_url,
    role: row.role || 'user',
    termsAccepted: row.terms_accepted || false,
    defaultCity: row.default_city || '',
    defaultLocation: row.default_location || null,
    notifications: row.notifications || { newDonations: true, newMessages: true, radius: 10 },
    badges: row.badges || [],
    sharedDonationIds: row.shared_donation_ids || [],
    createdAt: row.created_at,
  };
}

export function toDbProfile(p: Partial<UserProfile>): any {
  const row: any = {};
  if (p.displayName !== undefined) row.display_name = p.displayName;
  if (p.email !== undefined) row.email = p.email;
  if (p.photoURL !== undefined) row.photo_url = p.photoURL;
  if (p.role !== undefined) row.role = p.role;
  if (p.termsAccepted !== undefined) row.terms_accepted = p.termsAccepted;
  if (p.defaultCity !== undefined) row.default_city = p.defaultCity;
  if (p.defaultLocation !== undefined) row.default_location = p.defaultLocation;
  if (p.notifications !== undefined) row.notifications = p.notifications;
  if (p.badges !== undefined) row.badges = p.badges;
  if (p.sharedDonationIds !== undefined) row.shared_donation_ids = p.sharedDonationIds;
  return row;
}

export function mapPublicProfile(row: any): PublicProfile {
  return {
    uid: row.id,
    id: row.id,
    displayName: row.display_name || '',
    photoURL: row.photo_url,
    badges: row.badges || [],
    stats: row.stats || { donationsCount: 0, foodSavedKg: 0, friendsCount: 0, receivedCount: 0, sharedCount: 0 },
    isApproved: row.is_approved ?? true,
    welcomeMessageSent: row.welcome_message_sent || false,
    role: row.role || 'user',
    email: row.email,
    lastLocation: row.last_location || undefined,
    createdAt: row.created_at,
  };
}

export function toDbPublicProfile(p: Partial<PublicProfile>): any {
  const row: any = {};
  if (p.displayName !== undefined) row.display_name = p.displayName;
  if (p.photoURL !== undefined) row.photo_url = p.photoURL;
  if (p.badges !== undefined) row.badges = p.badges;
  if (p.stats !== undefined) row.stats = p.stats;
  if (p.isApproved !== undefined) row.is_approved = p.isApproved;
  if (p.welcomeMessageSent !== undefined) row.welcome_message_sent = p.welcomeMessageSent;
  if (p.role !== undefined) row.role = p.role;
  if (p.lastLocation !== undefined) row.last_location = p.lastLocation;
  return row;
}

export function mapDonation(row: any): Donation {
  return {
    id: row.id, donorId: row.donor_id || '', donorName: row.donor_name || '',
    title: row.title || '', description: row.description || '', category: row.category,
    status: row.status || 'available', location: row.location || { lat: 0, lng: 0 },
    address: row.location?.address, expiryDate: row.expiry_date || '', barcode: row.barcode,
    weight: row.weight, weightValue: row.weight_value || 0, nutriscore: row.nutriscore,
    ecoscore: row.ecoscore, novaGroup: row.nova_group, allergens: row.allergens || [],
    composition: row.composition, nutriments: row.nutriments || {}, imageUrl: row.image_url,
    receiverId: row.receiver_id, receiverName: row.receiver_name, sharedByUids: row.shared_by_uids || [],
    isConfirmedByDonor: row.is_confirmed_by_donor || false, isConfirmedByReceiver: row.is_confirmed_by_receiver || false,
    isPlacebo: row.is_placebo || false, createdAt: row.created_at, completedAt: row.completed_at,
  };
}

export function toDbDonation(d: Partial<Donation>): any {
  const row: any = {};
  if (d.donorId !== undefined) row.donor_id = d.donorId;
  if (d.donorName !== undefined) row.donor_name = d.donorName;
  if (d.title !== undefined) row.title = d.title;
  if (d.description !== undefined) row.description = d.description;
  if (d.category !== undefined) row.category = d.category;
  if (d.status !== undefined) row.status = d.status;
  if (d.location !== undefined) row.location = d.location;
  if (d.expiryDate !== undefined) row.expiry_date = d.expiryDate;
  if (d.barcode !== undefined) row.barcode = d.barcode;
  if (d.weight !== undefined) row.weight = d.weight;
  if (d.weightValue !== undefined) row.weight_value = d.weightValue;
  if (d.nutriscore !== undefined) row.nutriscore = d.nutriscore;
  if (d.ecoscore !== undefined) row.ecoscore = d.ecoscore;
  if (d.novaGroup !== undefined) row.nova_group = d.novaGroup;
  if (d.allergens !== undefined) row.allergens = d.allergens;
  if (d.composition !== undefined) row.composition = d.composition;
  if (d.nutriments !== undefined) row.nutriments = d.nutriments;
  if (d.imageUrl !== undefined) row.image_url = d.imageUrl;
  if (d.receiverId !== undefined) row.receiver_id = d.receiverId;
  if (d.receiverName !== undefined) row.receiver_name = d.receiverName;
  if (d.sharedByUids !== undefined) row.shared_by_uids = d.sharedByUids;
  if (d.isConfirmedByDonor !== undefined) row.is_confirmed_by_donor = d.isConfirmedByDonor;
  if (d.isConfirmedByReceiver !== undefined) row.is_confirmed_by_receiver = d.isConfirmedByReceiver;
  if (d.isPlacebo !== undefined) row.is_placebo = d.isPlacebo;
  if (d.completedAt !== undefined) row.completed_at = d.completedAt;
  return row;
}

export function mapConversation(row: any): Conversation {
  return {
    id: row.id, participants: row.participants || [], donationId: row.donation_id || '',
    lastMessage: row.last_message || '', lastMessageSenderId: row.last_message_sender_id || '',
    updatedAt: row.updated_at, type: row.type || 'donation',
  };
}

export function mapMessage(row: any): Message {
  return { id: row.id, text: row.text || '', senderId: row.sender_id || '', createdAt: row.created_at };
}

export function mapFriend(row: any): Friend {
  return {
    id: row.id, userId: row.user_id, friendId: row.friend_id,
    friendName: row.friend_name || '', friendPhoto: row.friend_photo || '',
    displayName: row.friend_name, photoURL: row.friend_photo, createdAt: row.created_at,
  };
}

export function mapFriendRequest(row: any): FriendRequest {
  return {
    id: row.id, fromId: row.from_id, fromName: row.from_name || '',
    fromPhoto: row.from_photo || '', fromPhotoURL: row.from_photo || '',
    toId: row.to_id, toName: row.to_name || '', toPhoto: row.to_photo || '',
    status: row.status || 'pending', createdAt: row.created_at,
  };
}
