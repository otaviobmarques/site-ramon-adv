"use client";

import { useEffect, useState } from "react";

const ROTEIRO = [
  { r: "a", t: "Olá! Sou a Lia, assistente virtual com IA do escritório. Qual é o seu nome completo?" },
  { r: "u", t: "Maria Souza. Caí num golpe do falso funcionário do banco ontem à noite." },
  { r: "a", t: "Sinto muito, Maria. Como foi ontem: você já pediu o MED ao seu banco? Se não, peça agora pelo app e anote o protocolo." },
  { r: "u", t: "Ainda não. Vou pedir agora!" },
  { r: "a", t: "Ótimo. Enquanto isso, qual foi o valor transferido e para qual banco?" },
];

export default function HeroChat({ nome }: { nome: string }) {
  const [n, setN] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setN((x) => (x >= ROTEIRO.length + 2 ? 1 : x + 1)), 2200);
    return () => clearInterval(t);
  }, []);
  const visiveis = ROTEIRO.slice(0, Math.min(n, ROTEIRO.length));
  const digitando = n < ROTEIRO.length;
  return (
    <div className="hero-chat" aria-hidden="true">
      <div className="hero-chat-head">
        <span className="avatar">{nome.slice(0, 1)}</span>
        <div>
          <strong>{nome}</strong>
          <small><i className="dot-online" /> Assistente com IA · on-line</small>
        </div>
      </div>
      <div className="hero-chat-body">
        {visiveis.map((m, i) => (
          <div key={i} className={`bubble ${m.r === "u" ? "me" : ""}`}>{m.t}</div>
        ))}
        {digitando && <div className="bubble typing"><i /><i /><i /></div>}
      </div>
      <div className="hero-chat-steps">
        {["Identificação", "Relato", "Fraude", "Hábitos", "Docs", "Agenda", "Termo"].map((s, i) => (
          <span key={s} className={i < Math.ceil(n / 2) ? "on" : ""}>{s}</span>
        ))}
      </div>
    </div>
  );
}
