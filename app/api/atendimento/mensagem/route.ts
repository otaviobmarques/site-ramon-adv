import Anthropic from "@anthropic-ai/sdk";
import { notificarNovoLead, turno } from "@/lib/atendimento";
import { lerCasoCliente, salvarCaso } from "@/lib/cases";
import { estadoCliente } from "@/lib/estado";
import { baseUrl, clientIp, erro, limitado } from "@/lib/http";
import { getApiKey, getSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const { id, token, texto } = (await req.json().catch(() => ({}))) as { id?: string; token?: string; texto?: string };
  const msg = typeof texto === "string" ? texto.trim().slice(0, 4000) : "";
  if (!msg) return erro("Mensagem vazia.", 400);
  if (limitado(`msg:${clientIp(req)}`, 60, 10 * 60 * 1000)) return erro("Muitas mensagens em pouco tempo. Aguarde um pouco.", 429);

  const caso = id && token ? await lerCasoCliente(id, token) : null;
  if (!caso) return erro("Atendimento não encontrado. Recarregue a página.", 404);
  if (caso.conversa.length > 300) return erro("Este atendimento atingiu o limite de mensagens. O escritório já recebeu suas informações e vai entrar em contato.", 429);

  const s = await getSettings();
  const { key } = getApiKey(s);
  if (!s.chatEnabled || !key) return erro("O atendimento on-line está indisponível no momento.", 503);

  try {
    await turno(caso, s, key, msg);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) console.error("Chave de IA inválida");
    else console.error("Erro no atendimento:", err);
    return erro("Tive um problema para responder agora. Tente de novo em instantes.", 502);
  }
  await notificarNovoLead(caso, s, baseUrl(req));
  await salvarCaso(caso);
  return Response.json({ estado: estadoCliente(caso) });
}
