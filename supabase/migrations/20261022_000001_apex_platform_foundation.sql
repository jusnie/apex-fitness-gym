-- Apex Fitness Gym: local-first sync, profiles, coaching, and community base.
-- All client-exposed tables use Row Level Security. Keep this migration under
-- GPLv3 with the rest of the project source.

create extension if not exists pgcrypto;

create or replace function public.apex_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  display_name text not null default 'Athlete',
  bio text not null default '' check (char_length(bio) <= 280),
  avatar_path text,
  visibility text not null default 'private'
    check (visibility in ('private', 'connections', 'public')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_handle_format check (
    handle is null or handle ~ '^[a-z0-9_]{3,24}$'
  )
);

-- Each device remains independently useful offline. It only needs a stable ID
-- to make sync diagnostics and conflict reports comprehensible.
create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_id text not null,
  display_name text,
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, device_id),
  constraint user_devices_device_id_length check (char_length(device_id) between 8 and 160)
);

-- Generic document store for the existing local model. Records are versioned,
-- soft-deletable, and owned by one account. No private training data is public
-- merely because a user turns on a public profile.
create table if not exists public.sync_documents (
  user_id uuid not null references public.profiles(id) on delete cascade,
  collection text not null check (collection in (
    'profile', 'exercise', 'routine', 'session', 'measurement', 'note',
    'nutrition', 'place', 'progress_shot', 'setting'
  )),
  entity_id text not null check (char_length(entity_id) between 1 and 160),
  payload jsonb not null default '{}'::jsonb,
  version bigint not null default 1 check (version > 0),
  device_id text,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, collection, entity_id)
);

create index if not exists sync_documents_owner_updated_idx
  on public.sync_documents (user_id, updated_at desc);
create index if not exists sync_documents_owner_collection_updated_idx
  on public.sync_documents (user_id, collection, updated_at desc);

-- Connection requests are deliberately not exposed as a public directory.
-- State transitions will be performed by a server-side endpoint so one party
-- cannot forge acceptance/blocks on behalf of the other.
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint connections_distinct_users check (requester_id <> recipient_id),
  unique (requester_id, recipient_id)
);

create index if not exists connections_recipient_status_idx
  on public.connections (recipient_id, status, updated_at desc);
create index if not exists connections_requester_status_idx
  on public.connections (requester_id, status, updated_at desc);

-- SECURITY DEFINER lets profile/feed policies answer a narrow yes/no question
-- without exposing connection rows or creating a recursive RLS policy.
create or replace function public.apex_are_connected(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connections c
    where c.status = 'accepted'
      and ((c.requester_id = a and c.recipient_id = b)
        or (c.requester_id = b and c.recipient_id = a))
  );
$$;

revoke all on function public.apex_are_connected(uuid, uuid) from public;
grant execute on function public.apex_are_connected(uuid, uuid) to authenticated;

-- Coaching is consent based. Both parties can see a relationship but mutation
-- flows are reserved for an authenticated server endpoint.
create table if not exists public.coach_relationships (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'declined', 'ended')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint coach_relationships_distinct_users check (coach_id <> athlete_id),
  unique (coach_id, athlete_id)
);

create index if not exists coach_relationships_athlete_status_idx
  on public.coach_relationships (athlete_id, status, updated_at desc);

create table if not exists public.coach_programs (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  summary text not null default '' check (char_length(summary) <= 800),
  payload jsonb not null default '{}'::jsonb,
  is_template_public boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.program_assignments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.coach_programs(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed', 'revoked')),
  starts_on date,
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (program_id, athlete_id)
);

-- A social item holds only explicitly chosen summary data. Raw sessions stay in
-- sync_documents and are never selected through these policies.
create table if not exists public.activity_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  visibility text not null default 'connections'
    check (visibility in ('private', 'connections', 'public')),
  kind text not null check (kind in ('workout', 'routine', 'milestone', 'challenge')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists activity_posts_feed_idx
  on public.activity_posts (visibility, created_at desc);
create index if not exists activity_posts_owner_idx
  on public.activity_posts (owner_id, created_at desc);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1200),
  rules jsonb not null default '{}'::jsonb,
  visibility text not null default 'connections'
    check (visibility in ('connections', 'public')),
  starts_at timestamptz,
  ends_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint challenges_date_order check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists public.challenge_members (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score numeric not null default 0,
  joined_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (challenge_id, user_id)
);

-- Auth registration creates a private profile automatically. A user chooses a
-- public handle later, after onboarding.
create or replace function public.apex_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Athlete')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists apex_on_auth_user_created on auth.users;
create trigger apex_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.apex_handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_devices enable row level security;
alter table public.sync_documents enable row level security;
alter table public.connections enable row level security;
alter table public.coach_relationships enable row level security;
alter table public.coach_programs enable row level security;
alter table public.program_assignments enable row level security;
alter table public.activity_posts enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_members enable row level security;

create policy "profiles are visible only by consent"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or visibility = 'public'
  or (visibility = 'connections' and public.apex_are_connected(auth.uid(), id))
);
create policy "users create only their own profile"
on public.profiles for insert to authenticated
with check (id = auth.uid());
create policy "users update only their own profile"
on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy "users manage only their devices"
on public.user_devices for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users manage only their private sync documents"
on public.sync_documents for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "participants read their connection requests"
on public.connections for select to authenticated
using (requester_id = auth.uid() or recipient_id = auth.uid());
create policy "users can send their own connection requests"
on public.connections for insert to authenticated
with check (requester_id = auth.uid());
create policy "requesters can withdraw pending requests"
on public.connections for delete to authenticated
using (requester_id = auth.uid() and status = 'pending');

