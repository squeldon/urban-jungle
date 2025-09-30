# Supabase Storage Migration Guide

## Overview

This document explains the storage migration from Firebase Storage to Supabase Storage for the Urban Jungle project.

## Migration Components

### 1. Storage Module (`src/supabase/storage.ts`)

The new Supabase storage module provides the same API as the Firebase version for backward compatibility:

**Key Functions:**
- `uploadFile(file, userId, listingId?, draftId?)` - Upload a single file
- `uploadImage(file, userId, listingId?)` - Upload an image (backward compat)
- `uploadMultipleFiles(files, userId, listingId?, onProgress?)` - Upload multiple files
- `deleteFile(fileUrl, userId?)` - Delete a file
- `deleteMultipleFiles(fileUrls, userId?)` - Delete multiple files
- Helper functions: `isImageFile()`, `isVideoFile()`, `getFileTypeFromUrl()`, etc.

**Features:**
- ✅ Same API as Firebase version for easy migration
- ✅ Supports images and videos
- ✅ Size validation (10MB for images, 100MB for videos)
- ✅ Quota checking before upload
- ✅ Automatic metadata tracking in `listing_media` table
- ✅ Path structure: `{userId}/{listingId|draftId|temp}/{filename}`

### 2. User Quotas Module (`src/lib/db/userQuotas.ts`)

Replaces `src/lib/firestore/userQuotas.ts` with Supabase equivalents:

**Key Functions:**
- `getUserQuota(userId)` - Get current quota info
- `canUploadFile(userId, fileSize)` - Check if user can upload
- `recordFileUpload(userId, fileSize)` - Record successful upload
- `recordFileDeletion(userId, fileSize)` - Record file deletion
- `upgradeUserTier(userId, newTier)` - Upgrade subscription tier
- Helper functions: `formatBytes()`, `getStorageUsagePercentage()`

**Quota Limits:**
- Free: 2GB storage, 100 monthly uploads
- Pro: 50GB storage, 2000 monthly uploads
- Business: 500GB storage, 10000 monthly uploads

### 3. Listing Media Module (`src/lib/db/listingMedia.ts`)

New module for managing the `listing_media` table:

**Key Functions:**
- `recordMediaUpload(params)` - Record media in database
- `recordMediaDeletion(storagePath)` - Remove media record
- `getListingMedia(listingId)` - Get all media for a listing
- `getDraftMedia(draftId)` - Get all media for a draft
- `associateMediaWithListing(storagePath, listingId)` - Associate media when publishing

**Benefits:**
- Track all uploaded files for quota management
- Enable cleanup of orphaned files
- Associate files with listings/drafts
- Store file metadata (size, type, path)

## Storage Bucket Setup

### 1. Create the Bucket

**Option A: Via Dashboard**
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `listings`
4. Public bucket: ✅ Enabled
5. Click "Create bucket"

**Option B: Via SQL**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true);
```

### 2. Apply Storage Policies

Run the migration file:
```bash
# Via Supabase Dashboard SQL Editor
# Copy and paste: supabase/migrations/003_storage_policies.sql

# Or via CLI
supabase db push
```

The policies ensure:
- ✅ Public can read all files (for listing images)
- ✅ Users can only upload to their own folder (`{userId}/...`)
- ✅ Users can only update/delete their own files
- ✅ Path validation enforced at database level

### 3. Install Quota Functions

Run the migration file:
```bash
# Copy and paste: supabase/migrations/004_quota_functions.sql
```

This creates SQL functions for atomic quota updates:
- `increment_user_quota(userId, bytes, uploadCount)` - Atomic increment
- `decrement_user_quota(userId, bytes)` - Atomic decrement
- `reset_expired_monthly_quotas()` - Reset monthly counters (cron job)

## Migration Steps

### Step 1: Verify Database Schema

Ensure these migrations are applied:
- ✅ `001_initial_schema.sql` - Creates `user_quotas` and `listing_media` tables
- ✅ `002_row_level_security.sql` - Enables RLS on all tables
- ✅ `003_storage_policies.sql` - Creates storage bucket policies
- ✅ `004_quota_functions.sql` - Creates quota management functions

### Step 2: Update Environment Variables

Ensure these are set in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Step 3: Update Import Statements

**Before (Firebase):**
```typescript
import { uploadImage, deleteImage } from '@/lib/firebase/storage';
```

**After (Supabase):**
```typescript
import { uploadImage, deleteImage } from '@/supabase/storage';
```

### Step 4: Update Quota Imports

**Before (Firestore):**
```typescript
import { canUploadFile } from '@/lib/firestore/userQuotas';
```

**After (Supabase):**
```typescript
import { canUploadFile } from '@/lib/db/userQuotas';
```

### Step 5: No Code Changes Required!

Because the API is identical, no code changes are needed in components that use storage. The same function signatures work:

```typescript
// This works with both Firebase and Supabase!
const url = await uploadImage(file, userId, listingId);
await deleteImage(url, userId);
```

## Differences from Firebase

### URL Format

**Firebase:**
```
https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?token=...
```

**Supabase:**
```
https://{project}.supabase.co/storage/v1/object/public/listings/{path}
```

### Path Structure

Both use the same logical structure:
```
{userId}/{listingId|draftId|temp}/{filename}
```

Example:
```
550e8400-e29b-41d4-a716-446655440000/
  123e4567-e89b-12d3-a456-426614174000/
    1696123456789_house_photo.jpg
    1696123457890_property_video.mp4
  temp/
    1696123458900_draft_image.jpg
