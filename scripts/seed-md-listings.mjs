/*
  Seed listings for Maryland locations using Nominatim geocoding.
  
  Requirements:
    - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env file
    - Optional: SEED_USER_EMAIL, SEED_USER_PASSWORD, SEED_USER_ID
  
  Usage:
    node scripts/seed-md-listings.mjs
*/

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const SEED_USER_EMAIL = process.env.SEED_USER_EMAIL || 'seed.user@example.com';
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD || 'TempPassword123!';
const SEED_USER_ID = process.env.SEED_USER_ID;

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

// Nominatim geocoding with proper user agent and rate limiting
async function geocodeAddress(street, city, state, zipCode = null) {
  const query = zipCode 
    ? `${street}, ${city}, ${state} ${zipCode}, USA`
    : `${street}, ${city}, ${state}, USA`;
  
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.append('q', query);
  url.searchParams.append('format', 'json');
  url.searchParams.append('limit', '1');
  url.searchParams.append('addressdetails', '1');
  
  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'UrbanJungle-Seeder/1.0 (Real Estate Wholesale Platform)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.length === 0) {
      console.warn(`No results for: ${query}`);
      return null;
    }
    
    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
      address: result.address,
    };
  } catch (error) {
    console.error(`Geocoding error for ${query}:`, error.message);
    return null;
  }
}

// Sleep to respect Nominatim's rate limit (1 request per second)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureSeedUser() {
  if (SEED_USER_ID) return SEED_USER_ID;
  const { data: users, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) throw listErr;
  const existing = users.users.find(u => (u.email || '').toLowerCase() === SEED_USER_EMAIL.toLowerCase());
  if (existing) return existing.id;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: SEED_USER_EMAIL,
    password: SEED_USER_PASSWORD,
    email_confirm: true,
  });
  if (createErr) throw createErr;
  if (!created.user) throw new Error('Failed to create seed user');
  return created.user.id;
}

// Maryland street-level addresses to geocode
const mdAddresses = [
  // Baltimore
  { street: 'Charles St', city: 'Baltimore', state: 'MD', zip: '21201', type: 'apartment' },
  { street: 'Pratt St', city: 'Baltimore', state: 'MD', zip: '21202', type: 'condo' },
  { street: 'Light St', city: 'Baltimore', state: 'MD', zip: '21202', type: 'townhouse' },
  { street: 'Cathedral St', city: 'Baltimore', state: 'MD', zip: '21201', type: 'apartment' },
  { street: 'Park Ave', city: 'Baltimore', state: 'MD', zip: '21217', type: 'house' },
  { street: 'Bolton St', city: 'Baltimore', state: 'MD', zip: '21217', type: 'duplex' },
  { street: 'Calvert St', city: 'Baltimore', state: 'MD', zip: '21202', type: 'apartment' },
  { street: 'Howard St', city: 'Baltimore', state: 'MD', zip: '21201', type: 'commercial' },
  
  // Owings Mills
  { street: 'Owings Mills Blvd', city: 'Owings Mills', state: 'MD', zip: '21117', type: 'house' },
  { street: 'Reisterstown Rd', city: 'Owings Mills', state: 'MD', zip: '21117', type: 'townhouse' },
  { street: 'Painters Mill Rd', city: 'Owings Mills', state: 'MD', zip: '21117', type: 'house' },
  { street: 'Lyons Mill Rd', city: 'Owings Mills', state: 'MD', zip: '21117', type: 'duplex' },
  { street: 'Garrison Forest Rd', city: 'Owings Mills', state: 'MD', zip: '21117', type: 'house' },
  { street: 'Dolfield Blvd', city: 'Owings Mills', state: 'MD', zip: '21117', type: 'townhouse' },
  
  // Reisterstown
  { street: 'Main St', city: 'Reisterstown', state: 'MD', zip: '21136', type: 'house' },
  { street: 'Appaloosa Dr', city: 'Reisterstown', state: 'MD', zip: '21136', type: 'house' },
  { street: 'Riding Crop Way', city: 'Reisterstown', state: 'MD', zip: '21136', type: 'townhouse' },
  { street: 'Butler Rd', city: 'Reisterstown', state: 'MD', zip: '21136', type: 'house' },
  { street: 'Glyndon Dr', city: 'Reisterstown', state: 'MD', zip: '21136', type: 'duplex' },
  { street: 'Hanover Rd', city: 'Reisterstown', state: 'MD', zip: '21136', type: 'house' },
  
  // Ellicott City
  { street: 'Main St', city: 'Ellicott City', state: 'MD', zip: '21043', type: 'commercial' },
  { street: 'Columbia Rd', city: 'Ellicott City', state: 'MD', zip: '21044', type: 'house' },
  { street: 'Frederick Rd', city: 'Ellicott City', state: 'MD', zip: '21043', type: 'townhouse' },
  { street: 'Rogers Ave', city: 'Ellicott City', state: 'MD', zip: '21043', type: 'house' },
  { street: 'Bethany Ln', city: 'Ellicott City', state: 'MD', zip: '21042', type: 'house' },
  { street: 'Montgomery Rd', city: 'Ellicott City', state: 'MD', zip: '21043', type: 'duplex' },
  
  // Towson
  { street: 'York Rd', city: 'Towson', state: 'MD', zip: '21204', type: 'apartment' },
  { street: 'Towsontown Blvd', city: 'Towson', state: 'MD', zip: '21204', type: 'condo' },
  { street: 'Chesapeake Ave', city: 'Towson', state: 'MD', zip: '21204', type: 'house' },
  { street: 'Allegheny Ave', city: 'Towson', state: 'MD', zip: '21204', type: 'townhouse' },
  { street: 'Dulaney Valley Rd', city: 'Towson', state: 'MD', zip: '21204', type: 'house' },
  { street: 'Washington Ave', city: 'Towson', state: 'MD', zip: '21204', type: 'duplex' },
];

