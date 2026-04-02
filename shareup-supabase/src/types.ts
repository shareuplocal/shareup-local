// src/types.ts
// Migration : suppression de l'import Firebase (Timestamp / FieldValue)
// FirestoreDate → string (les dates sont maintenant des strings ISO 8601)

export type FirestoreDate = string; // Avant: Timestamp | FieldValue | string

// Profil utilisateur privé (table "profiles")
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: 'user' | 'admin';
  isAdmin?: boolean;
  termsAccepted: boolean;
  defaultCity: string;
  defaultLocation: { lat: number; lng: number } | null;
  notifications: {
    newDonations: boolean;
    newMessages: boolean;
    radius: number;
  };
  friends?: string[];
  badges?: string[];
  sharedDonationIds?: string[];
  createdAt: FirestoreDate;
}

// Statistiques utilisateur
export interface UserStats {
  donationsCount: number;
  foodSavedKg: number;
  friendsCount: number;
  receivedCount: number;
  sharedCount: number;
  bakeryCount?: number;
  dairyCount?: number;
  totalWeightSaved?: number;
  [key: string]: number | undefined;
}

// Profil public (table "public_profiles")
export interface PublicProfile {
  uid: string;
  id?: string;
  friendId?: string;
  displayName: string;
  photoURL: string | null;
  badges: string[];
  stats: UserStats;
  isApproved: boolean;
  welcomeMessageSent: boolean;
  role: 'user' | 'admin';
  email?: string;
  lastLocation?: { lat: number; lng: number; updatedAt?: FirestoreDate };
  createdAt: FirestoreDate;
}

export interface ImpactStats {
  global: {
    kg: number;
    meals: number;
    water: number;
    communes: number;
    donors: number;
    products: number;
  };
  personal: {
    kg: number;
    meals: number;
    water: number;
  };
}

// Donation (table "donations")
export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  title: string;
  description: string;
  category: DonationCategory;
  status: 'available' | 'reserved' | 'completed' | 'cancelled';
  location: {
    lat: number;
    lng: number;
    address?: string;
    commune?: string;
    postcode?: string;
  };
  address?: string;
  expiryDate: string;
  barcode?: string;
  weight?: string;
  weightValue: number;
  nutriscore?: string;
  ecoscore?: string;
  novaGroup?: number | null;
  allergens?: string[];
  composition?: string;
  nutriments?: Record<string, number | string | boolean | null>;
  imageUrl?: string;
  receiverId?: string;
  receiverName?: string;
  sharedByUids?: string[];
  isConfirmedByDonor?: boolean;
  isConfirmedByReceiver?: boolean;
  isPlacebo?: boolean;
  completedAt?: FirestoreDate;
  createdAt: FirestoreDate;
}

export type DonationCategory =
  | 'Fruits & Légumes'
  | 'Produits Laitiers'
  | 'Boulangerie'
  | 'Épicerie'
  | 'Boissons'
  | 'Plats Cuisinés'
  | 'Viandes & Poissons'
  | 'Surgelés'
  | 'Hygiène & Beauté'
  | 'Entretien'
  | 'Autre';

// Conversation (table "conversations")
export interface Conversation {
  id: string;
  participants: string[];
  updatedAt: FirestoreDate;
  lastMessage: string;
  lastMessageSenderId: string;
  donationId: string;
  type?: 'welcome' | 'admin_support' | 'donation';
}

// Message (table "messages")
export interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: FirestoreDate;
}

// Ami (table "friends")
export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  friendName: string;
  friendPhoto: string;
  displayName?: string;
  photoURL?: string;
  badges?: string[];
  createdAt: FirestoreDate;
}

// Demande d'ami (table "friend_requests")
export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  fromPhoto: string;
  fromPhotoURL?: string;
  toId: string;
  toName: string;
  toPhoto: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: FirestoreDate;
}

// Signalement (table "reports")
export interface Report {
  reporterId: string;
  reportedId?: string;
  donationId?: string;
  reason: string;
  createdAt: FirestoreDate;
}

export interface ConfirmActionConfig {
  title: string;
  message: string;
  onConfirm: () => void;
  type?: 'danger' | 'success';
}

export interface GlobalStats {
  totalKg: number;
  totalMeals: number;
  totalWater: number;
  uniqueCommunes: number;
  uniqueDonors: number;
  totalProducts: number;
}

export interface CommuneStats {
  communeName: string;
  totalKg: number;
  totalMeals: number;
  totalWater: number;
  totalProducts: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}
