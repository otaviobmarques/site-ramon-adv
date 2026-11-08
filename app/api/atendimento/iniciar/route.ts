import { criarCaso } from "@/lib/cases";
import { estadoCliente } from "@/lib/estado";
import { clientIp, erro, limitado } from "@/lib/http";
import { getApiKey, getSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (limitado(`novo:${ip}`, 5, 60 * 60 * 1000)) return erro("Muitos atendimentos iniciados. Tente mais tarde.", 429);
  const body = (await req.json().catch(() => ({}))) as { consentimento?: boolean; origem?: string };
  if (body.consentimento !== true) return erro("É preciso aceitar a política de privacidade para continuar.", 400);
  const s = await getSettings();
  if (!s.chatEnabled || !getApiKey(s).key) return erro("O atendimento on-line está indisponível no momento.", 503);
  const { caso, token } = await criarCaso(String(body.origem ?? "site"), ip, s.welcomeMessage);
  return Response.json({ token, estado: estadoCliente(caso) });
}
