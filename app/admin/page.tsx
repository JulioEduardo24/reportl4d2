import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminReportRow } from "@/components/admin-report-row";
import type { ReportRow } from "@/components/report-card";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const supabase = createServiceClient();
  let query = supabase
    .from("reports")
    .select("*, reporter:profiles!reports_reporter_steam_id_fkey(persona_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  const { data: reports } = await query;
  const rows = (reports ?? []) as unknown as ReportRow[];

  const reportedIds = Array.from(new Set(rows.map((r) => r.reported_steam_id)));
  let profilesById: Record<string, { persona_name: string; avatar_url: string | null }> = {};
  if (reportedIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("steam_id, persona_name, avatar_url")
      .in("steam_id", reportedIds);
    profilesById = Object.fromEntries((profiles ?? []).map((p: { steam_id: string }) => [p.steam_id, p]));
  }

  const enriched = rows.map((r) => ({ ...r, reported_profile: profilesById[r.reported_steam_id] ?? null }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de moderación</h1>
        <p className="text-muted-foreground">Revisa, valida o elimina reportes falsos o spam.</p>
      </div>

      {enriched.length === 0 ? (
        <p className="text-muted-foreground">No hay reportes.</p>
      ) : (
        <div className="space-y-3">
          {enriched.map((report) => (
            <AdminReportRow key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
