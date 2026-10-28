import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dltxqafbxnzgdxadbzwp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdHhxYWZieG56Z2R4YWRiendwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNzMwNzQsImV4cCI6MjEwODY0OTA3NH0.XhAANuJ9hk_xX5ZyR-O4U_4Q199mZsr9Yrq-SknFipc';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

