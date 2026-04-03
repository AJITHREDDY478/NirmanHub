import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error('Missing Supabase environment variables');
}

const getSupabaseClient = () => {
  if (!isSupabaseConfigured) return null;

  // Reuse one browser client instance across HMR reloads to avoid auth-lock churn.
  if (typeof window !== 'undefined' && window.__nirmanahubSupabaseClient) {
    return window.__nirmanahubSupabaseClient;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Work around browser Navigator Lock aborts seen during GoTrue init.
      lock: async (_name, _acquireTimeout, fn) => await fn(),
    },
  });

  if (typeof window !== 'undefined') {
    window.__nirmanahubSupabaseClient = client;
  }

  return client;
};

export const supabase = getSupabaseClient();
