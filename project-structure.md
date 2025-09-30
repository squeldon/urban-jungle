## Tech Stack and External Dependencies

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.9
- **UI**: React 19, Tailwind CSS 4, `lucide-react` icons, `clsx`, `tailwind-merge`
- **Maps**: Leaflet 1.9, `react-leaflet` 5, `leaflet-geosearch`
- **Backend-as-a-Service**: Firebase 12 (Auth, Firestore, Storage)
- **Build/Tooling**: ESLint 9, PostCSS, Autoprefixer

External packages (from `package.json`):

- App runtime: `next@15.5.2`, `react@19.1.1`, `react-dom@19.1.1`
- Styling: `@tailwindcss/postcss`, `tailwindcss@^4.1.12`, `autoprefixer@10.4.21`
- Utilities: `clsx@^2.1.1`, `tailwind-merge@^3.3.1`
- Icons: `lucide-react@^0.544.0`
- Maps: `leaflet@^1.9.4`, `react-leaflet@^5.0.0`, `leaflet-geosearch@^4.2.1`, `@types/leaflet@^1.9.20`
- Firebase: `firebase@^12.2.1`
- Linting/Types: `eslint@9.35.0`, `eslint-config-next@15.5.2`, `typescript@5.9.2`, `@types/node@24.3.1`, `@types/react@19.1.12`, `@types/react-dom@19.1.9`
- Release tooling: `standard-version@^9.5.0`

Firebase services used and configuration:

- Auth: Email/password auth via `firebase/auth`
- Firestore: Collections `listings`, `drafts`, `listingPresets`, `userQuotas`, and user subcollection `users/{userId}/filterPresets`
- Storage: Media uploads (images/videos) under paths `listings/{userId}/{listingId}/...`
- Config from env: `NEXT_PUBLIC_FIREBASE_*` vars read in `src/firebase/config.ts`


## Project Tree

Top-level overview:

- `src/app`: App Router pages/layout
- `src/components`: UI components, forms, panels, and feature UIs
- `src/context`: React contexts
- `src/firebase`: Firebase config and thin wrappers
- `src/hooks`: Custom hooks (state/Firestore integration)
- `src/lib`: Domain/data access utilities (Firestore and Storage), geography helpers
- `src/styles`: Global or feature CSS
- `src/types`: Shared TypeScript types


### src/app

- `src/app/layout.tsx`
  - Purpose: Root layout, loads global CSS and provides `AuthContextProvider` to the app.
  - Depends on: `@/context/AuthContext`, Next font `next/font/google`, global styles.

- `src/app/page.tsx`
  - Purpose: Home page. Orchestrates header, filters, authentication modal, and main content panels (listings + map). Manages filter state via `useFilters` and map overlays/center.
  - Depends on: `@/context/AuthContext`, `next/navigation`, `firebase/auth`, `@/firebase/config`, `@/hooks/useFilters`, `@/components/header/Header`, `@/components/filters/FilterPopup`, `@/components/auth/AuthPopup`, `@/components/MainPanel`, `@/types/map`.

- `src/app/listings/[id]/page.tsx`
  - Purpose: Dynamic listing detail page (by id). Displays individual listing details.
  - Depends on: Listing Firestore utilities and listing types.

- `src/app/profile/page.tsx`
  - Purpose: User profile dashboard page.
  - Depends on: Auth context, user listings/drafts/presets hooks.


### src/components (selected groups)

- `src/components/MainPanel.tsx`
  - Purpose: Coordinates `ListingsPanel` and `MapPanel`, computes header height, passes filters/map props down.
  - Depends on: `@/components/listings/ListingsPanel`, `@/components/MapPanel`, `@/types/listing`, `@/types/map`.

- `src/components/MapPanel.tsx`
  - Purpose: Map container using `BaseMap` with fullscreen toggle and overlays.
  - Depends on: `leaflet` CSS, `@/components/ui/BaseMap`, `@/types/map`.

Header

- `src/components/header/Header.tsx`
  - Purpose: Top bar with search, filters, grid size, user menu; lifts filter/map events to page.
  - Depends on: `GridSizeControls`, `SearchBar`, `UserMenu`, `FilterBubbles`, `FilterDropdowns`, `@/hooks/useFilters`, `@/types/map`.

- `src/components/header/GridSizeControls.tsx`
  - Purpose: Controls size of listing cards grid.
  - Depends on: React state.

- `src/components/header/SearchBar.tsx`
  - Purpose: Location search input and area selection integration.
  - Depends on: `@/components/ui/LocationSearchInput`, `@/types/map`.

- `src/components/header/UserMenu.tsx`
  - Purpose: Auth-related actions (login/logout/profile navigation).
  - Depends on: Parent handlers from `Header`, auth state.

- `src/components/header/FilterBubbles.tsx`, `FilterDropdowns.tsx`
  - Purpose: Display and manipulate active filters.
  - Depends on: `@/hooks/useFilters` types.

