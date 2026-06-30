import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { createServiceClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { categoryLabel } from "@/lib/categories";
import { steamProfileUrl } from "@/lib/steam";

type ReportRowWithReporter = {
  id: string;
  category: string;
  status: string;
  reason: string;
  created_at: string;
  reporter_steam_id: string;
  reporter?: { persona_name: string; avatar_url: string | null } | null;
};

export default async function PlayerPage({ params }: { params: { steamId: string } }) {
  if (!/^\d{17}$/.test(params.steamId)) notFound();

  const supabase = createServiceClient();

  const [{ data: profile }, { data: reports }] = await Promise.all([
    supabase.from("profiles").select("*").eq("steam_id", params.steamId).maybeSingle(),
    supabase
      .from("reports")
      .select("*, reporter:profiles!reports_reporter_steam_id_fkey(persona_name, avatar_url)")
      .eq("reported_steam_id", params.steamId)
      .order("created_at", { ascending: false }),
  ]);

  const reportRows = (reports ?? []) as ReportRowWithReporter[];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.persona_name ?? params.steamId} />
              <AvatarFallback>{params.steamId.slice(-2)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="break-words text-xl font-bold sm:text-2xl">
                {profile?.persona_name ?? `SteamID ${params.steamId}`}
              </h1>
              <p className="break-all text-sm text-muted-foreground">SteamID64: {params.steamId}</p>
            </div>
          </div>
          <div className="flex flex-row items-center gap-2 sm:flex-1 sm:flex-col sm:items-end">
            <Badge variant={reportRows.length > 3 ? "destructive" : "secondary"}>
              {reportRows.length} reporte{reportRows.length === 1 ? "" : "s"}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <a href={profile?.profile_url ?? steamProfileUrl(params.steamId)} target="_blank" rel="noreferrer">
                Ver perfil de Steam <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Historial de reportes</h2>
        {reportRows.length === 0 ? (
          <p className="text-muted-foreground">Este jugador no tiene reportes registrados.</p>
        ) : (
          reportRows.map((report) => (
            <Card key={report.id}>
              <CardContent className="space-y-1 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{categoryLabel(report.category)}</Badge>
                  {report.status !== "pending" && (
                    <Badge variant={report.status === "dismissed" ? "outline" : "default"}>
                      {report.status === "reviewed" ? "Revisado" : "Descartado"}
                    </Badge>
                  )}
                </div>
                <p className="text-sm">{report.reason}</p>
                <p className="text-xs text-muted-foreground">
                  Reportado por{" "}
                  <Link href={`/players/${report.reporter_steam_id}`} className="hover:underline">
                    {report.reporter?.persona_name ?? "un usuario"}
                  </Link>{" "}
                  · {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: es })}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
