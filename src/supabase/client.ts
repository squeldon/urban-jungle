import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL is missing from environment variables');
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing from environment variables');
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable');
}

console.log('Supabase client initialized with URL:', supabaseUrl.substring(0, 30) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
