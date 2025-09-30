import { supabase } from '../client';

// Function to sign out the current user
export default async function signOut() {
  let error = null;

  try {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      error = signOutError;
    }
  } catch (e) {
    error = e;
  }

  return { error };
}
