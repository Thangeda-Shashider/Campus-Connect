-- =============================================================================
-- Tables
-- =============================================================================

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text unique,
  roll_no text unique,
  role text not null default 'student' check (role in ('student', 'organizer', 'admin')),
  department text,
  year int check (year between 1 and 6),
  interests text[],
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null check (category in ('Hackathon','Workshop','Seminar','Cultural','Sports')),
  tags text[],
  venue text not null,
  date timestamptz not null,
  registration_deadline timestamptz not null,
  max_seats int,
  banner_url text,
  organizer_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'upcoming' check (status in ('upcoming','ongoing','completed','cancelled')),
  registration_form_fields jsonb default '[]'::jsonb,
  has_certificate boolean default false,
  payment_required boolean default false,
  payment_amount numeric,
  payment_qr_url text,
  created_at timestamptz default now()
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  qr_token text unique not null default gen_random_uuid()::text,
  attended boolean default false,
  form_responses jsonb default '{}'::jsonb,
  certificate_issued boolean default false,
  certificate_issued_at timestamptz,
  payment_screenshot_url text,
  payment_status text not null default 'not_required'
    check (payment_status in ('not_required','pending','verified','rejected')),
  payment_verified_at timestamptz,
  payment_rejection_reason text,
  registered_at timestamptz default now(),
  unique(user_id, event_id)
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  type text not null check (type in ('certification','workshop','seminar','webinar','other')),
  issuing_organization text not null,
  completion_date date not null,
  completion_month int generated always as (extract(month from completion_date)::int) stored,
  completion_year int generated always as (extract(year from completion_date)::int) stored,
  description text,
  proof_file_url text,
  proof_file_name text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists events_organizer_id_idx on public.events (organizer_id);
create index if not exists events_status_date_idx on public.events (status, date);
create index if not exists registrations_user_id_idx on public.registrations (user_id);
create index if not exists registrations_event_id_idx on public.registrations (event_id);
create index if not exists achievements_student_id_idx on public.achievements (student_id);
create index if not exists achievements_status_idx on public.achievements (status);

-- =============================================================================
-- Auto-create profile on signup
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, roll_no, role, department, year)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), 'User'),
    new.email,
    nullif(new.raw_user_meta_data->>'roll_no', ''),
    coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'student'),
    nullif(new.raw_user_meta_data->>'department', ''),
    nullif(new.raw_user_meta_data->>'year', '')::int
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.achievements enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (true);

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "events_select" on public.events;
create policy "events_select" on public.events
  for select using (true);

drop policy if exists "events_insert" on public.events;
create policy "events_insert" on public.events
  for insert with check (auth.uid() = organizer_id);

drop policy if exists "events_update" on public.events;
create policy "events_update" on public.events
  for update using (
    auth.uid() = organizer_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "events_delete" on public.events;
create policy "events_delete" on public.events
  for delete using (
    auth.uid() = organizer_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "registrations_select" on public.registrations;
create policy "registrations_select" on public.registrations
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "registrations_insert" on public.registrations;
create policy "registrations_insert" on public.registrations
  for insert with check (auth.uid() = user_id);

drop policy if exists "registrations_update" on public.registrations;
create policy "registrations_update" on public.registrations
  for update using (
    auth.uid() = user_id
    or exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "achievements_select" on public.achievements;
create policy "achievements_select" on public.achievements
  for select using (
    auth.uid() = student_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "achievements_insert" on public.achievements;
create policy "achievements_insert" on public.achievements
  for insert with check (auth.uid() = student_id);

drop policy if exists "achievements_update" on public.achievements;
create policy "achievements_update" on public.achievements
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =============================================================================
-- Storage buckets
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('event-banners', 'event-banners', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('payment-qr', 'payment-qr', true, 2097152, array['image/jpeg','image/png','image/webp','image/gif']),
  ('payment-screenshots', 'payment-screenshots', false, 5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('achievement-proofs', 'achievement-proofs', false, 10485760, array['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public buckets: anyone can read
drop policy if exists "event_banners_select" on storage.objects;
create policy "event_banners_select" on storage.objects
  for select using (bucket_id = 'event-banners');

drop policy if exists "payment_qr_select" on storage.objects;
create policy "payment_qr_select" on storage.objects
  for select using (bucket_id = 'payment-qr');

-- Authenticated users can upload to public buckets (path: {userId}/...)
drop policy if exists "event_banners_insert" on storage.objects;
create policy "event_banners_insert" on storage.objects
  for insert with check (
    bucket_id = 'event-banners'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "payment_qr_insert" on storage.objects;
create policy "payment_qr_insert" on storage.objects
  for insert with check (
    bucket_id = 'payment-qr'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "event_banners_delete" on storage.objects;
create policy "event_banners_delete" on storage.objects
  for delete using (
    bucket_id = 'event-banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "payment_qr_delete" on storage.objects;
create policy "payment_qr_delete" on storage.objects
  for delete using (
    bucket_id = 'payment-qr'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Private: payment screenshots — owner, organizers, and admins can read
drop policy if exists "payment_screenshots_select" on storage.objects;
create policy "payment_screenshots_select" on storage.objects
  for select using (
    bucket_id = 'payment-screenshots'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles where id = auth.uid() and role in ('organizer', 'admin'))
    )
  );

drop policy if exists "payment_screenshots_insert" on storage.objects;
create policy "payment_screenshots_insert" on storage.objects
  for insert with check (
    bucket_id = 'payment-screenshots'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Private: achievement proofs — owner and admin can read
drop policy if exists "achievement_proofs_select" on storage.objects;
create policy "achievement_proofs_select" on storage.objects
  for select using (
    bucket_id = 'achievement-proofs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );

drop policy if exists "achievement_proofs_insert" on storage.objects;
create policy "achievement_proofs_insert" on storage.objects
  for insert with check (
    bucket_id = 'achievement-proofs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
