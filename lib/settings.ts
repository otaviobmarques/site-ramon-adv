import { promises as fs } from "node:fs";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { decrypt, encrypt } from "./crypto";

export const MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5 (mais inteligente)" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 (equilibrado)" },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5 (mais rápido e barato)" },
] as const;

export type Effort = "low" | "medium" | "high";

export interface SiteSettings {
  officeName: string;
  lawyerName: string;
  oab: string;
  tagline: string;
  about: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  practiceAreas: string[];
  chatEnabled: boolean;
  assistantName: string;
  welcomeMessage: string;
  model: string;
  effort: Effort;
  extraInstructions: string;
  apiKeyEnc?: string;
  updatedAt?: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  officeName: "Ramon Advocacia",
  lawyerName: "Dr. Ramon",
  oab: "OAB/UF 000.000",
  tagline: "Advocacia próxima, estratégica e comprometida com o seu direito.",
  about:
    "Atuamos com ética, transparência e dedicação para oferecer soluções jurídicas personalizadas, seja na prevenção de conflitos ou na defesa dos seus interesses em juízo.",
  phone: "(74) 99137-1324",
  whatsapp: "5574991371324",
  email: "contato@ramonadvocacia.com.br",
  address: "Rua Exemplo, 123 — Centro, Cidade/UF",
  practiceAreas: [
    "Direito Civil",
    "Direito do Trabalho",
    "Direito de Família e Sucessões",
    "Direito do Consumidor",
    "Direito Previdenciário",
    "Direito Empresarial",
  ],
  chatEnabled: true,
  assistantName: "Assistente Virtual",
  welcomeMessage:
    "Olá! Sou o assistente virtual do escritório. Posso tirar dúvidas gerais e ajudar a agendar um atendimento. Como posso ajudar?",
  model: "claude-opus-5-5",
  effort: "low",
  extraInstructions: "",
};

const BLOB_PATH = "config/settings.json";
const LOCAL_FILE = path.join(process.cwd(), ".data", "settings.json");

function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function storageMode(): "vercel-blob" | "arquivo-local" {
  return useBlob() ? "vercel-blob" : "arquivo-local";
}

async function readRaw(): Promise<Partial<SiteSettings> | null> {
  try {
    if (useBlob()) {
      const res = await get(BLOB_PATH, { access: "private", useCache: false });
      if (!res || res.statusCode !== 200) return null;
      return JSON.parse(await new Response(res.stream).text());
    }
    return JSON.parse(await fs.readFile(LOCAL_FILE, "utf8"));
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") {
      console.error("Falha ao ler configurações:", err);
    }
    return null;
  }
}

async function writeRaw(data: SiteSettings): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  if (useBlob()) {
    await put(BLOB_PATH, json, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    return;
  }
  if (process.env.VERCEL) {
    throw new Error("Conecte um Vercel Blob Store ao projeto para salvar as configurações.");
  }
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, json, "utf8");
}

export async function getSettings(): Promise<SiteSettings> {
  const raw = await readRaw();
  return { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
}

export type SettingsUpdate = Partial<Omit<SiteSettings, "apiKeyEnc" | "updatedAt">> & {
  apiKey?: string; // nova chave em texto puro
  removeApiKey?: boolean;
};

export async function saveSettings(update: SettingsUpdate): Promise<SiteSettings> {
  const current = await getSettings();
  const { apiKey, removeApiKey, ...rest } = update;
  const next: SiteSettings = { ...current, ...rest, updatedAt: new Date().toISOString() };
  if (removeApiKey) delete next.apiKeyEnc;
  if (apiKey && apiKey.trim()) next.apiKeyEnc = encrypt(apiKey.trim());
  await writeRaw(next);
  return next;
}

export function getApiKey(s: SiteSettings): { key: string | null; source: "portal" | "env" | null } {
  if (s.apiKeyEnc) {
    try {
      return { key: decrypt(s.apiKeyEnc), source: "portal" };
    } catch (err) {
      console.error("Não foi possível descriptografar a chave (SESSION_SECRET mudou?)", err);
    }
  }
  if (process.env.ANTHROPIC_API_KEY) return { key: process.env.ANTHROPIC_API_KEY, source: "env" };
  return { key: null, source: null };
}

export function maskKey(key: string | null): string | null {
  if (!key) return null;
  return `${key.slice(0, 10)}…${key.slice(-4)}`;
}

/** Visão segura para o portal: nunca devolve a chave. */
export function adminView(s: SiteSettings) {
  const { apiKeyEnc: _omit, ...rest } = s;
  const { key, source } = getApiKey(s);
  return { ...rest, apiKeyMasked: maskKey(key), apiKeySource: source, storage: storageMode() };
}

/** Visão pública para o site: sem nada sensível. */
export function publicView(s: SiteSettings) {
  const { apiKeyEnc: _a, extraInstructions: _b, model: _c, effort: _d, ...rest } = s;
  return { ...rest, chatAvailable: s.chatEnabled && Boolean(getApiKey(s).key) };
}
export type PublicSettings = ReturnType<typeof publicView>;
