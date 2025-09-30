/*
  Seed a couple dozen example listings across the US for locational search testing.

  Requirements:
    - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env file
    - Optional: SEED_USER_EMAIL, SEED_USER_PASSWORD, SEED_USER_ID

  Usage:
    node scripts/seed-listings.mjs
*/

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const SEED_USER_EMAIL = process.env.SEED_USER_EMAIL || 'seed.user@example.com';
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD || 'TempPassword123!';
const SEED_USER_ID = process.env.SEED_USER_ID; // Optional explicit UUID

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

function buildListings(createdBy) {
  const entries = [
    { city: 'Seattle', state: 'WA', zip: '98101', lat: 47.6097, lng: -122.3331, street: '1201 3rd Ave', type: 'condo', price: 650000 },
    { city: 'Portland', state: 'OR', zip: '97205', lat: 45.5202, lng: -122.6742, street: '800 SW 6th Ave', type: 'house', price: 520000 },
    { city: 'San Francisco', state: 'CA', zip: '94103', lat: 37.7749, lng: -122.4194, street: '1355 Market St', type: 'apartment', price: 950000 },
    { city: 'Los Angeles', state: 'CA', zip: '90012', lat: 34.0522, lng: -118.2437, street: '200 N Spring St', type: 'duplex', price: 780000 },
    { city: 'San Diego', state: 'CA', zip: '92101', lat: 32.7157, lng: -117.1611, street: '1600 Pacific Hwy', type: 'townhouse', price: 620000 },
    { city: 'Las Vegas', state: 'NV', zip: '89109', lat: 36.1699, lng: -115.1398, street: '3500 S Las Vegas Blvd', type: 'house', price: 410000 },
    { city: 'Phoenix', state: 'AZ', zip: '85004', lat: 33.4484, lng: -112.0740, street: '200 W Washington St', type: 'house', price: 380000 },
    { city: 'Denver', state: 'CO', zip: '80202', lat: 39.7392, lng: -104.9903, street: '1437 Bannock St', type: 'triplex', price: 690000 },
    { city: 'Albuquerque', state: 'NM', zip: '87102', lat: 35.0844, lng: -106.6504, street: '400 Marquette Ave NW', type: 'land', price: 150000 },
    { city: 'Dallas', state: 'TX', zip: '75201', lat: 32.7767, lng: -96.7970, street: '1500 Marilla St', type: 'house', price: 350000 },
    { city: 'Austin', state: 'TX', zip: '78701', lat: 30.2672, lng: -97.7431, street: '301 W 2nd St', type: 'house', price: 450000 },
    { city: 'Houston', state: 'TX', zip: '77002', lat: 29.7604, lng: -95.3698, street: '901 Bagby St', type: 'fourplex', price: 520000 },
    { city: 'New Orleans', state: 'LA', zip: '70112', lat: 29.9511, lng: -90.0715, street: '1300 Perdido St', type: 'house', price: 320000 },
    { city: 'Minneapolis', state: 'MN', zip: '55415', lat: 44.9778, lng: -93.2650, street: '350 S 5th St', type: 'duplex', price: 410000 },
    { city: 'Chicago', state: 'IL', zip: '60602', lat: 41.8781, lng: -87.6298, street: '121 N LaSalle St', type: 'apartment', price: 540000 },
    { city: 'St. Louis', state: 'MO', zip: '63101', lat: 38.6270, lng: -90.1994, street: '1200 Market St', type: 'house', price: 260000 },
    { city: 'Nashville', state: 'TN', zip: '37219', lat: 36.1627, lng: -86.7816, street: '1 Public Sq', type: 'house', price: 380000 },
    { city: 'Atlanta', state: 'GA', zip: '30303', lat: 33.7490, lng: -84.3880, street: '55 Trinity Ave SW', type: 'townhouse', price: 360000 },
    { city: 'Miami', state: 'FL', zip: '33128', lat: 25.7617, lng: -80.1918, street: '3500 Pan American Dr', type: 'condo', price: 480000 },
    { city: 'Orlando', state: 'FL', zip: '32801', lat: 28.5383, lng: -81.3792, street: '400 S Orange Ave', type: 'house', price: 330000 },
    { city: 'Charlotte', state: 'NC', zip: '28202', lat: 35.2271, lng: -80.8431, street: '600 E 4th St', type: 'house', price: 340000 },
    { city: 'Raleigh', state: 'NC', zip: '27601', lat: 35.7796, lng: -78.6382, street: '222 W Hargett St', type: 'house', price: 320000 },
    { city: 'Washington', state: 'DC', zip: '20001', lat: 38.9072, lng: -77.0369, street: '1350 Pennsylvania Ave NW', type: 'apartment', price: 600000 },
    { city: 'Baltimore', state: 'MD', zip: '21202', lat: 39.2904, lng: -76.6122, street: '100 N Holliday St', type: 'house', price: 220000 },
    { city: 'Philadelphia', state: 'PA', zip: '19107', lat: 39.9526, lng: -75.1652, street: '1400 John F Kennedy Blvd', type: 'townhouse', price: 370000 },
    { city: 'New York', state: 'NY', zip: '10007', lat: 40.7128, lng: -74.0060, street: '1 Centre St', type: 'apartment', price: 990000 },
    { city: 'Boston', state: 'MA', zip: '02201', lat: 42.3601, lng: -71.0589, street: '1 City Hall Sq', type: 'apartment', price: 680000 },
    { city: 'Pittsburgh', state: 'PA', zip: '15219', lat: 40.4406, lng: -79.9959, street: '414 Grant St', type: 'house', price: 240000 },
    { city: 'Cleveland', state: 'OH', zip: '44113', lat: 41.4993, lng: -81.6944, street: '601 Lakeside Ave E', type: 'duplex', price: 210000 },
    { city: 'Detroit', state: 'MI', zip: '48226', lat: 42.3314, lng: -83.0458, street: '2 Woodward Ave', type: 'house', price: 190000 },
  ];

  const allowedTypes = new Set(['house','apartment','condo','townhouse','duplex','triplex','fourplex','land','commercial']);

  const listings = entries.map((e, idx) => {
    const address = {
      streetName: e.street.replace(/^\d+\s+/, '').trim(),
      street: e.street,
      city: e.city,
      state: e.state,
      zipCode: e.zip,
      country: 'US',
    };
    const coordinates = { lat: e.lat, lng: e.lng };
    const type = allowedTypes.has(e.type) ? e.type : 'house';
    const title = `${type.charAt(0).toUpperCase() + type.slice(1)} in ${e.city}, ${e.state}`;
    const description = `Great opportunity in ${e.city}. Solid area, near amenities. Ideal for investors.`;
    const tags = [e.city.toLowerCase(), e.state.toLowerCase(), type];
    const conditions = ['good','fair','needs-cosmetic','excellent'];
    const property_condition = conditions[idx % conditions.length];
    return {
      created_by: createdBy,
      title,
      description,
      price: e.price,
      property_type: type,
      listing_type: (idx % 3 === 0 ? 'wholesale' : idx % 3 === 1 ? 'sale' : 'rent'),
      bedrooms: 2 + (idx % 4),
      bathrooms: 1 + ((idx % 3) * 0.5),
      square_feet: 900 + (idx * 50),
      lot_size: 0.1 + (idx % 5) * 0.05,
      year_built: 1950 + (idx % 60),
      arv: e.price ? Math.round(e.price * 1.15) : null,
      repair_costs: 5000 + (idx % 6) * 5000,
      wholesale_fee: 5000 + (idx % 4) * 2500,
      property_condition,
      occupancy_status: (idx % 2 === 0 ? 'vacant' : 'tenant-occupied'),
      monthly_rent: 1200 + (idx % 7) * 150,
      address,
      coordinates,
      features: ['garage', 'garden', 'basement'].slice(0, (idx % 3) + 1),
      amenities: ['parking', 'laundry', 'pet-friendly'].slice(0, (idx % 3) + 1),
      images: [],
      contact_info: { name: 'Seed User', email: SEED_USER_EMAIL, isOwner: true },
      deal_terms: {
        financingOptions: ['cash-only', 'hard-money', 'seller-financing'].slice(0, (idx % 3) + 1),
        earnestMoneyDeposit: 5000,
        proofOfFundsRequired: idx % 2 === 0,
      },
      comps: [],
      tags,
      status: 'active',
      is_verified: false,
      views: 0,
    };
  });
  return listings;
}

async function main() {
  console.log('Seeding listings...');
  const userId = await ensureSeedUser();
  console.log('Using seed user id:', userId);

  const rows = buildListings(userId);
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

  console.log('Done. Inserted', rows.length, 'listings.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


