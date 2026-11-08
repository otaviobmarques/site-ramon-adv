import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import CasoView from "@/components/CasoView";
import { guardaAdmin } from "@/lib/adminGuard";
import { lerCaso } from "@/lib/cases";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Caso", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const bloqueio = await guardaAdmin();
  if (bloqueio) return bloqueio;
  const caso = await lerCaso((await params).id);
  if (!caso) notFound();
  const { tokenHash: _t, apiMessages: _a, ...seguro } = caso;
  const s = await getSettings();
  return (
    <AdminShell escritorio={s.officeName}>
      <CasoView inicial={seguro} />
    </AdminShell>
  );
}
