-- =====================================================
-- Urban Jungle - Quota Management Functions
-- =====================================================
-- These functions help manage user quotas atomically
-- =====================================================

-- Function to increment user quota (storage and upload count)
CREATE OR REPLACE FUNCTION increment_user_quota(
  p_user_id UUID,
  p_bytes BIGINT,
  p_upload_count INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  -- Insert or update user quota
  INSERT INTO public.user_quotas (
    user_id,
    storage_used_bytes,
    monthly_uploads_count,
    quota_reset_date,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_bytes,
    p_upload_count,
    CURRENT_DATE,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    storage_used_bytes = public.user_quotas.storage_used_bytes + p_bytes,
    monthly_uploads_count = public.user_quotas.monthly_uploads_count + p_upload_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement user quota (storage only)
CREATE OR REPLACE FUNCTION decrement_user_quota(
  p_user_id UUID,
  p_bytes BIGINT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_quotas
  SET
    storage_used_bytes = GREATEST(0, storage_used_bytes - p_bytes),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly upload counters for users whose reset date has passed
CREATE OR REPLACE FUNCTION reset_expired_monthly_quotas()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE public.user_quotas
  SET
    monthly_uploads_count = 0,
    quota_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE quota_reset_date < CURRENT_DATE;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Grant execute permissions to authenticated users
-- =====================================================
GRANT EXECUTE ON FUNCTION increment_user_quota(UUID, BIGINT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_user_quota(UUID, BIGINT) TO authenticated;

-- Only service role should reset quotas
GRANT EXECUTE ON FUNCTION reset_expired_monthly_quotas() TO service_role;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON FUNCTION increment_user_quota IS 'Atomically increment user storage quota and upload count';
COMMENT ON FUNCTION decrement_user_quota IS 'Atomically decrement user storage quota';
COMMENT ON FUNCTION reset_expired_monthly_quotas IS 'Reset monthly upload counters for users whose reset date has passed (run daily via cron)';
