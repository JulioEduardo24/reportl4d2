import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { categoryLabel } from "@/lib/categories";

export interface ReportRow {
  id: string;
  reported_steam_id: string;
  reported_profile_url: string;
  category: string;
  reason: string;
  status: string;
  created_at: string;
  reporter?: { persona_name: string; avatar_url: string | null } | null;
  reported_profile?: { persona_name: string; avatar_url: string | null } | null;
}

export function ReportCard({ report }: { report: ReportRow }) {
  return (
    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex gap-4 p-5">
        <Link href={`/players/${report.reported_steam_id}`} className="shrink-0">
          <Avatar className="h-14 w-14">
            <AvatarImage
              src={report.reported_profile?.avatar_url ?? undefined}
              alt={report.reported_profile?.persona_name ?? report.reported_steam_id}
            />
            <AvatarFallback>{report.reported_steam_id.slice(-2)}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/players/${report.reported_steam_id}`} className="font-semibold hover:underline">
              {report.reported_profile?.persona_name ?? `SteamID ${report.reported_steam_id}`}
            </Link>
            <Badge variant="secondary">{categoryLabel(report.category)}</Badge>
            {report.status !== "pending" && (
              <Badge variant={report.status === "dismissed" ? "outline" : "default"}>
                {report.status === "reviewed" ? "Revisado" : "Descartado"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{report.reason}</p>
          <p className="text-xs text-muted-foreground">
            Reportado por {report.reporter?.persona_name ?? "un usuario"} ·{" "}
            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: es })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
