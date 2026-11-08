import { lerCasoCliente } from "@/lib/cases";
import { estadoCliente } from "@/lib/estado";
import { erro } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { id, token } = (await req.json().catch(() => ({}))) as { id?: string; token?: string };
  const caso = id && token ? await lerCasoCliente(id, token) : null;
  if (!caso) return erro("Atendimento não encontrado.", 404);
  return Response.json({ estado: estadoCliente(caso) });
}
