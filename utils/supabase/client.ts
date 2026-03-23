import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Singleton Supabase client to avoid multiple instances
// Use globalThis to persist across HMR in development
const GLOBAL_KEY = Symbol.for(`__supabase_client_${projectId}__`);

function getOrCreateClient() {
  // Check if client already exists globally (survives HMR)
  if ((globalThis as any)[GLOBAL_KEY]) {
    console.log('♻️  Reusing existing Supabase client (singleton)');
    return (globalThis as any)[GLOBAL_KEY];
  }

  console.log('🔧 Initializing new Supabase client (singleton)...');
  const client = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: `sb-${projectId}-auth-token`, // Unique storage key per project
      },
    }
  );
  
  // Store globally to survive HMR
  (globalThis as any)[GLOBAL_KEY] = client;
  console.log('✅ Supabase client initialized');
  
  return client;
}

export function getSupabaseClient() {
  return getOrCreateClient();
}

// Export the singleton instance
export const supabase = getSupabaseClient();