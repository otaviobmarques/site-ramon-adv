import crypto from "node:crypto";
import { lerCasoCliente, salvarCaso } from "@/lib/cases";
import { CHECKLIST_DOCUMENTOS, type TipoDocumento } from "@/lib/dossie";
import { estadoCliente } from "@/lib/estado";
import { clientIp, erro, limitado } from "@/lib/http";
import { writeFile } from "@/lib/store";

export const runtime = "nodejs";

const TIPOS_ARQUIVO: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};
const MAX = 4 * 1024 * 1024; // limite do corpo de requisição das funções da Vercel

export async function POST(req: Request) {
  if (limitado(`up:${clientIp(req)}`, 30, 60 * 60 * 1000)) return erro("Muitos envios. Tente mais tarde.", 429);
  const form = await req.formData().catch(() => null);
  if (!form) return erro("Envio inválido.", 400);
  const id = String(form.get("id") ?? "");
  const token = String(form.get("token") ?? "");
  const tipo = String(form.get("tipo") ?? "outros") as TipoDocumento;
  const file = form.get("arquivo");
  if (!(file instanceof File)) return erro("Selecione um arquivo.", 400);
  if (!CHECKLIST_DOCUMENTOS.some((d) => d.tipo === tipo)) return erro("Tipo de documento inválido.", 400);
  const ext = TIPOS_ARQUIVO[file.type];
  if (!ext) return erro("Envie PDF ou imagem (JPG, PNG, WEBP, HEIC).", 400);
  if (file.size > MAX) return erro("Arquivo maior que 4 MB. Envie uma foto ou PDF menor.", 400);

  const caso = await lerCasoCliente(id, token);
  if (!caso) return erro("Atendimento não encontrado.", 404);
  if (caso.documentos.length >= 40) return erro("Limite de documentos atingido.", 400);

  const docId = crypto.randomBytes(6).toString("hex");
  const pathname = `casos/${caso.id}/docs/${docId}.${ext}`;
  await writeFile(pathname, Buffer.from(await file.arrayBuffer()), file.type);
  const nome = file.name.replace(/[^\p{L}\p{N}._ -]/gu, "").slice(0, 120) || `documento.${ext}`;
  caso.documentos.push({ id: docId, tipo, nome, pathname, contentType: file.type, tamanho: file.size, enviadoEm: new Date().toISOString() });
  await salvarCaso(caso);
  const label = CHECKLIST_DOCUMENTOS.find((d) => d.tipo === tipo)!.label;
  return Response.json({ estado: estadoCliente(caso), aviso: `📎 Enviei: ${label} (${nome})` });
}
