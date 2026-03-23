# Multiple GoTrueClient Instances - Fix Documentation

## The Warning
```
GoTrueClient@sb-riiuxzytghcyzgkfpsam-auth-token:1 (2.90.1) 2026-01-11T11:14:53.747Z 
Multiple GoTrueClient instances detected in the same browser context. 
It is not an error, but this should be avoided as it may produce undefined behavior 
when used concurrently under the same storage key.
```

## Root Cause

Multiple Supabase clients were being created instead of using a single singleton instance:

### Before (Problematic)
```typescript
// students-direct.service.ts - Creating NEW client ❌
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(...);

// validation.service.ts - Using shared client ✅
import { supabase } from '/utils/supabase/client';

// marks.service.ts - Using shared client ✅
import { supabase } from '/utils/supabase/client';
```

**Problem**: Each `createClient()` call creates a new GoTrueClient (auth client), causing conflicts with localStorage keys and potential race conditions.

## The Fix

### 1. Single Shared Client (`/utils/supabase/client.ts`)
Created a robust singleton pattern that:
- ✅ Only creates ONE Supabase client instance
- ✅ Survives Hot Module Replacement (HMR) in development
- ✅ Uses unique storage keys per project
- ✅ Properly configures auth settings

```typescript
// Singleton that survives HMR
const GLOBAL_KEY = Symbol.for(`__supabase_client_${projectId}__`);

function getOrCreateClient() {
  // Reuse existing client (survives HMR)
  if ((globalThis as any)[GLOBAL_KEY]) {
    return (globalThis as any)[GLOBAL_KEY];
  }

  // Create new client with proper auth config
  const client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: `sb-${projectId}-auth-token`, // Unique key
    },
  });
  
  // Store globally to prevent duplicates
  (globalThis as any)[GLOBAL_KEY] = client;
  return client;
}

export const supabase = getOrCreateClient();
```

### 2. Updated All Services
Changed `students-direct.service.ts` from creating its own client to using the shared singleton:

```typescript
// Before ❌
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(...);

// After ✅
import { supabase } from '/utils/supabase/client';
```

### 3. Verification
All services now use the shared client:
- ✅ `students-direct.service.ts` - Fixed
- ✅ `validation.service.ts` - Already using shared client
- ✅ `marks.service.ts` - Already using shared client
- ✅ `exams.service.ts` - Already using shared client
- ✅ `subjects.service.ts` - Already using shared client
- ✅ `database-sync.service.ts` - Already using shared client
- ✅ `database-setup.service.ts` - Already using shared client
- ✅ `database-checker.service.ts` - Already using shared client

## Benefits

### Before
```
🔴 Multiple GoTrueClient instances
🔴 Potential auth conflicts
🔴 Wasted memory
🔴 Race conditions in auth state
```

### After
```
✅ Single GoTrueClient instance
✅ No auth conflicts
✅ Efficient memory usage
✅ Consistent auth state across app
```

## How It Works

### On Initial Load:
```
1. App imports services
2. Services import `/utils/supabase/client`
3. Singleton checks globalThis
4. No client exists → Create new one
5. Store in globalThis[Symbol]
6. All services get SAME instance ✅
```

### On Hot Module Reload (HMR):
```
1. Code reloads during development
2. Services re-import `/utils/supabase/client`
3. Singleton checks globalThis
4. Client ALREADY exists → Reuse it ✅
5. No new instance created
6. Warning avoided ✅
```

## Testing

### Console Output (Expected)
On first load:
```
🔧 Initializing new Supabase client (singleton)...
✅ Supabase client initialized
```

On subsequent HMR:
```
♻️  Reusing existing Supabase client (singleton)
```

### No More Warnings ✅
The multiple GoTrueClient warning should no longer appear in the console.

## Key Principles

1. **Singleton Pattern**: Only one instance of Supabase client exists
2. **Global Persistence**: Uses `globalThis` with Symbol key to survive HMR
3. **Unique Storage Key**: Each project gets its own auth storage key
4. **Import Once, Use Everywhere**: All services import the same instance

## Summary

✅ **Fixed**: Multiple client instances
✅ **Fixed**: GoTrueClient warning
✅ **Improved**: Memory efficiency
✅ **Improved**: Auth state consistency
✅ **Improved**: HMR stability

The app now has a single, robust Supabase client that all services share, eliminating the warning and potential auth conflicts.
