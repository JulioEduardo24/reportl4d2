import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export async function GET(request: NextRequest) {
  clearSessionCookie();
  return NextResponse.redirect(new URL("/", request.nextUrl.origin));
}
