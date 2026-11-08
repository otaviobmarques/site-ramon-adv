import { isAdmin } from "@/lib/auth";
import { lerCaso } from "@/lib/cases";
import { erro } from "@/lib/http";
import { readFile } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  if (!(await isAdmin())) return erro("Não autorizado.", 401);
  const { id, docId } = await params;
  const caso = await lerCaso(id);
  const doc = caso?.documentos.find((d) => d.id === docId);
  if (!doc) return erro("Documento não encontrado.", 404);
  const f = await readFile(doc.pathname);
  if (!f) return erro("Arquivo não encontrado.", 404);
  return new Response(f.stream, {
    headers: {
      "Content-Type": doc.contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.nome)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
