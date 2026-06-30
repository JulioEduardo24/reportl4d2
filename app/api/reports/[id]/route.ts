import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const body = await request.json();
  const status = body?.status;
  if (!["pending", "reviewed", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("reports").update({ status }).eq("id", params.id);
  if (error) return NextResponse.json({ error: "No se pudo actualizar." }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const supabase = createServiceClient();
  const { error } = await supabase.from("reports").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "No se pudo eliminar." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
