'use client'
import { useState, useEffect, useCallback } from 'react';
import { PropertyDraft, CreateDraftData, UpdateDraftData } from '@/types/listing';
import { 
  getUserDrafts, 
  saveDraft, 
  updateDraft, 
  deleteDraft, 
  publishDraft 
} from '@/lib/firestore/drafts';
import { useAuthContext } from '@/context/AuthContext';

export function useDrafts() {
  const { user } = useAuthContext() as { user: any };
  const [drafts, setDrafts] = useState<PropertyDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user drafts
  const fetchDrafts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const userDrafts = await getUserDrafts(user.uid);
      setDrafts(userDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save a new draft
  const createDraft = useCallback(async (draftData: CreateDraftData): Promise<string> => {
    if (!user) {
      throw new Error('You must be logged in to save drafts');
    }

    try {
      const draftId = await saveDraft(draftData, user.uid);
      await fetchDrafts(); // Refresh the list
      return draftId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save draft';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, fetchDrafts]);

  // Update an existing draft
  const updateExistingDraft = useCallback(async (draftId: string, updateData: UpdateDraftData): Promise<void> => {
    if (!user) {
      throw new Error('You must be logged in to update drafts');
    }

    try {
      await updateDraft(draftId, updateData, user.uid);
      await fetchDrafts(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update draft';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, fetchDrafts]);

  // Delete a draft
  const removeDraft = useCallback(async (draftId: string): Promise<void> => {
    if (!user) {
      throw new Error('You must be logged in to delete drafts');
    }

    try {
      await deleteDraft(draftId, user.uid);
      await fetchDrafts(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete draft';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, fetchDrafts]);

  // Publish a draft as a listing
  const publishExistingDraft = useCallback(async (draftId: string): Promise<string> => {
    if (!user) {
      throw new Error('You must be logged in to publish drafts');
    }

    try {
      const listingId = await publishDraft(draftId, user.uid);
      await fetchDrafts(); // Refresh the list
      return listingId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish draft';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, fetchDrafts]);

  // Refresh drafts list
  const refresh = useCallback(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load drafts when user changes
  useEffect(() => {
    if (user) {
      fetchDrafts();
    } else {
      setDrafts([]);
      setError(null);
    }
  }, [user, fetchDrafts]);

  return {
    drafts,
    loading,
    error,
    createDraft,
    updateDraft: updateExistingDraft,
    deleteDraft: removeDraft,
    publishDraft: publishExistingDraft,
    refresh,
    clearError,
  };
}
