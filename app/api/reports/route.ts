import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionSteamId } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveSteamId } from "@/lib/parse-steam-id";
import { getPlayerSummary, steamProfileUrl } from "@/lib/steam";

const REPORT_CATEGORIES = ["cheating","troll", "other"] as const;

const reportSchema = z.object({
  steamInput: z.string().min(3, "Ingresa el SteamID o el link de Steam del jugador."),
  profileUrl: z.string().url().optional().or(z.literal("")),
  category: z.enum(REPORT_CATEGORIES),
  reason: z.string().min(10, "Describe el motivo con al menos 10 caracteres.").max(2000),
});

export async function POST(request: NextRequest) {
  const reporterSteamId = getSessionSteamId();
  if (!reporterSteamId) {
    return NextResponse.json({ error: "Debes iniciar sesión con Steam para reportar." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos." }, { status: 400 });
  }

  const { steamInput, profileUrl, category, reason } = parsed.data;
  const reportedSteamId = await resolveSteamId(steamInput);
  if (!reportedSteamId) {
    return NextResponse.json(
      { error: "No se pudo identificar el SteamID. Usa el ID de 17 dígitos o el link completo del perfil." },
      { status: 400 }
    );
  }

  if (reportedSteamId === reporterSteamId) {
    return NextResponse.json({ error: "No puedes reportarte a ti mismo." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("reports").insert({
    reported_steam_id: reportedSteamId,
    reported_profile_url: profileUrl || steamProfileUrl(reportedSteamId),
    category,
    reason,
    reporter_steam_id: reporterSteamId,
  });

  if (error) {
    console.log("Error al guardar el reporte:", error);
    return NextResponse.json({ error: "No se pudo guardar el reporte. Intenta de nuevo." }, { status: 500 });
  }

  // The reported player likely never logged into this app, so they have no
  // row in `profiles` and would show only initials. Fetch their public Steam
  // profile (name + avatar) via the Web API and store a "shadow" profile so
  // their photo shows up on the feed and player page without requiring login.
  // This never overwrites is_admin/created_at/last_login_at for real accounts.
  try {
    const summary = await getPlayerSummary(reportedSteamId);
    if (summary) {
      await supabase.from("profiles").upsert(
        {
          steam_id: reportedSteamId,
          persona_name: summary.personaname,
          avatar_url: summary.avatarfull,
          profile_url: summary.profileurl,
        },
        { onConflict: "steam_id" }
      );
    }
  } catch (e) {
    console.log("No se pudo refrescar el perfil de Steam del reportado:", e);
  }

  revalidatePath("/");
  revalidatePath(`/players/${reportedSteamId}`);

  return NextResponse.json({ ok: true, reportedSteamId });
}