async function buildListings(createdBy) {
  const listings = [];
  const allowedTypes = new Set(['house','apartment','condo','townhouse','duplex','triplex','fourplex','land','commercial']);
  
  console.log('Geocoding addresses using Nominatim (this will take a while to respect rate limits)...');
  
  for (let idx = 0; idx < mdAddresses.length; idx++) {
    const addr = mdAddresses[idx];
    console.log(`[${idx + 1}/${mdAddresses.length}] Geocoding: ${addr.street}, ${addr.city}, ${addr.state}`);
    
    const geoResult = await geocodeAddress(addr.street, addr.city, addr.state, addr.zip);
    
    if (!geoResult) {
      console.log(`  ⚠️  Skipping - geocoding failed`);
      continue;
    }
    
    console.log(`  ✓ Found: ${geoResult.lat.toFixed(6)}, ${geoResult.lng.toFixed(6)}`);
    
    const type = allowedTypes.has(addr.type) ? addr.type : 'house';
    const title = `${type.charAt(0).toUpperCase() + type.slice(1)} on ${addr.street}, ${addr.city}`;
    const description = `Excellent ${type} opportunity on ${addr.street} in ${addr.city}. Great location with easy access to local amenities and major routes.`;
    const tags = [addr.city.toLowerCase().replace(/\s+/g, '-'), 'maryland', type];
    
    const conditions = ['good','fair','needs-cosmetic','excellent'];
    const property_condition = conditions[idx % conditions.length];
    
    // Generate realistic price based on location and type
    const basePrices = {
      'Baltimore': 250000,
      'Owings Mills': 320000,
      'Reisterstown': 280000,
      'Ellicott City': 380000,
      'Towson': 350000,
    };
    
    const typeMultipliers = {
      'house': 1.0,
      'apartment': 0.7,
      'condo': 0.8,
      'townhouse': 0.85,
      'duplex': 1.1,
      'triplex': 1.3,
      'fourplex': 1.5,
      'commercial': 1.4,
      'land': 0.4,
    };
    
    const basePrice = basePrices[addr.city] || 300000;
    const price = Math.round(basePrice * (typeMultipliers[type] || 1.0) * (0.9 + Math.random() * 0.2));
    
    const listing = {
      created_by: createdBy,
      title,
      description,
      price,
      property_type: type,
      listing_type: (idx % 3 === 0 ? 'wholesale' : idx % 3 === 1 ? 'sale' : 'rent'),
      bedrooms: type === 'land' || type === 'commercial' ? null : 2 + (idx % 4),
      bathrooms: type === 'land' || type === 'commercial' ? null : 1 + ((idx % 3) * 0.5),
      square_feet: type === 'land' ? null : 1000 + (idx * 100),
      lot_size: 0.12 + (idx % 8) * 0.05,
      year_built: type === 'land' ? null : 1960 + (idx % 55),
      arv: price ? Math.round(price * 1.18) : null,
      repair_costs: 3000 + (idx % 8) * 4000,
      wholesale_fee: 4000 + (idx % 5) * 2000,
      property_condition,
      occupancy_status: (idx % 2 === 0 ? 'vacant' : 'tenant-occupied'),
      monthly_rent: type === 'commercial' ? 2500 + (idx % 10) * 300 : 1400 + (idx % 8) * 200,
      address: {
        street: addr.street,
        streetName: addr.street,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zip,
        country: 'US',
      },
      coordinates: {
        lat: geoResult.lat,
        lng: geoResult.lng,
      },
      features: ['garage', 'garden', 'basement', 'updated-kitchen', 'hardwood-floors'].slice(0, (idx % 4) + 1),
      amenities: ['parking', 'laundry', 'pet-friendly', 'storage'].slice(0, (idx % 4) + 1),
      images: [],
      contact_info: { name: 'Seed User', email: SEED_USER_EMAIL, isOwner: true },
      deal_terms: {
        financingOptions: ['cash-only', 'hard-money', 'seller-financing', 'conventional'].slice(0, (idx % 3) + 1),
        earnestMoneyDeposit: 5000 + (idx % 3) * 2500,
        proofOfFundsRequired: idx % 3 === 0,
      },
      comps: [],
      tags,
      status: 'active',
      is_verified: false,
      views: 0,
    };
    
    listings.push(listing);
    
    // Respect Nominatim rate limit (1 request per second)
    if (idx < mdAddresses.length - 1) {
      await sleep(1100); // 1.1 seconds to be safe
    }
  }
  
  return listings;
}

async function main() {
  console.log('Seeding Maryland listings with Nominatim geocoding...\n');
  const userId = await ensureSeedUser();
  console.log('Using seed user id:', userId);
  console.log('');
  
  const rows = await buildListings(userId);
  
  if (rows.length === 0) {
    console.error('\nNo listings to insert (all geocoding failed)');
    process.exit(1);
  }
  
  console.log(`\nInserting ${rows.length} listings into database...`);
  
  const batchSize = 20;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await admin.from('listings').insert(batch);
    if (error) {
      console.error('Insert error:', error);
      process.exitCode = 1;
      return;
    }
    console.log(`Inserted ${Math.min(i + batchSize, rows.length)} of ${rows.length}`);
  }
  
  console.log('\n✅ Done! Inserted', rows.length, 'Maryland listings.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
