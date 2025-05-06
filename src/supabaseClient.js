import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://agcdvmswtvfzlnkuvhld.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnY2R2bXN3dHZmemxua3V2aGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0MzAzMDYsImV4cCI6MjA2MjAwNjMwNn0.10-DtRAmY-epRyGPg5QZhGboBosnozPoBT3QQ14gePg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});
