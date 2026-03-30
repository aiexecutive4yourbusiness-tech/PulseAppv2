import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const configured   = !!(supabaseUrl && supabaseKey);

const supabase = configured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function dbLoad(key, defaultVal) {
  if (!supabase) return defaultVal;
  try {
    const { data, error } = await supabase
      .from("household_data")
      .select("value")
      .eq("key", key)
      .single();
    if (error || !data) return defaultVal;
    return data.value ?? defaultVal;
  } catch {
    return defaultVal;
  }
}

export async function dbSave(key, value) {
  if (!supabase) return;
  try {
    await supabase
      .from("household_data")
      .upsert({ key, value, updated_at: new Date().toISOString() });
  } catch {}
}

export function subscribeToKey(key, callback) {
  if (!supabase) {
    // Return a no-op subscription object
    return { unsubscribe: () => {} };
  }
  return supabase
    .channel(`household_data:${key}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "household_data", filter: `key=eq.${key}` },
      (payload) => {
        if (payload.new?.value !== undefined) callback(payload.new.value);
      }
    )
    .subscribe();
}
