export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export function baseUrl(req: Request) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const buckets = new Map<string, number[]>();
/** Limite simples por instância (melhor esforço). */
export function limitado(chave: string, max: number, janelaMs: number) {
  const agora = Date.now();
  const lista = (buckets.get(chave) ?? []).filter((t) => agora - t < janelaMs);
  lista.push(agora);
  buckets.set(chave, lista);
  if (buckets.size > 10000) buckets.clear();
  return lista.length > max;
}

export const erro = (mensagem: string, status: number) => Response.json({ error: mensagem }, { status });
