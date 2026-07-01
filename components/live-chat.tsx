"use client";
import * as React from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  steam_id: string;
  persona_name: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
}

interface Props {
  currentSteamId: string | null;
  currentPersonaName: string | null;
  currentAvatarUrl: string | null;
}

export function LiveChat({ currentSteamId, currentPersonaName, currentAvatarUrl }: Props) {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const supabase = React.useMemo(() => createClient(), []);

  // Cargar mensajes iniciales y suscribirse a nuevos
  React.useEffect(() => {
    supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => setMessages((data as Message[]) ?? []));

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // Scroll al último mensaje cuando se abre o llegan mensajes nuevos
  React.useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    await fetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({ content: input.trim() }),
    });
    setInput("");
    setSending(false);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Panel del chat */}
      {open && (
        <div className="flex h-[420px] w-80 flex-col overflow-hidden rounded-xl border bg-background shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Chat en vivo</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-xs text-muted-foreground pt-4">
                No hay mensajes aún. ¡Sé el primero!
              </p>
            )}
            {messages.map((msg) => {
              const isMe = msg.steam_id === currentSteamId;
              return (
                <div key={msg.id} className={cn("flex gap-2", isMe && "flex-row-reverse")}>
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={msg.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {msg.persona_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("flex flex-col gap-0.5 max-w-[200px]", isMe && "items-end")}>
                    <span className="text-xs text-muted-foreground">{msg.persona_name}</span>
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-1.5 text-sm break-words",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted rounded-tl-sm"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {currentSteamId ? (
            <form onSubmit={sendMessage} className="flex gap-2 border-t p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe un mensaje..."
                maxLength={300}
                className="flex-1 rounded-lg bg-muted px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" size="icon" disabled={sending || !input.trim()} className="h-8 w-8 shrink-0">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          ) : (
            <p className="border-t p-3 text-center text-xs text-muted-foreground">
              Inicia sesión para chatear
            </p>
          )}
        </div>
      )}

      {/* Botón flotante */}
      <Button
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    </div>
  );
}
