import { isAdmin } from "@/lib/auth";
import { listarCasos, resumoCaso } from "@/lib/cases";
import { erro } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return erro("Não autorizado.", 401);
  return Response.json({ casos: (await listarCasos()).map(resumoCaso) });
}
