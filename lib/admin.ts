import { getSessionSteamId } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
  const steamId = getSessionSteamId();
  if (!steamId) return null;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("profiles")
    .select("steam_id, persona_name, avatar_url, is_admin")
    .eq("steam_id", steamId)
    .maybeSingle();

  return data;
}

export async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile?.is_admin) return null;
  return profile;
}
