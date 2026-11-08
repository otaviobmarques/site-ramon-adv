import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, createClient, fallbackParams } from "@/lib/claude";
import { getApiKey, getSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_MESSAGES = 20;
const MAX_CHARS = 2000;
const RATE_LIMIT = 20; // mensagens por IP a cada 10 minutos (por instância)
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > RATE_LIMIT;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

function sanitize(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input)) return null;
  const msgs = input
    .filter(
      (m): m is ChatMessage =>
        m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim() !== "",
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
    .slice(-MAX_MESSAGES);
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  return msgs;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) {
    return Response.json({ error: "Muitas mensagens em pouco tempo. Tente novamente em alguns minutos." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const messages = sanitize(body?.messages);
  if (!messages) return Response.json({ error: "Mensagem inválida." }, { status: 400 });

  const settings = await getSettings();
  const { key } = getApiKey(settings);
  if (!settings.chatEnabled || !key) {
    return Response.json({ error: "O assistente está indisponível no momento." }, { status: 503 });
  }

  const client = createClient(key);
  const stream = client.beta.messages.stream({
    model: settings.model,
    max_tokens: 4096,
    system: buildSystemPrompt(settings),
    output_config: { effort: settings.effort },
    messages,
    ...fallbackParams(settings.model),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(
            encoder.encode("\n\nNão consigo ajudar com esse pedido por aqui. Fale com o escritório pelo WhatsApp."),
          );
        }
      } catch (err) {
        if (err instanceof Anthropic.AuthenticationError) {
          console.error("Chave de IA inválida:", err.message);
        } else if (err instanceof Anthropic.RateLimitError) {
          console.error("Limite da API de IA atingido:", err.message);
        } else {
          console.error("Erro no chat:", err);
        }
        controller.enqueue(
          encoder.encode("\n\nDesculpe, tive um problema para responder agora. Tente novamente ou fale conosco pelo WhatsApp."),
        );
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
