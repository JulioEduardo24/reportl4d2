import { NextRequest, NextResponse } from "next/server";
import { getSessionSteamId } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const steamId = getSessionSteamId();
  if (!steamId) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const body = await request.json();
  const content = (body?.content ?? "").trim();
  if (!content || content.length > 300) {
    return NextResponse.json({ error: "Mensaje inválido." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("persona_name, avatar_url")
    .eq("steam_id", steamId)
    .maybeSingle();

  const { error } = await supabase.from("messages").insert({
    steam_id: steamId,
    persona_name: profile?.persona_name ?? steamId,
    avatar_url: profile?.avatar_url ?? null,
    content,
  });

  if (error) return NextResponse.json({ error: "No se pudo enviar." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
