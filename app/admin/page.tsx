import type { Metadata } from "next";
import AdminLogin from "@/components/AdminLogin";
import AdminPanel from "@/components/AdminPanel";
import { adminConfigured, isAdmin } from "@/lib/auth";
import { adminView, getSettings, MODELS } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Portal do escritório", robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!adminConfigured()) {
    return (
      <main className="admin-shell">
        <div className="admin-card narrow">
          <h1>Portal não configurado</h1>
          <p>
            Defina as variáveis de ambiente <code>ADMIN_PASSWORD</code> e <code>SESSION_SECRET</code> (mínimo 16
            caracteres) na Vercel e faça um novo deploy.
          </p>
        </div>
      </main>
    );
  }
  if (!(await isAdmin())) return <AdminLogin />;
  const initial = adminView(await getSettings());
  return <AdminPanel initial={initial} models={MODELS.map((m) => ({ ...m }))} />;
}
