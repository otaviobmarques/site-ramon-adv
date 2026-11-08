"use client";

import { useState } from "react";

export default function Faq({ itens }: { itens: { p: string; r: string }[] }) {
  const [aberto, setAberto] = useState<number | null>(0);
  return (
    <div className="faq">
      {itens.map((it, i) => (
        <div key={i} className={`faq-item ${aberto === i ? "open" : ""}`} data-reveal style={{ "--d": `${i * 60}ms` } as React.CSSProperties}>
          <button onClick={() => setAberto(aberto === i ? null : i)} aria-expanded={aberto === i}>
            <span>{it.p}</span>
            <i className="faq-icon" />
          </button>
          <div className="faq-body"><div><p>{it.r}</p></div></div>
        </div>
      ))}
    </div>
  );
}
