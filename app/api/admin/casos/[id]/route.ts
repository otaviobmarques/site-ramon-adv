import crypto from "node:crypto";
import { isAdmin } from "@/lib/auth";
import { aplicarCampos, excluirCaso, lerCaso, salvarCaso, type Caso, type Notificacao } from "@/lib/cases";
import { CAMPOS, STATUS, type CampoKey } from "@/lib/dossie";
import { erro } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function semSegredos(c: Caso) {
  const { tokenHash: _t, apiMessages: _a, ...resto } = c;
  return resto;
}

export async function GET(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return erro("Não autorizado.", 401);
  const caso = await lerCaso((await params).id);
  return caso ? Response.json({ caso: semSegredos(caso) }) : erro("Caso não encontrado.", 404);
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return erro("Não autorizado.", 401);
  const caso = await lerCaso((await params).id);
  if (!caso) return erro("Caso não encontrado.", 404);
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (typeof b.status === "string" && STATUS.some((s) => s.id === b.status)) caso.status = b.status as Caso["status"];
  if (b.temperatura === "quente" || b.temperatura === "morno" || b.temperatura === "frio") caso.temperatura = b.temperatura;
  if (typeof b.motivoPerda === "string") caso.motivoPerda = b.motivoPerda.slice(0, 1000);
  if (typeof b.notas === "string") caso.notas = b.notas.slice(0, 20000);
  if (b.dossie && typeof b.dossie === "object") aplicarCampos(caso, b.dossie as Record<string, unknown>, CAMPOS.map((c) => c.key) as CampoKey[]);
  if (b.followups && typeof b.followups === "object") {
    for (const [k, v] of Object.entries(b.followups as Record<string, unknown>)) {
      if (["d3", "d10", "d30"].includes(k)) {
        if (typeof v === "string" && v) caso.followups[k] = v;
        else delete caso.followups[k];
      }
    }
  }
  if (b.viabilidade && typeof b.viabilidade === "object") {
    for (const [k, v] of Object.entries(b.viabilidade as Record<string, unknown>)) {
      if (typeof v === "boolean" && k.length < 80) caso.viabilidade[k] = v;
    }
  }
  if (b.honorarios && typeof b.honorarios === "object") {
    const h = b.honorarios as Record<string, unknown>;
    const base = Number(h.base), perc = Number(h.percInicial), parc = Number(h.parcelas);
    if (base >= 0 && perc >= 2 && perc <= 5 && parc >= 1 && parc <= 24) caso.honorarios = { base, percInicial: perc, parcelas: Math.round(parc) };
  }
  if (b.novaNotificacao && typeof b.novaNotificacao === "object") {
    const n = b.novaNotificacao as Partial<Notificacao>;
    if (n.banco && n.enviadaEm && (n.tipo === "pagador" || n.tipo === "recebedor")) {
      caso.notificacoes.push({
        id: crypto.randomBytes(4).toString("hex"),
        banco: String(n.banco).slice(0, 100),
        tipo: n.tipo,
        canal: n.canal === "BACEN" || n.canal === "outro" ? n.canal : "consumidor.gov.br",
        enviadaEm: String(n.enviadaEm).slice(0, 10),
      });
    }
  }
  if (b.atualizarNotificacao && typeof b.atualizarNotificacao === "object") {
    const n = b.atualizarNotificacao as Partial<Notificacao>;
    const alvo = caso.notificacoes.find((x) => x.id === n.id);
    if (alvo) {
      if (typeof n.resposta === "string") alvo.resposta = n.resposta.slice(0, 2000);
      if (typeof n.proximoPasso === "string") alvo.proximoPasso = n.proximoPasso.slice(0, 1000);
    }
  }
  if (typeof b.removerNotificacao === "string") caso.notificacoes = caso.notificacoes.filter((x) => x.id !== b.removerNotificacao);

  await salvarCaso(caso);
  return Response.json({ caso: semSegredos(caso) });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return erro("Não autorizado.", 401);
  await excluirCaso((await params).id);
  return Response.json({ ok: true });
}
