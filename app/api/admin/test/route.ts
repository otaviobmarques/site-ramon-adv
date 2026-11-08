import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/claude";
import { getApiKey, getSettings, MODELS } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Testa uma chave nova (se enviada) ou a chave salva, sem gastar tokens de geração. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { apiKey?: string; model?: string };
  const settings = await getSettings();
  const key = body.apiKey?.trim() || getApiKey(settings).key;
  if (!key) return NextResponse.json({ ok: false, error: "Nenhuma chave cadastrada." }, { status: 400 });
  const model = MODELS.some((m) => m.id === body.model) ? body.model! : settings.model;

  try {
    const info = await createClient(key).models.retrieve(model);
    return NextResponse.json({ ok: true, message: `Conexão OK — modelo ${info.display_name} disponível.` });
  } catch (err) {
    let error = "Falha ao conectar com a API.";
    if (err instanceof Anthropic.AuthenticationError) error = "Chave inválida ou revogada.";
    else if (err instanceof Anthropic.PermissionDeniedError) error = "A chave não tem permissão para este modelo.";
    else if (err instanceof Anthropic.NotFoundError) error = "Modelo não disponível para esta chave.";
    else if (err instanceof Anthropic.RateLimitError) error = "Limite de uso atingido. Tente mais tarde.";
    else if (err instanceof Anthropic.APIConnectionError) error = "Não foi possível alcançar a API.";
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }
}
