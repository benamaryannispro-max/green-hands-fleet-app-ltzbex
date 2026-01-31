import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://tvmxmkvxheuorayuqofa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2bXhta3Z4aGV1b3JheXVxb2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjQwMzgsImV4cCI6MjA4NTQ0MDAzOH0.jh9OAY5dhflh5iAz3jqpTlQh3usiXx0VduVD-jjvce8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
