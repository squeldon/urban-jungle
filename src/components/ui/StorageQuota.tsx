'use client'
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { getUserQuota, formatBytes, getStorageUsagePercentage, type UserQuota } from '@/lib/firestore/userQuotas';
import { Cloud, Upload, Zap } from 'lucide-react';

interface StorageQuotaProps {
  className?: string;
  showUpgradePrompt?: boolean;
}

export function StorageQuota({ className = '', showUpgradePrompt = true }: StorageQuotaProps) {
  const { user } = useAuthContext() as { user: any };
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuota() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userQuota = await getUserQuota(user.uid);
        setQuota(userQuota);
      } catch (error) {
        console.error('Error loading user quota:', error);
      } finally {
        setLoading(false);
      }
    }

    loadQuota();
  }, [user]);

  const refreshQuota = async () => {
    if (!user) return;
    
    try {
      const userQuota = await getUserQuota(user.uid);
      setQuota(userQuota);
    } catch (error) {
      console.error('Error refreshing quota:', error);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!quota) {
    return null;
  }

  const usagePercentage = getStorageUsagePercentage(quota.storageUsed, quota.storageLimit);
  const isNearLimit = usagePercentage >= 80;
  const isOverLimit = usagePercentage >= 100;

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'pro': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'business': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getProgressBarColor = () => {
    if (isOverLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-900 dark:text-white">Storage Usage</span>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getTierBadgeColor(quota.subscriptionTier)}`}>
          {quota.subscriptionTier}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>{formatBytes(quota.storageUsed)} used</span>
          <span>{formatBytes(quota.storageLimit)} total</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {usagePercentage}% used
        </div>
      </div>

      {/* Upload Limit */}
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
        <div className="flex items-center gap-1">
          <Upload className="w-3 h-3" />
          <span>Monthly uploads:</span>
        </div>
        <span>{quota.monthlyUploads}/{quota.monthlyUploadLimit}</span>
      </div>

      {/* Warning/Upgrade Messages */}
      {isOverLimit && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
          <p className="text-red-800 dark:text-red-200 text-sm font-medium">
            Storage limit exceeded! Please upgrade your plan or delete some files.
          </p>
        </div>
      )}

      {isNearLimit && !isOverLimit && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
            You&apos;re approaching your storage limit. Consider upgrading soon.
          </p>
        </div>
      )}

      {/* Upgrade Prompt */}
      {showUpgradePrompt && quota.subscriptionTier === 'free' && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-blue-800 dark:text-blue-200 text-sm font-medium mb-1">
                Upgrade to Pro
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-xs mb-2">
                Get 50GB storage + unlimited monthly uploads for more listings
              </p>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-md transition-colors"
                onClick={() => {
                  // TODO: Integrate with your subscription system
                  alert('Upgrade feature coming soon!');
                }}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={refreshQuota}
        className="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        Refresh usage
      </button>
    </div>
  );
}
