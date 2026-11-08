import AdminLogin from "@/components/AdminLogin";
import { adminConfigured, isAdmin } from "./auth";

export async function guardaAdmin(): Promise<React.ReactNode | null> {
  if (!adminConfigured()) {
    return (
      <main className="admin-shell">
        <div className="admin-card narrow">
          <h1>Portal não configurado</h1>
          <p>Defina ADMIN_USER, ADMIN_PASSWORD e SESSION_SECRET nas variáveis de ambiente da Vercel e publique novamente.</p>
        </div>
      </main>
    );
  }
  if (!(await isAdmin())) return <AdminLogin />;
  return null;
}
