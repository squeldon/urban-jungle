## Supabase Migration Plan

Goal: Migrate from Firebase (Auth, Firestore, Storage) to Supabase (Auth, Postgres, Storage) with no cloud data migration. Preserve UI/UX and public APIs; replace data layer, auth, and storage; maintain feature set.

- [ ] Phase 0 — Preparation
  - Create a Supabase project (or local via `supabase start`) and a storage bucket `listings`.
  - Dependencies:
    - Remove: `firebase`
    - Add: `@supabase/supabase-js`
  - Environment variables:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - Optional service role for server-only tasks
  - Add `src/supabase/client.ts` (singleton browser client).
  - Add feature flag: `NEXT_PUBLIC_DATA_PROVIDER=supabase|firebase` (default to `supabase` when stable).

- [ ] Phase 1 — Data model (Firestore → Postgres)
  - Map Firestore collections/subcollections to Postgres tables. Prefer UUID PKs and `created_at/updated_at` timestamps.
  - Tables:
    - `listings` (core listing data; owner FK to `auth.users`)
    - `listing_presets` (JSONB)
    - `filter_presets` (JSONB)
    - `user_quotas`
    - `listing_media` (object path + metadata)
    - `comps` (optional JSONB if needed by `CompsSection`)
  - Consider JSONB for flexible fields; normalize high-cardinality filters (e.g., features) if they’re frequently queried.
  - Starter schema (illustrative):

```sql
create extension if not exists pgcrypto;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id),
  title text not null,
  description text,
  type text,
  price numeric,
  arv numeric,
  repair_costs numeric,
  address_line1 text,
  city text,
  state text,
  postal_code text,
  features jsonb default '[]'::jsonb,
  favorites_count integer not null default 0,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  storage_object_path text not null,
  mime_type text,
  bytes bigint,
  created_at timestamptz not null default now()
);

-- Indexes (adjust to actual filters)
create index if not exists listings_type_price_idx on public.listings (type, price);
create index if not exists listings_created_at_desc_idx on public.listings (created_at desc);
create index if not exists listings_features_gin_idx on public.listings using gin (features);
```

- [ ] Phase 2 — Security (RLS + Storage policies)
  - Enable RLS for all tables and add policies:

```sql
alter table public.listings enable row level security;

create policy "Public can read listings"
on public.listings for select
to public
using (true);

create policy "Owners can insert listings"
on public.listings for insert
to authenticated
with check (auth.uid() = owner_user_id);

create policy "Owners can update/delete their listings"
on public.listings for all
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

alter table public.listing_media enable row level security;
create policy "Owners manage media"
on public.listing_media for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

  - Storage bucket `listings` policies:
    - Authenticated users can upload/delete under `listings/{user_id}/...`.
    - Public read for media (optional) via bucket policy.

- [ ] Phase 3 — Auth migration
  - Replace Firebase Auth with Supabase Auth in `src/context/AuthContext.tsx`.
  - Implement wrappers replacing `@/firebase/auth/signIn` and `signup` using Supabase (`signInWithPassword`, `signUp`) and keep `{ result, error }` shape.
  - Update components relying on auth (`UserMenu`, `AuthPopup`, etc.) to consume the new context; aim to keep their prop-level API stable.

- [ ] Phase 4 — Storage migration
  - Replace `src/lib/firebase/storage.ts` with `src/lib/storage.ts` using Supabase Storage API.
  - Implement `uploadMedia`, `deleteMedia`, `getPublicUrl`; scope paths to `listings/{user_id}/{listing_id}/...`.
  - Integrate with `user_quotas` table for tracking usage and monthly counts.
  - Update `ImageUploadSection` to use the new module without changing UI behavior.

- [ ] Phase 5 — Data-access layer migration
  - Create `src/lib/db/` to replace `src/lib/firestore/*` modules:
    - `db/listings.ts` (CRUD, filter translation, pagination, favorites toggle, view counts)
    - `db/drafts.ts`, `db/presets.ts`, `db/filterPresets.ts`, `db/userQuotas.ts`
  - Update hooks to import new modules: `useListings`, `useDrafts`, `usePresets`, `useListingForm`.
  - Keep component-level APIs stable (e.g., return shapes from hooks) to minimize UI changes.

- [ ] Phase 6 — Realtime (optional)
  - If Firestore realtime was used, add Supabase Realtime channels:
    - Subscribe to `public:listings` changes.
    - Subscribe to `favorites` filtered by current `user_id` for per-user updates.

- [ ] Phase 7 — Indexing and performance
  - Translate `firestore.indexes.json` intent to Postgres indexes on frequently filtered columns.
  - Add text search (optional): GIN index on `to_tsvector('english', title || ' ' || coalesce(description,''))`.
  - Consider normalizing frequently filtered arrays to avoid JSONB performance traps.

- [ ] Phase 8 — Local dev, migrations, and seeding
  - Add Supabase CLI; check in SQL under `supabase/migrations`.
  - Create seed data for a few users, listings, presets, and quotas.
  - Update `.env.local` with Supabase keys.

- [ ] Phase 9 — Cutover plan
  - Implement feature flag selection in app bootstrap to choose provider.
  - Validate in a preview environment:
    - Auth lifecycle (login/logout/signup)
    - Listing CRUD and pagination
    - Image upload/delete and quota updates
    - Presets and filter presets
    - Favorites toggle and counts
  - Switch flag to `supabase` in production build; monitor.

- [ ] Phase 10 — Cleanup
  - Remove `firebase` from `package.json` and lockfile.
  - Remove `src/firebase/*`, `firebase.json`, `firestore.rules`, `storage.rules`.
  - Update `README.md` and `project-structure.md` to reflect Supabase.

### File-by-file guidance (repo-specific)
- Replace modules:
  - `src/firebase/config.ts` → `src/supabase/client.ts`
  - `src/firebase/auth/{signIn,signup}.ts` → Supabase equivalents (preserve exported function names/signatures when possible)
  - `src/lib/firestore/{listings,drafts,presets,filterPresets,userQuotas}.ts` → `src/lib/db/*`
  - `src/lib/firebase/storage.ts` → `src/lib/storage.ts`
- Update dependents:
  - `src/context/AuthContext.tsx` → use Supabase auth
  - Hooks: `useListings`, `useDrafts`, `usePresets`, `useListingForm`
  - Components importing old modules: `CreateListingForm.tsx`, `ImageUploadSection.tsx`, listings components
- Keep untouched:
  - Map components (`src/components/ui/BaseMap.tsx`, `LocationSearchInput.tsx`) and Leaflet code
  - `src/lib/geographic.ts`, `src/types/map.ts`

### Testing/acceptance checklist
- Auth: session persists; `AuthContext` user correct across reloads.
- Listings: owner-only create/update/delete enforced; filters paginate correctly.
- Media: upload/delete OK; paths scoped to user; public URLs resolve; quotas update.
- Presets: save/apply listing presets and filter presets per user.
- Favorites: toggle works; counts and UI reflect state; RLS prevents cross-user access.
- Performance: indexes in place; listing queries performant.
- Realtime (if enabled): subscriptions receive updates.

### Rough timeline (estimate)
- 0.5 day: Supabase project, env, client wiring
- 1.5–2 days: Schema + RLS + indexes
- 2–3 days: Data-access modules
- 1–2 days: Hooks and component wire-up
- 0.5–1 day: Storage + quotas
- 0.5 day: Realtime (optional)
- 1 day: Testing, cutover, cleanup


