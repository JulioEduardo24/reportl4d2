"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Home, Flag, ShieldCheck, Biohazard } from "lucide-react";
import { Sheet, SheetTrigger, SheetClose, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Reportes", icon: Home },
  { href: "/report", label: "Reportar jugador", icon: Flag },
];

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-2 border-b px-6 py-5">
            <Biohazard className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">ReportL4D2</span>
          </div>

          {/* Links */}
          <nav className="flex flex-col gap-1 p-4">
            {links.map(({ href, label, icon: Icon }) => (
              <SheetClose asChild key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === href && "bg-accent text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </SheetClose>
            ))}
            {isAdmin && (
              <SheetClose asChild>
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === "/admin" && "bg-accent text-accent-foreground"
                  )}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Moderación
                </Link>
              </SheetClose>
            )}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