Auth

- `src/components/auth/AuthPopup.tsx`
  - Purpose: Modal for sign-in/sign-up flow.
  - Depends on: `@/firebase/auth/signIn`, `@/firebase/auth/signup`, React state.

- `src/components/auth/AuthInitial.tsx`, `AuthLogin.tsx`, `AuthSignup.tsx`
  - Purpose: Step subviews for auth flow.
  - Depends on: Parent `AuthPopup` props.

Filters

- `src/components/filters/FilterPopup.tsx`
  - Purpose: Comprehensive filter dialog for listings.
  - Depends on: `@/hooks/useFilters`.

- `src/components/filters/*Filters.tsx` (Condition, Financing, Price, PropertySpec, PropertyType)
  - Purpose: Individual filter sections used inside filter UIs.
  - Depends on: `@/hooks/useFilters` types.

- `src/components/filters/FilterActions.tsx`, `FilterPresets.tsx`, `index.ts`
  - Purpose: Actions toolbar, preset integration, and exports.
  - Depends on: `@/hooks/useFilters`, presets hooks.

Presets

- `src/components/presets/PresetBubbles.tsx`, `SavePresetModal.tsx`, `ConfirmOverrideModal.tsx`, `index.ts`
  - Purpose: UI to save/apply/override listing form presets.
  - Depends on: `@/hooks/usePresets`, modal props.

Listings

- `src/components/listings/ListingsPanel.tsx`
  - Purpose: Fetches and paginates listings, renders grid of `ListingCard`.
  - Depends on: `@/hooks/useListings`, `@/components/listings/ListingCard`, `@/types/listing`.

- `src/components/listings/ListingCard.tsx`
  - Purpose: Visual card for a single listing, image carousel, favorite toggle.
  - Depends on: `ListingCardMedia`, `ListingCardContent`, `lucide-react`, `@/types/listing`.

- `src/components/listings/ListingCardMedia.tsx`, `ListingCardContent.tsx`, `index.ts`
  - Purpose: Media viewer and textual content segments for listing cards.
  - Depends on: `@/types/listing`.

Listing Form

- `src/components/CreateListingForm.tsx`
  - Purpose: Multi-section form to create/update listings and drafts, manage presets, local storage persistence, and image uploads.
  - Depends on: `@/context/AuthContext`, `@/lib/firestore/listings`, `@/hooks/useListingForm`, `@/hooks/useDrafts`, `@/hooks/usePresets`, form section components, `lucide-react`.

- `src/components/forms/BasicInfoSection.tsx`
  - Purpose: Collects title, type, and core listing metadata.
  - Depends on: `@/types/listing`, form utilities.

- `src/components/forms/PricingAnalysisSection.tsx`
  - Purpose: Manages price, ARV, repair costs, and related ranges.
  - Depends on: `@/types/listing`.

- `src/components/forms/AddressSection.tsx`
  - Purpose: Address fields with location search and map preview/overlay.
  - Depends on: `@/components/ui/FormField`, `@/components/ui/LocationSearchInput`, `@/components/ui/BaseMap`, `@/lib/geographic`, `@/types/map`.

- `src/components/forms/DealTermsSection.tsx`
  - Purpose: Wholesale-specific deal terms (financing, proof of funds, etc.).
  - Depends on: `@/types/listing`.

- `src/components/forms/PropertyFeaturesSection.tsx`
  - Purpose: Manage features and amenities arrays.
  - Depends on: `@/types/listing`.

- `src/components/forms/ContactInfoSection.tsx`
  - Purpose: Seller/agent contact fields.
  - Depends on: `@/types/listing`.

- `src/components/forms/ImageUploadSection.tsx`
  - Purpose: Upload/list/manage media files.
  - Depends on: `@/lib/firebase/storage`, `@/types/listing`.

- `src/components/forms/CompsSection.tsx`
  - Purpose: Manage comparable sales entries.
  - Depends on: `@/types/listing`.

- `src/components/forms/index.ts`, `src/components/index.ts`, and other `index.ts`
  - Purpose: Barrel exports for cleaner imports.
  - Depends on: Local component exports.

UI

- `src/components/ui/BaseMap.tsx`
  - Purpose: Encapsulates Leaflet map, supports overlays and imperative API via ref.
  - Depends on: `leaflet`, `react-leaflet`, `@/types/map`.

- `src/components/ui/LocationSearchInput.tsx`
  - Purpose: Location search powered by `leaflet-geosearch`, emits selected areas/points.
  - Depends on: `leaflet-geosearch`, `@/types/map`.

- `src/components/ui/FormField.tsx`, `CheckboxGroup.tsx`, `TagInput.tsx`, `StorageQuota.tsx`, `index.ts`
  - Purpose: Reusable UI primitives and helpers (form inputs, tags, quota display).
  - Depends on: React, Tailwind CSS, optional domain types.

