import Link from "next/link";
import { getSessionSteamId } from "@/lib/session";
import { ReportForm } from "@/components/report-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportPage() {
  const steamId = getSessionSteamId();

  if (!steamId) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Inicia sesión para reportar</CardTitle>
          <CardDescription>Necesitas iniciar sesión con tu cuenta de Steam antes de enviar un reporte.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/api/auth/steam/login">Ingresar con Steam</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <ReportForm />;
}
