/*
  Delete all listings from the database.
  
  Requirements:
    - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env file
  
  Usage:
    node scripts/delete-all-listings.mjs
*/

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables from .env file
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_SECRET_KEY) {
  console.error('Missing SUPABASE_SECRET_KEY');
  process.exit(1);
}

if (!SUPABASE_URL) {
  console.error('Missing SUPABASE_URL');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function main() {
  console.log('⚠️  DELETE ALL LISTINGS');
  console.log('================================\n');
  
  // First, count how many listings exist
  const { count, error: countError } = await admin
    .from('listings')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('Error counting listings:', countError);
    process.exit(1);
  }
  
  if (count === 0) {
    console.log('No listings found in the database.');
    return;
  }
  
  console.log(`Found ${count} listing(s) in the database.\n`);
  
  const confirmed = await askConfirmation('Are you sure you want to DELETE ALL listings? (yes/no): ');
  
  if (!confirmed) {
    console.log('\n❌ Deletion cancelled.');
    return;
  }
  
  console.log('\nDeleting all listings...');
  
  const { error: deleteError } = await admin
    .from('listings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that's always true)
  
  if (deleteError) {
    console.error('Error deleting listings:', deleteError);
    process.exit(1);
  }
  
  console.log(`\n✅ Successfully deleted ${count} listing(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