Modals

- `src/components/DeleteConfirmationModal.tsx`, `ExitConfirmationModal.tsx`
  - Purpose: Confirmation dialogs for destructive/navigation actions.
  - Depends on: React, parent props.


### src/context

- `src/context/AuthContext.tsx`
  - Purpose: Provides current Firebase Auth user and loading state.
  - Depends on: `firebase/auth`, `@/firebase/config`.


### src/firebase

- `src/firebase/config.ts`
  - Purpose: Initialize and export singleton Firebase app instance using env-based config.
  - Depends on: `firebase/app`.

- `src/firebase/auth/signIn.ts`, `signup.ts`
  - Purpose: Thin wrappers over `firebase/auth` email/password APIs returning `{ result, error }`.
  - Depends on: `firebase/auth`, `@/firebase/config`.

- `src/firebase/firestore/addData.ts`, `getData.js`
  - Purpose: Minimal helpers to set/get a doc by id for generic collections.
  - Depends on: `firebase/firestore`, `@/firebase/config`.


### src/hooks

- `src/hooks/useFilters.ts`
  - Purpose: Client-side filter state with localStorage persistence and helpers to convert to Firestore query filters.
  - Depends on: `@/types/listing`.

- `src/hooks/useListings.ts`
  - Purpose: Fetch and paginate listings with optional filters; toggle favorites; increment view counts.
  - Depends on: `@/lib/firestore/listings`, `@/context/AuthContext`, `@/types/listing`, `firebase/firestore` types.

- `src/hooks/useListingForm.ts`
  - Purpose: State manager for the create/edit listing form, including nested updates and list utilities.
  - Depends on: `@/context/AuthContext`, `@/types/listing`.

- `src/hooks/useDrafts.ts`
  - Purpose: Manage user drafts (CRUD + publish), with error/loading state.
  - Depends on: `@/lib/firestore/drafts`, `@/context/AuthContext`, `@/types/listing`.

- `src/hooks/usePresets.ts`
  - Purpose: Manage user presets for the form.
  - Depends on: `@/lib/firestore/presets`, `@/context/AuthContext`, `@/types/listing`.


### src/lib

Firestore data layer

- `src/lib/firestore/listings.ts`
  - Purpose: CRUD for listings, server-side querying with Firestore constraints, client-side post-filtering for complex fields; favorites and view counts.
  - Depends on: `firebase/firestore`, `@/firebase/config`, `@/types/listing`, `@/lib/firebase/storage` (cleanup helpers).

- `src/lib/firestore/drafts.ts`
  - Purpose: CRUD for drafts with image cleanup; publish draft -> listing.
  - Depends on: `firebase/firestore`, `@/firebase/config`, `@/types/listing`, `./listings`, `@/lib/firebase/storage`.

- `src/lib/firestore/presets.ts`
  - Purpose: CRUD for listing presets stored in `listingPresets` collection.
  - Depends on: `firebase/firestore`, `@/firebase/config`, `@/types/listing`.

- `src/lib/firestore/filterPresets.ts`
  - Purpose: CRUD for user-specific saved search/filter presets under `users/{userId}/filterPresets`.
  - Depends on: `firebase/firestore`, `@/firebase/config`, `@/hooks/useFilters` for types/sanitization.

- `src/lib/firestore/userQuotas.ts`
  - Purpose: Track per-user storage usage and monthly upload counts; helper checks and formatters.
  - Depends on: `firebase/firestore`, `@/firebase/config`.

Storage

- `src/lib/firebase/storage.ts`
  - Purpose: Upload/delete media files with validation and quota tracking; helpers for URL parsing and media type checks.
  - Depends on: `firebase/storage`, `@/firebase/config`, `@/lib/firestore/userQuotas`.

Geography

- `src/lib/geographic.ts`
  - Purpose: Convert OSM/GeoJSON-like search results into map overlays; utility to compute bounds/polygons and confidence.
  - Depends on: `@/types/map`.


### src/styles

- `src/styles/map.css`
  - Purpose: Map-specific styles (Leaflet overlays/customizations).
  - Depends on: Included by components that render maps.


### src/types

- `src/types/listing.ts`
  - Purpose: Domain models for `PropertyListing`, `ListingFilters`, drafts, and presets, with rich optional fields.
  - Depends on: TypeScript only.

- `src/types/map.ts`
  - Purpose: Strongly-typed overlay and search area definitions used by map/UI code.
  - Depends on: TypeScript only.


Notes on dependencies and data flow

- UI components depend on hooks for state and on `src/lib/firestore/*` for data access.
- Hooks transform UI-friendly state into Firestore queries and back.
- Firestore modules encapsulate all server-side constraints and conversions (e.g., `Timestamp` <-> `Date`).
- Storage module coordinates with user quotas for safe uploads/deletions.


