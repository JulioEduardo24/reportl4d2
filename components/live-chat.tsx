"use client";
import * as React from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

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

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function LiveChat({ currentSteamId }: Props) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const supabase = React.useMemo(() => createClient(), []);

  React.useEffect(() => {
    supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => setMessages((data as Message[]) ?? []));

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  React.useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

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
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card">
      {/* Header */}
      <div className="border-b px-4 py-3 text-center">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Chat en vivo
        </h2>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex h-72 flex-col overflow-y-auto p-3 gap-0.5">
        {messages.length === 0 && (
          <p className="m-auto text-xs text-muted-foreground">
            No hay mensajes. ¡Sé el primero!
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/40 transition-colors">
            <span className="w-10 shrink-0 text-xs text-muted-foreground tabular-nums">
              {formatTime(msg.created_at)}
            </span>
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarImage src={msg.avatar_url ?? undefined} />
              <AvatarFallback className="text-[9px]">
                {msg.persona_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="min-w-0 text-sm">
              <span className="font-semibold">{msg.persona_name}</span>
              <span className="text-muted-foreground">: </span>
              <span className="break-words">{msg.content}</span>
            </p>
          </div>
        ))}
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
            className="flex-1 rounded-md bg-background px-3 py-2 text-sm outline-none ring-1 ring-border focus:ring-primary transition-all placeholder:text-muted-foreground"
          />
          <Button type="submit" size="sm" disabled={sending || !input.trim()}>
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Enviar
          </Button>
        </form>
      ) : (
        <p className="border-t p-3 text-center text-xs text-muted-foreground">
          Inicia sesión para chatear
        </p>
      )}
    </div>
  );
}
