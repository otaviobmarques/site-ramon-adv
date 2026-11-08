import { analisarCaso } from "@/lib/atendimento";
import { isAdmin } from "@/lib/auth";
import { lerCaso, salvarCaso } from "@/lib/cases";
import { erro } from "@/lib/http";
import { getApiKey, getSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return erro("Não autorizado.", 401);
  const caso = await lerCaso((await params).id);
  if (!caso) return erro("Caso não encontrado.", 404);
  const s = await getSettings();
  const { key } = getApiKey(s);
  if (!key) return erro("Cadastre a chave de IA nas configurações.", 400);
  try {
    caso.analiseIA = { texto: await analisarCaso(caso, s, key), geradaEm: new Date().toISOString() };
  } catch (err) {
    console.error(err);
    return erro((err as Error).message || "Falha na análise.", 502);
  }
  await salvarCaso(caso);
  return Response.json({ analiseIA: caso.analiseIA });
}
