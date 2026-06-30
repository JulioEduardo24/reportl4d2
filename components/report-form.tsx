"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { REPORT_CATEGORIES } from "@/lib/categories";

const formSchema = z.object({
  steamInput: z.string().min(3, "Ingresa el SteamID o el link de Steam del jugador."),
  profileUrl: z.string().optional(),
  category: z.string().min(1, "Selecciona una categoría."),
  reason: z.string().min(10, "Describe el motivo con al menos 10 caracteres.").max(2000),
});

type FormValues = z.infer<typeof formSchema>;

export function ReportForm() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { category: "cheating" },
  });

  const steamInput = watch("steamInput");

  React.useEffect(() => {
    const val = steamInput?.trim() ?? "";
    if (/^\d{17}$/.test(val)) {
      setValue("profileUrl", `https://steamcommunity.com/profiles/${val}`);
    } else if (/^https?:\/\/(www\.)?steamcommunity\.com\/(id|profiles)\/\S+/.test(val)) {
      setValue("profileUrl", val);
    } else {
      setValue("profileUrl", "");
    }
  }, [steamInput, setValue]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", { method: "POST", body: JSON.stringify(values) });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Ocurrió un error.");
        return;
      }
      router.refresh();
      router.push(`/players/${data.reportedSteamId}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Reportar jugador</CardTitle>
        <CardDescription>
          El reporte queda asociado a tu cuenta de Steam.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="steamInput">SteamID o link de Steam *</Label>
            <Input
              id="steamInput"
              placeholder="76561198000000000 o https://steamcommunity.com/id/jugador"
              {...register("steamInput")}
            />
            {errors.steamInput && <p className="text-sm text-destructive">{errors.steamInput.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profileUrl">Link de Steam (autogenerado, opcional)</Label>
            <Input id="profileUrl" placeholder="Se completa automáticamente" readOnly {...register("profileUrl")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Razón del reporte *</Label>
            <Select defaultValue="cheating" onValueChange={(v) => setValue("category", v)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Detalles *</Label>
            <Textarea id="reason" placeholder="Describe qué ocurrió, cuándo y en qué servidor/partida." {...register("reason")} />
            {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Enviando..." : "Enviar reporte"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