create policy "participants read their coaching relationships"
on public.coach_relationships for select to authenticated
using (coach_id = auth.uid() or athlete_id = auth.uid());
create policy "users can request coaching for themselves"
on public.coach_relationships for insert to authenticated
with check (athlete_id = auth.uid());

create policy "coaches manage their programs"
on public.coach_programs for all to authenticated
using (coach_id = auth.uid()) with check (coach_id = auth.uid());
create policy "active athletes can read assigned programs"
on public.coach_programs for select to authenticated
using (
  exists (
    select 1 from public.program_assignments a
    where a.program_id = id and a.athlete_id = auth.uid() and a.status = 'active'
  )
);

create policy "program participants read their assignments"
on public.program_assignments for select to authenticated
using (coach_id = auth.uid() or athlete_id = auth.uid());
create policy "coaches create assignments for themselves"
on public.program_assignments for insert to authenticated
with check (coach_id = auth.uid());
create policy "coaches update their assignments"
on public.program_assignments for update to authenticated
using (coach_id = auth.uid()) with check (coach_id = auth.uid());

create policy "authors manage their own social posts"
on public.activity_posts for all to authenticated
using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "visible social posts are readable by consent"
on public.activity_posts for select to authenticated
using (
  visibility = 'public'
  or (visibility = 'connections' and public.apex_are_connected(auth.uid(), owner_id))
);

create policy "owners manage their challenges"
on public.challenges for all to authenticated
using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "published challenges are visible by consent"
on public.challenges for select to authenticated
using (
  is_published and (
    visibility = 'public'
    or public.apex_are_connected(auth.uid(), owner_id)
  )
);

create policy "members read visible challenge rosters"
on public.challenge_members for select to authenticated
using (
  exists (
    select 1 from public.challenges c
    where c.id = challenge_id
      and (
        c.owner_id = auth.uid()
        or (c.is_published and (
          c.visibility = 'public'
          or public.apex_are_connected(auth.uid(), c.owner_id)
        ))
      )
  )
);
create policy "users join visible challenges as themselves"
on public.challenge_members for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.challenges c
    where c.id = challenge_id
      and c.is_published
      and (
        c.visibility = 'public'
        or public.apex_are_connected(auth.uid(), c.owner_id)
      )
  )
);
create policy "users leave challenges as themselves"
on public.challenge_members for delete to authenticated
using (user_id = auth.uid());

create trigger apex_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.apex_set_updated_at();
create trigger apex_devices_updated_at
  before update on public.user_devices
  for each row execute procedure public.apex_set_updated_at();
create trigger apex_sync_documents_updated_at
  before update on public.sync_documents
  for each row execute procedure public.apex_set_updated_at();
create trigger apex_connections_updated_at
  before update on public.connections
  for each row execute procedure public.apex_set_updated_at();
create trigger apex_coach_relationships_updated_at
  before update on public.coach_relationships
  for each row execute procedure public.apex_set_updated_at();
create trigger apex_coach_programs_updated_at
  before update on public.coach_programs
  for each row execute procedure public.apex_set_updated_at();
create trigger apex_program_assignments_updated_at
  before update on public.program_assignments
  for each row execute procedure public.apex_set_updated_at();
create trigger apex_activity_posts_updated_at
  before update on public.activity_posts
  for each row execute procedure public.apex_set_updated_at();
create trigger apex_challenges_updated_at
  before update on public.challenges
  for each row execute procedure public.apex_set_updated_at();
create trigger apex_challenge_members_updated_at
  before update on public.challenge_members
  for each row execute procedure public.apex_set_updated_at();