```

### Metadata Tracking

**Firebase:**
- Metadata stored only in Firestore
- File size retrieved during upload, not after

**Supabase:**
- Metadata stored in `listing_media` table
- File size always available for quota tracking
- Can query all files by user/listing/draft

## Testing the Migration

### 1. Test File Upload

```typescript
import { uploadImage } from '@/supabase/storage';

const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const url = await uploadImage(file, 'user-id-123', 'listing-id-456');
console.log('Uploaded:', url);
```

### 2. Verify in Database

```sql
-- Check user quota updated
SELECT * FROM user_quotas WHERE user_id = 'user-id-123';

-- Check media record created
SELECT * FROM listing_media WHERE user_id = 'user-id-123';
```

### 3. Test File Deletion

```typescript
import { deleteImage } from '@/supabase/storage';

await deleteImage(url, 'user-id-123');
```

### 4. Verify Cleanup

```sql
-- Check quota decremented
SELECT * FROM user_quotas WHERE user_id = 'user-id-123';

-- Check media record deleted
SELECT * FROM listing_media WHERE storage_object_path LIKE '%test.jpg';
```

## Troubleshooting

### Upload Fails with "unauthorized"

**Cause:** Storage policies not applied or user not authenticated

**Solution:**
1. Verify bucket exists and is public
2. Run `003_storage_policies.sql` migration
3. Ensure user is authenticated via Supabase Auth
4. Check path format: must be `{userId}/...`

### Quota Not Updating

**Cause:** RPC functions not created or permissions missing

**Solution:**
1. Run `004_quota_functions.sql` migration
2. Verify functions exist: `SELECT * FROM pg_proc WHERE proname LIKE '%quota%';`
3. Check function permissions

### Media Record Not Created

**Cause:** RLS blocking insert or table doesn't exist

**Solution:**
1. Verify `listing_media` table exists
2. Check RLS policies on `listing_media`
3. Ensure user is authenticated

### File Size Unknown During Deletion

**Cause:** Media record not found in database

**Solution:**
- Quota will not be decremented, but deletion will succeed
- This is expected for old files uploaded before migration
- Can manually update quotas if needed

## Rollback Plan

If you need to rollback to Firebase:

1. **Change imports back:**
   ```typescript
   import { uploadImage } from '@/lib/firebase/storage';
   import { canUploadFile } from '@/lib/firestore/userQuotas';
   ```

2. **Keep both implementations** during transition period using feature flags:
   ```typescript
   const useSupabase = process.env.NEXT_PUBLIC_DATA_PROVIDER === 'supabase';
   const storage = useSupabase 
     ? require('@/supabase/storage')
     : require('@/lib/firebase/storage');
   ```

3. **Data migration:** Files remain in their respective storage systems. To migrate:
   - Download from Firebase Storage
   - Upload to Supabase Storage
   - Update URLs in database

## Performance Considerations

### Upload Speed
- Supabase Storage is comparable to Firebase
- Both support resumable uploads for large files
- Consider implementing upload progress tracking

### Download Speed
- Public bucket enables CDN caching
- Supabase uses Cloudflare CDN by default
- Consider image transformations for thumbnails

### Quota Checks
- Quota checks happen before upload (1 database query)
- Use RPC functions for atomic updates (prevents race conditions)
- Consider caching quota info for frequently uploading users

## Next Steps

After storage migration:

1. ✅ Storage module created
2. ✅ Quota management implemented
3. ✅ Media tracking implemented
4. 🔄 Update components to use new imports
5. 🔄 Test upload/delete workflows
6. 🔄 Migrate existing files (optional)
7. 🔄 Remove Firebase Storage dependencies

See `supabase-migration.md` for the complete migration plan.

## Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Policies Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [Image Transformations](https://supabase.com/docs/guides/storage/image-transformations)
- [Storage CDN](https://supabase.com/docs/guides/storage/cdn)
