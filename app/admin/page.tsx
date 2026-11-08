import type { Metadata } from "next";
import AdminShell from "@/components/AdminShell";
import Funil from "@/components/Funil";
import { guardaAdmin } from "@/lib/adminGuard";
import { listarCasos, resumoCaso } from "@/lib/cases";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Área do Advogado", robots: { index: false, follow: false } };

export default async function Page() {
  const bloqueio = await guardaAdmin();
  if (bloqueio) return bloqueio;
  const [s, casos] = await Promise.all([getSettings(), listarCasos()]);
  return (
    <AdminShell escritorio={s.officeName}>
      <Funil inicial={casos.map(resumoCaso)} />
    </AdminShell>
  );
}
