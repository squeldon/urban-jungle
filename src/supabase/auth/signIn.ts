import { supabase } from '../client';

// Function to sign in with email and password
export default async function signIn(email: string, password: string) {
  let result = null, // Variable to store the sign-in result
    error = null; // Variable to store any error that occurs

  try {
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      error = signInError;
    } else {
      result = data;
    }
  } catch (e) {
    error = e; // Catch and store any error that occurs during sign-in
  }

  return { result, error }; // Return the sign-in result and error (if any)
}
