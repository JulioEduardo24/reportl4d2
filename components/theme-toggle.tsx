"use client";
import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label="Cambiar tema" />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Cambiar tema"
      className="relative overflow-hidden"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun
        className={cn(
          "absolute h-5 w-5 transition-all duration-300 ease-out",
          theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        )}
      />
      <Moon
        className={cn(
          "absolute h-5 w-5 transition-all duration-300 ease-out",
          theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        )}
      />
    </Button>
  );
}
