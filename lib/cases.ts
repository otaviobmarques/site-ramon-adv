import crypto from "node:crypto";
import type { CampoKey, Dossie, Status, Temperatura, TipoDocumento } from "./dossie";
import { deletePrefix, listPaths, readJSON, writeJSON } from "./store";

export interface Documento {
  id: string;
  tipo: TipoDocumento;
  nome: string;
  pathname: string;
  contentType: string;
  tamanho: number;
  enviadoEm: string;
}

export interface Termo {
  versao: number;
  texto: string;
  geradoEm: string;
  hash: string;
  aceitoEm?: string;
  aceitoNome?: string;
  aceitoIp?: string;
}

export interface Notificacao {
  id: string;
  banco: string;
  tipo: "pagador" | "recebedor";
  canal: "consumidor.gov.br" | "BACEN" | "outro";
  enviadaEm: string;
  resposta?: string;
  proximoPasso?: string;
}

export interface Mensagem {
  role: "user" | "assistant";
  texto: string;
  em: string;
}

export interface Caso {
  id: string;
  tokenHash: string;
  criadoEm: string;
  atualizadoEm: string;
  status: Status;
  temperatura?: Temperatura;
  temperaturaMotivo?: string;
  motivoPerda?: string;
  origem: string;
  consentimentoLGPD: string;
  ip?: string;
  dossie: Dossie;
  documentos: Documento[];
  termo?: Termo;
  notificacoes: Notificacao[];
  followups: Record<string, string>; // "d3" | "d10" | "d30" -> data de envio
  viabilidade: Record<string, boolean>;
  honorarios?: { base: number; percInicial: number; parcelas: number };
  notas: string;
  conversa: Mensagem[];
  /** Histórico bruto da API (append-only), para manter o contexto da IA. */
  apiMessages: unknown[];
  analiseIA?: { texto: string; geradaEm: string };
  emails: Record<string, string>; // eventos já notificados
}

const casePath = (id: string) => `casos/${id}/caso.json`;

export function novoId() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
  return `${ymd}-${crypto.randomBytes(4).toString("hex")}`;
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function criarCaso(origem: string, ip: string | undefined, saudacao: string) {
  const token = crypto.randomBytes(24).toString("base64url");
  const agora = new Date().toISOString();
  const caso: Caso = {
    id: novoId(),
    tokenHash: hashToken(token),
    criadoEm: agora,
    atualizadoEm: agora,
    status: "atendimento_ia",
    origem: origem.slice(0, 100) || "site",
    consentimentoLGPD: agora,
    ip,
    dossie: {},
    documentos: [],
    notificacoes: [],
    followups: {},
    viabilidade: {},
    notas: "",
    conversa: [{ role: "assistant", texto: saudacao, em: agora }],
    apiMessages: [],
    emails: {},
  };
  await salvarCaso(caso);
  return { caso, token };
}

export async function lerCaso(id: string): Promise<Caso | null> {
  if (!/^[0-9]{8}-[0-9a-f]{8}$/.test(id)) return null;
  return readJSON<Caso>(casePath(id));
}

export async function lerCasoCliente(id: string, token: string): Promise<Caso | null> {
  const caso = await lerCaso(id);
  if (!caso || !token) return null;
  const a = Buffer.from(caso.tokenHash);
  const b = Buffer.from(hashToken(token));
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? caso : null;
}

export async function salvarCaso(caso: Caso) {
  caso.atualizadoEm = new Date().toISOString();
  await writeJSON(casePath(caso.id), caso);
}

export async function listarCasos(): Promise<Caso[]> {
  const paths = (await listPaths("casos/")).filter((p) => p.endsWith("/caso.json"));
  const casos = await Promise.all(paths.map((p) => readJSON<Caso>(p)));
  return casos.filter((c): c is Caso => Boolean(c)).sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
}

export async function excluirCaso(id: string) {
  if (!/^[0-9]{8}-[0-9a-f]{8}$/.test(id)) return;
  await deletePrefix(`casos/${id}/`);
}

export function aplicarCampos(caso: Caso, campos: Record<string, unknown>, validos: readonly CampoKey[]) {
  const aplicados: string[] = [];
  for (const [k, v] of Object.entries(campos)) {
    if (!validos.includes(k as CampoKey)) continue;
    if (typeof v !== "string" && typeof v !== "number" && typeof v !== "boolean") continue;
    const valor = String(v).trim().slice(0, 3000);
    if (!valor) continue;
    caso.dossie[k as CampoKey] = valor;
    aplicados.push(k);
  }
  return aplicados;
}

/** Resumo sem dados pesados, para o painel. */
export function resumoCaso(c: Caso) {
  return {
    id: c.id,
    criadoEm: c.criadoEm,
    atualizadoEm: c.atualizadoEm,
    status: c.status,
    temperatura: c.temperatura,
    origem: c.origem,
    nome: c.dossie.nome,
    telefone: c.dossie.telefone,
    valor: c.dossie.valor,
    banco: c.dossie.banco_pagador,
    documentos: c.documentos.length,
    termo: c.termo ? (c.termo.aceitoEm ? "assinado" : "pendente") : "nao_gerado",
    agendamento: c.dossie.agendamento_preferencia,
  };
}
export type ResumoCaso = ReturnType<typeof resumoCaso>;
