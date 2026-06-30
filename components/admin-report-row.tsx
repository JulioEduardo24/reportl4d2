"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { categoryLabel } from "@/lib/categories";
import type { ReportRow } from "@/components/report-card";

export function AdminReportRow({ report }: { report: ReportRow }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const isResolved = report.status === "reviewed" || report.status === "dismissed";

  async function setStatus(status: string) {
    setLoading(true);
    await fetch(`/api/reports/${report.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setLoading(false);
    router.refresh();
  }

  async function remove() {
    setLoading(true);
    await fetch(`/api/reports/${report.id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-2 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/players/${report.reported_steam_id}`} className="font-semibold hover:underline">
            {report.reported_profile?.persona_name ?? `SteamID ${report.reported_steam_id}`}
          </Link>
          <Badge variant="secondary">{categoryLabel(report.category)}</Badge>
          <Badge variant={report.status === "dismissed" ? "outline" : report.status === "reviewed" ? "default" : "secondary"}>
            {report.status === "reviewed" ? "Revisado" : report.status === "dismissed" ? "Descartado" : "Pendiente"}
          </Badge>
        </div>
        <p className="text-sm">{report.reason}</p>
        <p className="text-xs text-muted-foreground">Reportado por {report.reporter?.persona_name ?? "un usuario"}</p>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" variant="outline" disabled={loading || isResolved} onClick={() => setStatus("reviewed")}>
            Marcar revisado
          </Button>
          <Button size="sm" variant="outline" disabled={loading || isResolved} onClick={() => setStatus("dismissed")}>
            Descartar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" disabled={loading}>
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar este reporte?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={remove}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
