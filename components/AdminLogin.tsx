"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
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
      body: JSON.stringify({ username, password }),
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
        <p className="eyebrow">Área restrita</p>
        <h1>Portal do escritório</h1>
        <label>
          Usuário
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
        </label>
        <label>
          Senha
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="alert error">{error}</p>}
        <button className="btn btn-primary" disabled={loading}>{loading ? "Entrando…" : "Entrar"}</button>
        <a href="/" className="muted small">← Voltar ao site</a>
      </form>
    </main>
  );
}
