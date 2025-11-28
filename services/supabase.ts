import { createClient } from '@supabase/supabase-js';

// Using the credentials you provided. 
// In a production environment, these should be in a .env file (VITE_SUPABASE_URL, etc.)
// but we include them here as fallbacks to ensure immediate functionality.

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://fvmbbqmhzqbfrhmjwnaf.supabase.co';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bWJicW1oenFiZnJobWp3bmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjU5ODAsImV4cCI6MjA3OTkwMTk4MH0.THUQ6g6YdkzksNhpomjb6EpSPJSvscSl3y5a-65JMTA';

export const supabase = createClient(supabaseUrl, supabaseKey);