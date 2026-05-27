-- Faith Companion Database Schema
-- PostgreSQL / Supabase

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS PROFILE
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  avatar_url text,
  is_premium boolean not null default false,
  prayer_streak integer not null default 0,
  longest_streak integer not null default 0,
  total_prayers integer not null default 0,
  premium_expires_at timestamptz,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================================
-- PRAYERS
-- ============================================================
create type prayer_category as enum (
  'gratitude', 'petition', 'intercession', 'confession',
  'praise', 'healing', 'guidance', 'protection',
  'thanksgiving', 'other'
);

create type prayer_status as enum ('active', 'answered', 'archived');

create table public.prayers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  category prayer_category not null default 'other',
  status prayer_status not null default 'active',
  is_favorite boolean not null default false,
  answered_at timestamptz,
  answered_note text,
  voice_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_prayers_user_id on public.prayers(user_id);
create index idx_prayers_status on public.prayers(user_id, status);
create index idx_prayers_created on public.prayers(user_id, created_at desc);

alter table public.prayers enable row level security;

create policy "Users can view own prayers"
  on public.prayers for select
  using (auth.uid() = user_id);

create policy "Users can insert own prayers"
  on public.prayers for insert
  with check (auth.uid() = user_id);

create policy "Users can update own prayers"
  on public.prayers for update
  using (auth.uid() = user_id);

create policy "Users can delete own prayers"
  on public.prayers for delete
  using (auth.uid() = user_id);

-- ============================================================
-- PRAYER REFLECTIONS
-- ============================================================
create table public.prayer_reflections (
  id uuid primary key default uuid_generate_v4(),
  prayer_id uuid not null references public.prayers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_reflections_prayer on public.prayer_reflections(prayer_id);

alter table public.prayer_reflections enable row level security;

create policy "Users can view own reflections"
  on public.prayer_reflections for select
  using (auth.uid() = user_id);

create policy "Users can insert own reflections"
  on public.prayer_reflections for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- DEVOTIONALS
-- ============================================================
create type mood_type as enum (
  'peaceful', 'grateful', 'anxious', 'hopeful', 'joyful',
  'sorrowful', 'stressed', 'encouraged', 'lonely', 'content'
);

create table public.devotionals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  scripture_reference text not null,
  scripture_text text not null,
  reflection_prompt text not null,
  prayer_suggestion text not null,
  mood_tag mood_type,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_devotionals_user on public.devotionals(user_id, created_at desc);

alter table public.devotionals enable row level security;

create policy "Users can view own devotionals"
  on public.devotionals for select
  using (auth.uid() = user_id);

create policy "Users can insert own devotionals"
  on public.devotionals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own devotionals"
  on public.devotionals for update
  using (auth.uid() = user_id);

-- ============================================================
-- MOOD ENTRIES
-- ============================================================
create table public.mood_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mood mood_type not null,
  intensity integer not null check (intensity between 1 and 5),
  note text,
  created_at timestamptz not null default now()
);

create index idx_moods_user on public.mood_entries(user_id, created_at desc);

alter table public.mood_entries enable row level security;

create policy "Users can view own moods"
  on public.mood_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own moods"
  on public.mood_entries for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- AI CONVERSATIONS
-- ============================================================
create table public.ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New Conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_conversations_user on public.ai_conversations(user_id, updated_at desc);

alter table public.ai_conversations enable row level security;

create policy "Users can view own conversations"
  on public.ai_conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert own conversations"
  on public.ai_conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.ai_conversations for delete
  using (auth.uid() = user_id);

-- ============================================================
-- AI MESSAGES
-- ============================================================
create table public.ai_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_messages_conversation on public.ai_messages(conversation_id, created_at asc);

alter table public.ai_messages enable row level security;

create policy "Users can view own messages"
  on public.ai_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own messages"
  on public.ai_messages for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- PRAYER REMINDERS
-- ============================================================
create table public.prayer_reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  time time not null,
  days integer[] not null default '{0,1,2,3,4,5,6}',
  is_active boolean not null default true,
  push_token text,
  created_at timestamptz not null default now()
);

create index idx_reminders_user on public.prayer_reminders(user_id);

alter table public.prayer_reminders enable row level security;

create policy "Users can manage own reminders"
  on public.prayer_reminders for all
  using (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger prayers_updated_at
  before update on public.prayers
  for each row execute function public.update_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger conversations_updated_at
  before update on public.ai_conversations
  for each row execute function public.update_updated_at();

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
