import Anthropic from "@anthropic-ai/sdk";


export function createClient(apiKey: string) {
  return new Anthropic({ apiKey, maxRetries: 2 });
}

/** Fallback no servidor só existe para Opus e Sonnet 5.5 na API da Claude. */
export function fallbackParams(model: string) {
  if (model === "claude-opus-5-5" || model === "claude-sonnet-5-5") {
    return { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };
  }
  return {};
}
