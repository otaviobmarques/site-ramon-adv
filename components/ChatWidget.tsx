"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

function renderText(text: string) {
  // Links clicáveis e quebras de linha, sem HTML arbitrário.
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return parts.map((p, i) =>
    /^https?:\/\//.test(p) ? (
      <a key={i} href={p} target="_blank" rel="noopener noreferrer">{p}</a>
    ) : (
      <span key={i}>{p.replace(/\*\*(.+?)\*\*/g, "$1")}</span>
    ),
  );
}

export default function ChatWidget({
  assistantName,
  welcomeMessage,
  whatsappUrl,
}: {
  assistantName: string;
  welcomeMessage: string;
  whatsappUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const t = (e.target as HTMLElement).closest("[data-open-chat]");
      if (t) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const history: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Não foi possível responder agora.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: acc }]);
      }
    } catch (err) {
      setMessages([...history, { role: "assistant", content: (err as Error).message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen((o) => !o)} aria-label="Abrir assistente virtual">
        {open ? "✕" : "💬"}
      </button>
      {open && (
        <div className="chat-panel" role="dialog" aria-label={assistantName}>
          <div className="chat-head">
            <div>
              <strong>{assistantName}</strong>
              <span>Respostas geradas por IA</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fechar">✕</button>
          </div>
          <div className="chat-list" ref={listRef}>
            <div className="msg assistant">{welcomeMessage}</div>
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                {m.content ? renderText(m.content) : <span className="typing"><i /><i /><i /></span>}
              </div>
            ))}
          </div>
          <form className="chat-form" onSubmit={send}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua dúvida…"
              maxLength={2000}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>Enviar</button>
          </form>
          <a className="chat-wa" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            Prefere falar com uma pessoa? Chame no WhatsApp
          </a>
        </div>
      )}
    </>
  );
}
