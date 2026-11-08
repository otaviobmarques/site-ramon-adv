"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ResumoCaso } from "@/lib/cases";
import { STATUS, type Status } from "@/lib/dossie";

const TEMP = { quente: "🔥 Quente", morno: "🌤 Morno", frio: "❄️ Frio" } as const;
const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function Funil({ inicial }: { inicial: ResumoCaso[] }) {
  const [casos, setCasos] = useState(inicial);
  const [temp, setTemp] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<Status | null>(null);

  const filtrados = useMemo(
    () =>
      casos.filter(
        (c) =>
          (temp === "todos" || c.temperatura === temp) &&
          (!busca || `${c.nome ?? ""} ${c.telefone ?? ""} ${c.banco ?? ""}`.toLowerCase().includes(busca.toLowerCase())),
      ),
    [casos, temp, busca],
  );

  async function mover(id: string, status: Status) {
    const antes = casos;
    setCasos((cs) => cs.map((c) => (c.id === id ? { ...c, status } : c)));
    const r = await fetch(`/api/admin/casos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!r.ok) setCasos(antes);
  }

  async function atualizar() {
    const r = await fetch("/api/admin/casos");
    if (r.ok) setCasos((await r.json()).casos);
  }

  const total = casos.length;
  const quentes = casos.filter((c) => c.temperatura === "quente").length;
  const termos = casos.filter((c) => c.termo === "assinado").length;
  const hoje = casos.filter((c) => new Date(c.criadoEm).toDateString() === new Date().toDateString()).length;

  return (
    <div className="funil-page">
      <div className="kpis">
        {[
          ["Casos", total],
          ["Novos hoje", hoje],
          ["Leads quentes", quentes],
          ["Termos confirmados", termos],
        ].map(([k, v], i) => (
          <div key={k} className="kpi fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <span>{k}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>

      <div className="funil-tools">
        <input placeholder="Buscar por nome, telefone ou banco…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <div className="seg">
          {["todos", "quente", "morno", "frio"].map((t) => (
            <button key={t} className={temp === t ? "on" : ""} onClick={() => setTemp(t)}>
              {t === "todos" ? "Todos" : TEMP[t as keyof typeof TEMP]}
            </button>
          ))}
        </div>
        <button className="btn btn-ghost-dark btn-sm" onClick={atualizar}>↻ Atualizar</button>
      </div>

      <div className="board">
        {STATUS.map((st) => {
          const col = filtrados.filter((c) => c.status === st.id);
          return (
            <div
              key={st.id}
              className={`col ${sobre === st.id ? "drop" : ""} col-${st.id}`}
              onDragOver={(e) => {
                e.preventDefault();
                setSobre(st.id);
              }}
              onDragLeave={() => setSobre(null)}
              onDrop={() => {
                if (arrastando) mover(arrastando, st.id);
                setArrastando(null);
                setSobre(null);
              }}
            >
              <div className="col-head">
                <span>{st.label}</span>
                <em>{col.length}</em>
              </div>
              <div className="col-body">
                {col.map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/casos/${c.id}`}
                    className={`kcard ${arrastando === c.id ? "dragging" : ""}`}
                    draggable
                    onDragStart={() => setArrastando(c.id)}
                    onDragEnd={() => setArrastando(null)}
                  >
                    <div className="kcard-top">
                      <strong>{c.nome || "Sem nome ainda"}</strong>
                      {c.temperatura && <span className={`temp t-${c.temperatura}`}>{TEMP[c.temperatura]}</span>}
                    </div>
                    <div className="kcard-meta">
                      {c.valor && <span>💰 {c.valor}</span>}
                      {c.banco && <span>🏦 {c.banco}</span>}
                      <span>📎 {c.documentos}</span>
                      <span className={`termo-st ${c.termo}`}>
                        {c.termo === "assinado" ? "Termo ✓" : c.termo === "pendente" ? "Termo pendente" : "Sem termo"}
                      </span>
                    </div>
                    {c.agendamento && <div className="kcard-ag">📅 {c.agendamento}</div>}
                    <small>{fmt(c.atualizadoEm)} · {c.origem}</small>
                  </Link>
                ))}
                {!col.length && <p className="col-empty">Nenhum caso</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
