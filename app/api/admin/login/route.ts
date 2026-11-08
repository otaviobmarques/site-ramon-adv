import { NextResponse } from "next/server";
import { adminConfigured, checkCredentials, createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

const failures = new Map<string, { count: number; until: number }>();

export async function POST(req: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "Defina ADMIN_PASSWORD e SESSION_SECRET nas variáveis de ambiente." }, { status: 500 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const f = failures.get(ip);
  if (f && f.until > Date.now()) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }

  const { username, password } = (await req.json().catch(() => ({}))) as { username?: string; password?: string };
  if (typeof username !== "string" || typeof password !== "string" || !checkCredentials(username, password)) {
    const count = (f?.count ?? 0) + 1;
    failures.set(ip, { count, until: count >= 5 ? Date.now() + 10 * 60 * 1000 : 0 });
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Usuário ou senha incorretos." }, { status: 401 });
  }
  failures.delete(ip);

  const { token, maxAge } = createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge,
  });
  return res;
}
