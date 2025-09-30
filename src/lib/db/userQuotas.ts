import { supabase } from '@/supabase/client';

export interface UserQuota {
  userId: string;
  subscriptionTier: 'free' | 'pro' | 'business';
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes
  lastUpdated: Date;
  monthlyUploads: number; // reset monthly
  monthlyUploadLimit: number;
}

// Storage limits in bytes
export const STORAGE_LIMITS = {
  free: 2 * 1024 * 1024 * 1024,      // 2GB
  pro: 50 * 1024 * 1024 * 1024,     // 50GB  
  business: 500 * 1024 * 1024 * 1024 // 500GB
} as const;

// Monthly upload limits (number of files)
export const UPLOAD_LIMITS = {
  free: 100,        // ~10 listings with 10 photos each
  pro: 2000,        // ~200 listings 
  business: 10000   // Essentially unlimited
} as const;

/**
 * Get user's current quota information
 */
export async function getUserQuota(userId: string): Promise<UserQuota> {
  try {
    const { data, error } = await supabase
      .from('user_quotas')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // If user quota doesn't exist, create it
      if (error.code === 'PGRST116') {
        return await createInitialQuota(userId);
      }
      throw error;
    }
    
    if (data) {
      // Determine subscription tier from user metadata (default to 'free')
      const subscriptionTier = 'free'; // TODO: Get from user metadata or separate subscription table
      
      return {
        userId,
        subscriptionTier,
        storageUsed: data.storage_used_bytes || 0,
        storageLimit: STORAGE_LIMITS[subscriptionTier],
        lastUpdated: new Date(data.updated_at),
        monthlyUploads: data.monthly_uploads_count || 0,
        monthlyUploadLimit: UPLOAD_LIMITS[subscriptionTier]
      };
    }
    
    // If no data, create initial quota
    return await createInitialQuota(userId);
  } catch (error) {
    console.error('Error getting user quota:', error);
    throw new Error('Failed to get user quota');
  }
}

/**
 * Create initial quota for new user
 */
async function createInitialQuota(userId: string): Promise<UserQuota> {
  const initialQuota: UserQuota = {
    userId,
    subscriptionTier: 'free',
    storageUsed: 0,
    storageLimit: STORAGE_LIMITS.free,
    lastUpdated: new Date(),
    monthlyUploads: 0,
    monthlyUploadLimit: UPLOAD_LIMITS.free
  };
  
  const { error } = await supabase
    .from('user_quotas')
    .insert({
      user_id: userId,
      storage_used_bytes: 0,
      monthly_uploads_count: 0,
      quota_reset_date: new Date().toISOString().split('T')[0]
    });
  
  if (error) {
    console.error('Error creating initial quota:', error);
    // If it already exists (race condition), fetch it
    if (error.code === '23505') {
      return getUserQuota(userId);
    }
    throw error;
  }
  
  return initialQuota;
}

/**
 * Check if user can upload a file of given size
 */
export async function canUploadFile(userId: string, fileSize: number): Promise<{
  canUpload: boolean;
  reason?: string;
  quotaInfo: UserQuota;
}> {
  try {
    const quota = await getUserQuota(userId);
    
    // Check storage limit
    if (quota.storageUsed + fileSize > quota.storageLimit) {
      return {
        canUpload: false,
        reason: `Storage limit exceeded. Used: ${formatBytes(quota.storageUsed)} / ${formatBytes(quota.storageLimit)}`,
        quotaInfo: quota
      };
    }
    
    // Check monthly upload limit
    if (quota.monthlyUploads >= quota.monthlyUploadLimit) {
      return {
        canUpload: false,
        reason: `Monthly upload limit reached: ${quota.monthlyUploads}/${quota.monthlyUploadLimit} files`,
        quotaInfo: quota
      };
    }
    
    return {
      canUpload: true,
      quotaInfo: quota
    };
  } catch (error) {
    console.error('Error checking upload permission:', error);
    throw error;
  }
}

/**
 * Record a successful file upload
 */
export async function recordFileUpload(userId: string, fileSize: number): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_user_quota', {
      p_user_id: userId,
      p_bytes: fileSize,
      p_upload_count: 1
    });
    
    if (error) {
      // Fallback to manual update if function doesn't exist
      console.warn('RPC function not found, using fallback method');
      await fallbackRecordFileUpload(userId, fileSize);
    }
  } catch (error) {
    console.error('Error recording file upload:', error);
    throw new Error('Failed to record file upload');
  }
}

/**
 * Fallback method to record file upload (if RPC function doesn't exist)
 */
async function fallbackRecordFileUpload(userId: string, fileSize: number): Promise<void> {
  // First, ensure the user quota exists
  const quota = await getUserQuota(userId);
  
  // Then update it with calculated values
  const { error } = await supabase
    .from('user_quotas')
    .update({
      storage_used_bytes: quota.storageUsed + fileSize,
      monthly_uploads_count: quota.monthlyUploads + 1,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
  
  if (error) {
    throw error;
  }
}

/**
 * Record a file deletion (reduce storage used)
 */
export async function recordFileDeletion(userId: string, fileSize: number): Promise<void> {
  try {
    const { error } = await supabase.rpc('decrement_user_quota', {
      p_user_id: userId,
      p_bytes: fileSize
    });
    
    if (error) {
      // Fallback to manual update if function doesn't exist
      console.warn('RPC function not found, using fallback method');
      await fallbackRecordFileDeletion(userId, fileSize);
    }
  } catch (error) {
    console.error('Error recording file deletion:', error);
    throw new Error('Failed to record file deletion');
  }
}

/**
 * Fallback method to record file deletion (if RPC function doesn't exist)
 */
async function fallbackRecordFileDeletion(userId: string, fileSize: number): Promise<void> {
  const quota = await getUserQuota(userId);
  
  const { error } = await supabase
    .from('user_quotas')
    .update({
      storage_used_bytes: Math.max(0, quota.storageUsed - fileSize),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
  
  if (error) {
    throw error;
  }
}

/**
 * Upgrade user's subscription tier
 */
export async function upgradeUserTier(
  userId: string, 
  newTier: 'free' | 'pro' | 'business'
): Promise<void> {
  try {
    // Note: In a real implementation, you would store the subscription tier
    // in the user's metadata or a separate subscriptions table
    // For now, this is a placeholder
    console.log(`Upgrading user ${userId} to ${newTier} tier`);
    
    // TODO: Update user metadata or subscriptions table
    // await supabase.auth.updateUser({
    //   data: { subscription_tier: newTier }
    // });
  } catch (error) {
    console.error('Error upgrading user tier:', error);
    throw new Error('Failed to upgrade user tier');
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get storage usage percentage
 */
export function getStorageUsagePercentage(storageUsed: number, storageLimit: number): number {
  return Math.round((storageUsed / storageLimit) * 100);
}

/**
 * Reset monthly upload counters (run monthly via cron job or Edge Function)
 */
export async function resetMonthlyCounters(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_quotas')
      .update({
        monthly_uploads_count: 0,
        quota_reset_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error resetting monthly counters:', error);
    throw new Error('Failed to reset monthly counters');
  }
}

/**
 * Reset all users' monthly counters (admin function)
 */
export async function resetAllMonthlyCounters(): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_quotas')
      .update({
        monthly_uploads_count: 0,
        quota_reset_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .lt('quota_reset_date', new Date().toISOString().split('T')[0]);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error resetting all monthly counters:', error);
    throw new Error('Failed to reset all monthly counters');
  }
}
