import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function dbLoad(key, defaultVal) {
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
  try {
    await supabase
      .from("household_data")
      .upsert({ key, value, updated_at: new Date().toISOString() });
  } catch {}
}

export function subscribeToKey(key, callback) {
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
