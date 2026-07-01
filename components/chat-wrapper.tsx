import { getSessionSteamId } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/server";
import { LiveChat } from "@/components/live-chat";

export async function ChatWrapper() {
  const steamId = getSessionSteamId();
  let personaName: string | null = null;
  let avatarUrl: string | null = null;

  if (steamId) {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("profiles")
      .select("persona_name, avatar_url")
      .eq("steam_id", steamId)
      .maybeSingle();
    personaName = data?.persona_name ?? null;
    avatarUrl = data?.avatar_url ?? null;
  }

  return (
    <LiveChat
      currentSteamId={steamId}
      currentPersonaName={personaName}
      currentAvatarUrl={avatarUrl}
    />
  );
}
