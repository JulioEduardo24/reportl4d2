import Link from "next/link";
import { Biohazard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSessionSteamId } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/user-menu";
import { MobileNav } from "@/components/mobile-nav";

export async function Navbar() {
  const steamId = getSessionSteamId();
  let profile: { steam_id: string; persona_name: string; avatar_url: string | null; is_admin: boolean } | null = null;

  if (steamId) {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("profiles")
      .select("steam_id, persona_name, avatar_url, is_admin")
      .eq("steam_id", steamId)
      .maybeSingle();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-2">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold text-lg">
          <Biohazard className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">ReportL4D2</span>
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost">
            <Link href="/">Reportes</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/report">Reportar jugador</Link>
          </Button>
          {profile?.is_admin && (
            <Button asChild variant="ghost">
              <Link href="/admin">Moderación</Link>
            </Button>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <MobileNav isAdmin={!!profile?.is_admin} />
          <ThemeToggle />
          {profile ? (
            <UserMenu personaName={profile.persona_name} avatarUrl={profile.avatar_url} />
          ) : (
            <Button asChild>
              <Link href="/api/auth/steam/login">Ingresar con Steam</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
