import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  getFirestore
} from 'firebase/firestore';
import firebase_app from '@/firebase/config';

const db = getFirestore(firebase_app);

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
    const quotaRef = doc(db, 'userQuotas', userId);
    const quotaSnap = await getDoc(quotaRef);
    
    if (quotaSnap.exists()) {
      const data = quotaSnap.data();
      return {
        userId,
        subscriptionTier: data.subscriptionTier || 'free',
        storageUsed: data.storageUsed || 0,
        storageLimit: STORAGE_LIMITS[data.subscriptionTier as keyof typeof STORAGE_LIMITS || 'free'],
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
        monthlyUploads: data.monthlyUploads || 0,
        monthlyUploadLimit: UPLOAD_LIMITS[data.subscriptionTier as keyof typeof UPLOAD_LIMITS || 'free']
      };
    } else {
      // Create initial quota for new user
      const initialQuota: UserQuota = {
        userId,
        subscriptionTier: 'free',
        storageUsed: 0,
        storageLimit: STORAGE_LIMITS.free,
        lastUpdated: new Date(),
        monthlyUploads: 0,
        monthlyUploadLimit: UPLOAD_LIMITS.free
      };
      
      await setDoc(quotaRef, {
        subscriptionTier: 'free',
        storageUsed: 0,
        lastUpdated: new Date(),
        monthlyUploads: 0
      });
      
      return initialQuota;
    }
  } catch (error) {
    console.error('Error getting user quota:', error);
    throw new Error('Failed to get user quota');
  }
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
    const quotaRef = doc(db, 'userQuotas', userId);
    
    await updateDoc(quotaRef, {
      storageUsed: increment(fileSize),
      monthlyUploads: increment(1),
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error recording file upload:', error);
    throw new Error('Failed to record file upload');
  }
}

/**
 * Record a file deletion (reduce storage used)
 */
export async function recordFileDeletion(userId: string, fileSize: number): Promise<void> {
  try {
    const quotaRef = doc(db, 'userQuotas', userId);
    
    await updateDoc(quotaRef, {
      storageUsed: increment(-fileSize),
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error recording file deletion:', error);
    throw new Error('Failed to record file deletion');
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
    const quotaRef = doc(db, 'userQuotas', userId);
    
    await updateDoc(quotaRef, {
      subscriptionTier: newTier,
      lastUpdated: new Date()
    });
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
 * Reset monthly upload counters (run monthly via Cloud Function)
 */
export async function resetMonthlyCounters(userId: string): Promise<void> {
  try {
    const quotaRef = doc(db, 'userQuotas', userId);
    
    await updateDoc(quotaRef, {
      monthlyUploads: 0,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error resetting monthly counters:', error);
    throw new Error('Failed to reset monthly counters');
  }
}
