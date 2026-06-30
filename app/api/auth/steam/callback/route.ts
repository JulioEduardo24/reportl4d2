import { NextRequest, NextResponse } from "next/server";
import { verifySteamAssertion, getPlayerSummary, steamProfileUrl } from "@/lib/steam";
import { setSessionCookie } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const steamId = await verifySteamAssertion(request.nextUrl.searchParams);

  if (!steamId) {
    return NextResponse.redirect(new URL("/?auth_error=1", request.nextUrl.origin));
  }

  const summary = await getPlayerSummary(steamId);
  const supabase = createServiceClient();

  await supabase.from("profiles").upsert(
    {
      steam_id: steamId,
      persona_name: summary?.personaname ?? `Steam ${steamId.slice(-6)}`,
      avatar_url: summary?.avatarfull ?? null,
      profile_url: summary?.profileurl ?? steamProfileUrl(steamId),
      last_login_at: new Date().toISOString(),
    },
    { onConflict: "steam_id" }
  );

  setSessionCookie(steamId);
  return NextResponse.redirect(new URL("/", request.nextUrl.origin));
}
