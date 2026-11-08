import type { Metadata } from "next";
import AdminPanel from "@/components/AdminPanel";
import AdminShell from "@/components/AdminShell";
import { guardaAdmin } from "@/lib/adminGuard";
import { adminView, getSettings, MODELS } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Configurações", robots: { index: false, follow: false } };

export default async function Page() {
  const bloqueio = await guardaAdmin();
  if (bloqueio) return bloqueio;
  const s = await getSettings();
  return (
    <AdminShell escritorio={s.officeName}>
      <AdminPanel initial={adminView(s)} models={MODELS.map((m) => ({ ...m }))} />
    </AdminShell>
  );
}
