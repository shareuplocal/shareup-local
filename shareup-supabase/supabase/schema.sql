-- ============================================================
-- SHAREUP - Schéma Supabase (Corrigé - 100% UUID)
-- ============================================================

-- Suppression des tables si elles existent déjà
drop table if exists public.reports cascade;
drop table if exists public.friend_requests cascade;
drop table if exists public.friends cascade;
drop table if exists public.messages cascade;
drop table if exists public.conversations cascade;
drop table if exists public.donations cascade;
drop table if exists public.public_profiles cascade;
drop table if exists public.profiles cascade;
drop table if exists public.stats cascade;

-- Profils privés
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  email text,
  photo_url text,
  role text default 'user',
  terms_accepted boolean default false,
  default_city text default '',
  default_location jsonb,
  notifications jsonb default '{"newDonations": true, "newMessages": true, "radius": 10}',
  badges text[] default '{}',
  shared_donation_ids uuid[] default '{}', -- Corrigé en uuid[]
  created_at timestamptz default now()
);

-- Profils publics
create table public.public_profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  photo_url text,
  badges text[] default '{}',
  stats jsonb default '{"donationsCount": 0, "foodSavedKg": 0, "friendsCount": 0, "receivedCount": 0, "sharedCount": 0}',
  is_approved boolean default true,
  welcome_message_sent boolean default false,
  role text default 'user',
  email text,
  last_location jsonb,
  created_at timestamptz default now()
);

-- Donations
create table public.donations (
  id uuid default gen_random_uuid() primary key,
  donor_id uuid references auth.users on delete set null,
  donor_name text,
  title text not null,
  description text default '',
  category text default 'Autre',
  status text default 'available',
  location jsonb,
  expiry_date text,
  barcode text,
  weight text,
  weight_value double precision default 0,
  nutriscore text,
  ecoscore text,
  nova_group integer,
  allergens text[] default '{}',
  composition text,
  nutriments jsonb default '{}',
  image_url text,
  receiver_id uuid, -- Déjà OK
  receiver_name text,
  shared_by_uids uuid[] default '{}', -- Corrigé en uuid[]
  participant_ids uuid[] default '{}', -- Corrigé en uuid[]
  is_confirmed_by_donor boolean default false,
  is_confirmed_by_receiver boolean default false,
  is_placebo boolean default false,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Conversations
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  participants uuid[] default '{}', -- Corrigé en uuid[]
  donation_id uuid, -- Corrigé en uuid
  last_message text default '',
  last_message_sender_id uuid, -- Corrigé en uuid
  type text default 'donation',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Messages
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations on delete cascade,
  sender_id uuid, -- Corrigé en uuid
  text text not null,
  created_at timestamptz default now()
);

-- Amis
create table public.friends (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null, -- Corrigé en uuid
  friend_id uuid not null, -- Corrigé en uuid
  friend_name text,
  friend_photo text,
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

-- Demandes d'amis
create table public.friend_requests (
  id uuid default gen_random_uuid() primary key,
  from_id uuid not null, -- Corrigé en uuid
  from_name text,
  from_photo text,
  to_id uuid not null, -- Corrigé en uuid
  to_name text,
  to_photo text,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Signalements
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid, -- Corrigé en uuid
  reported_id uuid, -- Corrigé en uuid
  donation_id uuid, -- Corrigé en uuid
  type text,
  reason text,
  created_at timestamptz default now()
);

-- Stats globales (L'ID reste en text ici, c'est généralement un nom comme 'global' ou '2024')
create table public.stats (
  id text primary key,
  data jsonb default '{}'
);

-- ============================================================
-- Activer le Realtime pour les mises