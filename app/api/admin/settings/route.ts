import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { adminView, getSettings, MODELS, saveSettings, type SettingsUpdate } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRING_FIELDS = [
  "officeName", "lawyerName", "oab", "tagline", "about", "phone", "whatsapp", "email", "address",
  "assistantName", "welcomeMessage", "extraInstructions", "notifyEmail", "officeHours",
] as const;

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  return NextResponse.json(adminView(await getSettings()));
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const update: SettingsUpdate = {};
  for (const f of STRING_FIELDS) {
    if (typeof body[f] === "string") update[f] = (body[f] as string).slice(0, 5000);
  }
  if (typeof update.whatsapp === "string") update.whatsapp = update.whatsapp.replace(/\D/g, "");
  if (Array.isArray(body.practiceAreas)) {
    update.practiceAreas = body.practiceAreas.filter((a): a is string => typeof a === "string" && a.trim() !== "").map((a) => a.trim()).slice(0, 20);
  }
  if (typeof body.chatEnabled === "boolean") update.chatEnabled = body.chatEnabled;
  if (typeof body.model === "string" && MODELS.some((m) => m.id === body.model)) update.model = body.model;
  if (body.effort === "low" || body.effort === "medium" || body.effort === "high") update.effort = body.effort;
  if (typeof body.apiKey === "string" && body.apiKey.trim()) {
    if (!body.apiKey.trim().startsWith("sk-ant-")) {
      return NextResponse.json({ error: "A chave deve começar com sk-ant-." }, { status: 400 });
    }
    update.apiKey = body.apiKey;
  }
  if (body.removeApiKey === true) update.removeApiKey = true;

  try {
    return NextResponse.json(adminView(await saveSettings(update)));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message || "Falha ao salvar." }, { status: 500 });
  }
}
