# Supabase Database Setup Instructions

## Overview

This guide will help you set up the complete database schema for Urban Jungle in your Supabase project.

## Prerequisites

- Supabase project created at [app.supabase.com](https://app.supabase.com)
- Environment variables set in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Setup Steps

### Option 1: Using Supabase Dashboard (Recommended for beginners)

1. **Navigate to SQL Editor**
   - Go to your [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Click on **SQL Editor** in the left sidebar

2. **Run Migration 1: Initial Schema**
   - Click **New Query**
   - Copy and paste the entire contents of `supabase/migrations/001_initial_schema.sql`
   - Click **Run** or press `Ctrl+Enter`
   - Wait for the query to complete (should see "Success" message)

3. **Run Migration 2: Row Level Security**
   - Click **New Query** again
   - Copy and paste the entire contents of `supabase/migrations/002_row_level_security.sql`
   - Click **Run**
   - Wait for completion

4. **Set Up Storage Bucket**
   - Click on **Storage** in the left sidebar
   - Click **New bucket**
   - Configure as follows:
     - **Name**: `listings`
     - **Public bucket**: ✅ Enable (for public read access)
     - Click **Create bucket**

5. **Set Up Storage Policies**
   - Click on the `listings` bucket
   - Go to **Policies** tab
   - Add the following policies:

   **Policy 1: Public Read**
   ```
   Name: Public can view listing media
   Definition: SELECT
   Target roles: public
   USING expression: true
   ```

   **Policy 2: Authenticated Upload**
   ```
   Name: Users can upload their own media
   Definition: INSERT
   Target roles: authenticated
   WITH CHECK expression: (bucket_id = 'listings'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
   ```

   **Policy 3: Authenticated Update**
   ```
   Name: Users can update their own media
   Definition: UPDATE
   Target roles: authenticated
   USING expression: (bucket_id = 'listings'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
   ```

   **Policy 4: Authenticated Delete**
   ```
   Name: Users can delete their own media
   Definition: DELETE
   Target roles: authenticated
   USING expression: (bucket_id = 'listings'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
   ```

### Option 2: Using Supabase CLI (Recommended for production)

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link to your project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Run migrations**
   ```bash
   supabase db push
   ```

5. **Set up storage via Dashboard** (follow steps 4-5 from Option 1)

## Verification

### 1. Check Tables Created

Go to **Table Editor** in your Supabase Dashboard and verify these tables exist:
- ✅ `listings`
- ✅ `drafts`
- ✅ `listing_presets`
- ✅ `filter_presets`
- ✅ `favorites`
- ✅ `user_quotas`
- ✅ `listing_media`

### 2. Check RLS Enabled

For each table:
- Click on the table
- Go to **Settings** → **Row Level Security**
- Verify RLS is **Enabled**
- Verify policies are listed

### 3. Check Storage Bucket

- Go to **Storage**
- Verify `listings` bucket exists
- Verify it's marked as **Public**
- Verify policies are in place

### 4. Run Test Page

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to: http://localhost:3000/test-supabase

3. The test should now work with the real tables!

## Database Schema Overview

### Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `listings` | Active property listings | title, price, property_type, address, status |
| `drafts` | Unpublished draft listings | Same as listings, all fields optional |
| `listing_presets` | Reusable form templates | name, preset_data (JSONB) |
| `filter_presets` | Saved search filters | name, filters (JSONB) |
| `favorites` | User-listing favorites | user_id, listing_id |
| `user_quotas` | Storage usage tracking | storage_used_bytes, monthly_uploads_count |
| `listing_media` | Media file metadata | storage_object_path, bytes, listing_id/draft_id |

### Key Features

- **Automatic timestamps**: All tables have `created_at` and `updated_at` with auto-update triggers
- **Cascade deletes**: Deleting a user removes all their data
- **Favorites counter**: Automatically maintained via triggers
- **JSONB fields**: Flexible storage for complex nested data (address, contact info, deal terms)
- **Array fields**: Native PostgreSQL arrays for features, amenities, tags
- **Indexes**: Optimized for common queries (price, type, location, features)

## Security Model

### Row Level Security (RLS)

All tables have RLS enabled with the following access patterns:

- **Listings**: Public read for active listings, owner full access
- **Drafts**: Owner-only access
- **Presets**: Owner-only access
- **Favorites**: Owner-only access
- **Quotas**: Owner read/write access

### Storage Security

- **Public read**: Anyone can view uploaded images/videos
- **Authenticated write**: Users can only upload to their own folders
- **Path structure**: `listings/{user_id}/{listing_id}/{filename}`

## Troubleshooting

### Migration fails with "relation already exists"

The migration is idempotent and uses `IF NOT EXISTS` clauses. If you see this error, it means the table was already created. You can safely ignore it or drop the existing tables and re-run.

### RLS policies not working

1. Verify RLS is enabled on the table
2. Check that you're authenticated (test with a logged-in user)
3. Verify the policy SQL matches your use case
4. Check the Supabase logs for policy violations

### Storage upload fails

1. Verify the bucket exists and is public
2. Check storage policies are correctly set
3. Ensure file path follows the pattern: `listings/{user_id}/...`
4. Check file size doesn't exceed limits

## Next Steps

After setting up the database:

1. ✅ Test the connection using `/test-supabase`
2. 🔄 Proceed with migrating the authentication layer
3. 🔄 Update the data access layer (hooks and lib)
4. 🔄 Update components to use Supabase

See `supabase-migration.md` for the full migration plan.

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)
