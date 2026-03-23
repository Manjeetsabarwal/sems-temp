/**
 * Browser-compatible KV Store
 * Wrapper around the kv_store_2fbe5237 table for client-side usage
 */

import { supabase } from '/utils/supabase/client';

const TABLE_NAME = 'kv_store_2fbe5237';

// Set stores a key-value pair in the database
export const set = async (key: string, value: any): Promise<void> => {
  const { error } = await supabase.from(TABLE_NAME).upsert({
    key,
    value
  });
  if (error) {
    throw new Error(error.message);
  }
};

// Get retrieves a key-value pair from the database
export const get = async (key: string): Promise<any> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('value')
    .eq('key', key)
    .maybeSingle();
  
  if (error) {
    throw new Error(error.message);
  }
  return data?.value;
};

// Delete deletes a key-value pair from the database
export const del = async (key: string): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('key', key);
  
  if (error) {
    throw new Error(error.message);
  }
};

// Sets multiple key-value pairs in the database
export const mset = async (keys: string[], values: any[]): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(keys.map((k, i) => ({ key: k, value: values[i] })));
  
  if (error) {
    throw new Error(error.message);
  }
};

// Gets multiple key-value pairs from the database
export const mget = async (keys: string[]): Promise<any[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('value')
    .in('key', keys);
  
  if (error) {
    throw new Error(error.message);
  }
  return data?.map((d) => d.value) ?? [];
};

// Deletes multiple key-value pairs from the database
export const mdel = async (keys: string[]): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .in('key', keys);
  
  if (error) {
    throw new Error(error.message);
  }
};

// Search for key-value pairs by prefix
export const getByPrefix = async (prefix: string): Promise<Array<{ key: string; value: any }>> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('key, value')
    .like('key', `${prefix}%`);
  
  if (error) {
    throw new Error(error.message);
  }
  return data?.map((d) => ({ key: d.key, value: d.value })) ?? [];
};
