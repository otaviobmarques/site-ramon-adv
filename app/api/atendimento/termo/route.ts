import crypto from "node:crypto";
import { notificarConclusao } from "@/lib/atendimento";
import { lerCasoCliente, salvarCaso } from "@/lib/cases";
import { estadoCliente } from "@/lib/estado";
import { baseUrl, clientIp, erro } from "@/lib/http";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";

const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase().replace(/\s+/g, " ");

export async function POST(req: Request) {
  const { id, token, nome, hash } = (await req.json().catch(() => ({}))) as Record<string, string | undefined>;
  const caso = id && token ? await lerCasoCliente(id, token) : null;
  if (!caso?.termo) return erro("Termo não encontrado.", 404);
  if (caso.termo.aceitoEm) return Response.json({ estado: estadoCliente(caso) });
  if (hash !== caso.termo.hash) return erro("O termo foi atualizado. Revise a versão mais recente.", 409);
  if (!nome || !caso.dossie.nome || norm(nome) !== norm(caso.dossie.nome)) {
    return erro("Digite seu nome completo exatamente como informado no atendimento.", 400);
  }
  // confirma que o texto não mudou desde a geração
  if (crypto.createHash("sha256").update(caso.termo.texto).digest("hex") !== caso.termo.hash) return erro("Termo inválido.", 409);
  caso.termo.aceitoEm = new Date().toISOString();
  caso.termo.aceitoNome = nome.trim();
  caso.termo.aceitoIp = clientIp(req);
  caso.conversa.push({ role: "user", texto: "✅ Revisei e confirmei o Termo de Relato.", em: caso.termo.aceitoEm });
  caso.apiMessages.push({ role: "user", content: "[Sistema] O cliente revisou e confirmou o Termo de Relato." });
  caso.conversa.push({
    role: "assistant",
    texto: "Obrigada! Seu termo foi confirmado e o seu caso já está com o advogado. O escritório vai entrar em contato pelo WhatsApp para confirmar o horário da consulta. Se lembrar de mais alguma informação ou documento, pode enviar por aqui.",
    em: new Date().toISOString(),
  });
  caso.apiMessages.push({
    role: "assistant",
    content: "Obrigada! Seu termo foi confirmado e o seu caso já está com o advogado. O escritório vai entrar em contato pelo WhatsApp para confirmar o horário da consulta. Se lembrar de mais alguma informação ou documento, pode enviar por aqui.",
  });
  await notificarConclusao(caso, await getSettings(), baseUrl(req));
  await salvarCaso(caso);
  return Response.json({ estado: estadoCliente(caso) });
}
