import { NextRequest, NextResponse } from "next/server";
import { getSteamLoginUrl } from "@/lib/steam";

export async function GET(request: NextRequest) {
  const returnTo = new URL("/api/auth/steam/callback", request.nextUrl.origin).toString();
  return NextResponse.redirect(getSteamLoginUrl(returnTo));
}
