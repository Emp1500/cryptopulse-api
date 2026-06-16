// Load .env, swap to test Supabase project, blank DATABASE_URL so app uses in-memory sessions
require('dotenv').config();
process.env.SUPABASE_URL = process.env.TEST_SUPABASE_URL;
process.env.SUPABASE_SERVICE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY;
// Set to empty string (falsy) so dotenv can't re-inject the prod value,
// and the conditional in app.js skips the pg session store
process.env.DATABASE_URL = '';
