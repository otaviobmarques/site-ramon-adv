import { decrypt, encrypt } from "./crypto";
import { emailConfigurado } from "./email";
import { readJSON, useBlob, writeJSON } from "./store";

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
  notifyEmail: string;
  officeHours: string;
  apiKeyEnc?: string;
  updatedAt?: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  officeName: "Ramon Advocacia",
  lawyerName: "Dr. Ramon",
  oab: "OAB/SC 75.149-A",
  tagline: "Caiu em um golpe pelo PIX? Entenda seus direitos e o que fazer agora.",
  about:
    "Atendemos vítimas de fraudes bancárias e golpes pelo PIX com um processo organizado: do primeiro contato à análise do caso pelo advogado, com todos os documentos e prazos sob controle.",
  phone: "(74) 99137-1324",
  whatsapp: "5574991371324",
  email: "adv.ramonnunes@gmail.com",
  address: "",
  practiceAreas: [
    "Golpes e fraudes pelo PIX",
    "Fraudes bancárias e cartões",
    "Empréstimos não reconhecidos",
    "Direito do Consumidor",
  ],
  chatEnabled: true,
  assistantName: "Lia",
  welcomeMessage:
    "Olá! Eu sou a Lia, assistente virtual com inteligência artificial do escritório. Vou fazer algumas perguntas para organizar o seu caso e agendar sua consulta com o advogado. Para começar, qual é o seu nome completo?",
  model: "claude-opus-5-5",
  effort: "medium",
  extraInstructions: "",
  notifyEmail: "adv.ramonnunes@gmail.com",
  officeHours: "Segunda a sexta, das 9h às 18h",
};

const SETTINGS_PATH = "config/settings.json";

export function storageMode(): "vercel-blob" | "arquivo-local" {
  return useBlob() ? "vercel-blob" : "arquivo-local";
}

export async function getSettings(): Promise<SiteSettings> {
  const raw = await readJSON<Partial<SiteSettings>>(SETTINGS_PATH);
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
  await writeJSON(SETTINGS_PATH, next);
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
  return { ...rest, apiKeyMasked: maskKey(key), apiKeySource: source, storage: storageMode(), emailAtivo: emailConfigurado() };
}

/** Visão pública para o site: sem nada sensível. */
export function publicView(s: SiteSettings) {
  const { apiKeyEnc: _a, extraInstructions: _b, model: _c, effort: _d, notifyEmail: _e, phone: _f, whatsapp: _g, email: _h, ...rest } = s;
  return { ...rest, chatAvailable: s.chatEnabled && Boolean(getApiKey(s).key) };
}
export type PublicSettings = ReturnType<typeof publicView>;
