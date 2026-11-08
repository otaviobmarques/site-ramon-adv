"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminShell({ children, escritorio }: { children: React.ReactNode; escritorio: string }) {
  const path = usePathname();
  async function sair() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin";
  }
  return (
    <div className="adm">
      <header className="adm-top">
        <div className="adm-top-inner">
          <Link href="/admin" className="brand small dark"><span className="brand-mark">R</span><span>{escritorio}</span></Link>
          <nav>
            <Link href="/admin" className={path === "/admin" || path.startsWith("/admin/casos") ? "on" : ""}>Funil de casos</Link>
            <Link href="/admin/configuracoes" className={path.startsWith("/admin/configuracoes") ? "on" : ""}>Configurações</Link>
          </nav>
          <div className="adm-top-actions">
            <a href="/" target="_blank">Ver site ↗</a>
            <button onClick={sair}>Sair</button>
          </div>
        </div>
      </header>
      <div className="adm-body">{children}</div>
    </div>
  );
}
