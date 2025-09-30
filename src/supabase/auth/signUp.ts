import { supabase } from '../client';

// Function to sign up a user with email and password
export default async function signUp(email: string, password: string) {
  let result = null, // Variable to store the sign-up result
    error = null; // Variable to store any error that occurs

  try {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      error = signUpError;
    } else {
      result = data;
    }
  } catch (e) {
    error = e; // Catch and store any error that occurs during sign-up
  }

  return { result, error }; // Return the sign-up result and error (if any)
}
