import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { AutoRefresh } from "@/components/auto-refresh";

// Avoid Next.js caching the Supabase reads (session/profile, reports feed)
// across requests — this app's data changes constantly and must always be
// fresh, not served from a stale Data Cache snapshot.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "ReportL4D2",
  description:
    "Plataforma comunitaria para reportar jugadores tóxicos o trampistas en Left 4 Dead 2, autenticado vía Steam.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AutoRefresh intervalMs={15000} />
          <Navbar />
          <main className="container py-8">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
