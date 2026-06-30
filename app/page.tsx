export const dynamic = "force-dynamic";

import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { ReportCard, type ReportRow } from "@/components/report-card";
import { SearchFilterBar } from "@/components/search-filter-bar";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 10;

export default async function HomePage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; page?: string };
}) {
  const supabase = createServiceClient();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("reports")
    .select("*, reporter:profiles!reports_reporter_steam_id_fkey(persona_name, avatar_url)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (searchParams.q) {
    query = query.ilike("reported_steam_id", `%${searchParams.q.trim()}%`);
  }
  if (searchParams.category) {
    query = query.eq("category", searchParams.category);
  }

  const { data: reports, count } = await query;
  const rows = (reports ?? []) as unknown as ReportRow[];

  // Reported players aren't required to have an account, so fetch any known
  // profiles for the SteamIDs on this page in a second pass and merge them.
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
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Reportes recientes</h1>
        <p className="text-muted-foreground">
          Jugadores reportaos recientemente por la comunidad.
        </p>
      </div>

      <SearchFilterBar />

      {enriched.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No hay reportes que coincidan con tu búsqueda.</p>
      ) : (
        <div className="space-y-3">
          {enriched.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button asChild variant="outline" disabled={page <= 1}>
            <Link href={`/?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`}>
              Anterior
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button asChild variant="outline" disabled={page >= totalPages}>
            <Link href={`/?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`}>
              Siguiente
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
