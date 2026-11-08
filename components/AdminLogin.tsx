"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      setError((await res.json().catch(() => ({}))).error || "Falha no login.");
      setLoading(false);
    }
  }

  return (
    <main className="admin-shell">
      <form className="admin-card narrow" onSubmit={submit}>
        <p className="eyebrow dark">Área restrita</p>
        <h1>Portal do escritório</h1>
        <label>
          Senha
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
        </label>
        {error && <p className="alert error">{error}</p>}
        <button className="btn btn-gold" disabled={loading}>{loading ? "Entrando…" : "Entrar"}</button>
        <a href="/" className="muted small">← Voltar ao site</a>
      </form>
    </main>
  );
}
