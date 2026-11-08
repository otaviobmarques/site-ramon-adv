"use client";

import Link from "next/link";
import { LogoMarca } from "./Logo";
import { useCallback, useEffect, useRef, useState } from "react";
import type { EstadoCliente } from "@/lib/estado";

type Sessao = { id: string; token: string };
const KEY = "atendimento-sessao";

function lerSessao(): Sessao | null {
  try {
    const v = localStorage.getItem(KEY);
    return v ? (JSON.parse(v) as Sessao) : null;
  } catch {
    return null;
  }
}
function gravarSessao(s: Sessao | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {}
}

function Texto({ t }: { t: string }) {
  const partes = t.split(/(https?:\/\/[^\s)]+|\*\*[^*]+\*\*)/g);
  return (
    <>
      {partes.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer">{p}</a>
        ) : /^\*\*.+\*\*$/.test(p) ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export default function Atendimento({
  disponivel,
  assistente,
  escritorio,
  checklist,
}: {
  disponivel: boolean;
  assistente: string;
  escritorio: string;
  checklist: { tipo: string; label: string }[];
}) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [estado, setEstado] = useState<EstadoCliente | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [aceite, setAceite] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pendente, setPendente] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [upload, setUpload] = useState(false);
  const [tipoDoc, setTipoDoc] = useState(checklist[2]?.tipo ?? "outros");
  const [subindo, setSubindo] = useState(false);
  const [nomeTermo, setNomeTermo] = useState("");
  const [termoAberto, setTermoAberto] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const s = lerSessao();
    if (!s) return setCarregando(false);
    fetch("/api/atendimento/estado", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setSessao(s);
        setEstado(d.estado);
      })
      .catch(() => gravarSessao(null))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [estado?.conversa.length, pendente, enviando]);

  useEffect(() => {
    if (estado?.termo && !estado.termo.aceito) setTermoAberto(true);
  }, [estado?.termo?.hash, estado?.termo?.aceito]);

  async function iniciar() {
    setErro("");
    setCarregando(true);
    const params = new URLSearchParams(window.location.search);
    const origem = params.get("utm_source") || params.get("origem") || (document.referrer ? new URL(document.referrer).hostname : "site");
    const r = await fetch("/api/atendimento/iniciar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consentimento: true, origem }),
    });
    const d = await r.json().catch(() => ({}));
    setCarregando(false);
    if (!r.ok) return setErro(d.error || "Não foi possível iniciar.");
    const s = { id: d.estado.id, token: d.token };
    gravarSessao(s);
    setSessao(s);
    setEstado(d.estado);
    setTimeout(() => inputRef.current?.focus(), 400);
  }

  const enviar = useCallback(
    async (msg: string) => {
      if (!sessao || !msg.trim() || enviando) return;
      setErro("");
      setEnviando(true);
      setPendente(msg.trim());
      const r = await fetch("/api/atendimento/mensagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sessao, texto: msg.trim() }),
      }).catch(() => null);
      const d = r ? await r.json().catch(() => ({})) : {};
      setEnviando(false);
      setPendente(null);
      if (!r || !r.ok) {
        setErro(d.error || "Sem conexão. Tente novamente.");
        setTexto(msg);
        return;
      }
      setEstado(d.estado);
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [sessao, enviando],
  );

  async function enviarArquivo(file: File) {
    if (!sessao) return;
    setSubindo(true);
    setErro("");
    const fd = new FormData();
    fd.set("id", sessao.id);
    fd.set("token", sessao.token);
    fd.set("tipo", tipoDoc);
    fd.set("arquivo", file);
    const r = await fetch("/api/atendimento/upload", { method: "POST", body: fd }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setSubindo(false);
    if (!r || !r.ok) return setErro(d.error || "Falha no envio do arquivo.");
    setEstado(d.estado);
    setUpload(false);
    await enviar(d.aviso);
  }

  async function confirmarTermo() {
    if (!sessao || !estado?.termo) return;
    setErro("");
    const r = await fetch("/api/atendimento/termo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...sessao, nome: nomeTermo, hash: estado.termo.hash }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setErro(d.error || "Não foi possível confirmar.");
    setEstado(d.estado);
    setTermoAberto(false);
  }

  function recomecar() {
    if (!confirm("Iniciar um novo atendimento? O atual continua salvo com o escritório.")) return;
    gravarSessao(null);
    setSessao(null);
    setEstado(null);
    setAceite(false);
  }

  if (carregando && !estado) {
    return <main className="at-shell center"><div className="loader" /></main>;
  }

  if (!disponivel && !estado) {
    return (
      <main className="at-shell center">
        <div className="at-card fade-up">
          <h1>Atendimento on-line indisponível</h1>
          <p>Estamos fazendo uma manutenção rápida. Por favor, tente novamente em alguns minutos.</p>
          <Link href="/" className="link-muted">← Voltar ao site</Link>
        </div>
      </main>
    );
  }

  if (!estado) {
    return (
      <main className="at-shell center">
        <div className="hero-bg" aria-hidden="true"><span className="blob b1" /><span className="blob b2" /></div>
        <div className="at-card fade-up">
          <div className="at-logo"><LogoMarca tom="claro" altura={48} /></div>
          <h1>Atendimento on-line</h1>
          <p>
            Você vai conversar com <strong>{assistente}</strong>, a assistente virtual com <strong>inteligência artificial</strong> do
            escritório {escritorio}. Ela organiza as informações do seu caso para a consulta com o advogado.
          </p>
          <ul className="at-list">
            <li>Leva de 10 a 15 minutos; você pode pausar e voltar neste aparelho.</li>
            <li>Nunca informe senhas, tokens ou códigos.</li>
            <li>A assistente não dá parecer jurídico: isso é feito pelo advogado.</li>
          </ul>
          <label className="consent">
            <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
            <span>
              Li e concordo com a <Link href="/privacidade" target="_blank">política de privacidade</Link> e autorizo o tratamento dos
              meus dados para este atendimento (LGPD).
            </span>
          </label>
          {erro && <p className="alert error">{erro}</p>}
          <button className="btn btn-primary btn-lg" disabled={!aceite} onClick={iniciar}>Começar atendimento →</button>
          <Link href="/" className="link-muted">← Voltar ao site</Link>
        </div>
      </main>
    );
  }

  const feitos = estado.progresso.filter((p) => p.ok).length;
  const concluido = estado.termo?.aceito;
  const enviados = new Set<string>(estado.documentos.map((d) => d.tipo));

  return (
    <main className="at-app">
      <aside className="at-side">
        <Link href="/" className="brand"><LogoMarca tom="claro" altura={36} /></Link>
        <div className="at-progress">
          <div className="at-progress-head">
            <span>Seu progresso</span>
            <strong>{Math.round((feitos / estado.progresso.length) * 100)}%</strong>
          </div>
          <div className="bar"><i style={{ width: `${(feitos / estado.progresso.length) * 100}%` }} /></div>
          <ol>
            {estado.progresso.map((p) => (
              <li key={p.id} className={p.ok ? "ok" : ""}>
                <span className="check">{p.ok ? "✓" : p.id}</span>
                {p.nome}
              </li>
            ))}
          </ol>
        </div>
        {estado.documentos.length > 0 && (
          <div className="at-docs">
            <span>Documentos enviados</span>
            {estado.documentos.map((d) => <small key={d.id}>📎 {d.nome}</small>)}
          </div>
        )}
        <div className="at-side-foot">
          <button onClick={recomecar}>Novo atendimento</button>
        </div>
      </aside>

      <section className="at-chat">
        <header className="at-chat-head">
          <span className="avatar">{assistente.slice(0, 1)}</span>
          <div>
            <strong>{assistente}</strong>
            <small><i className="dot-online" /> Assistente virtual com IA</small>
          </div>
          <div className="at-mini-progress"><div className="bar"><i style={{ width: `${(feitos / estado.progresso.length) * 100}%` }} /></div></div>
        </header>

        <div className="at-msgs">
          {estado.conversa.map((m, i) => (
            <div key={i} className={`msg-row ${m.role}`}>
              {m.role === "assistant" && <span className="avatar sm">{assistente.slice(0, 1)}</span>}
              <div className="msg"><Texto t={m.texto} /></div>
            </div>
          ))}
          {pendente && (
            <div className="msg-row user"><div className="msg">{pendente}</div></div>
          )}
          {enviando && (
            <div className="msg-row assistant">
              <span className="avatar sm">{assistente.slice(0, 1)}</span>
              <div className="msg typing"><i /><i /><i /></div>
            </div>
          )}
          {estado.termo && !concluido && !termoAberto && (
            <button className="termo-banner" onClick={() => setTermoAberto(true)}>📝 Revisar e confirmar o Termo de Relato</button>
          )}
          {concluido && <div className="done-banner">✅ Atendimento concluído. O escritório vai entrar em contato com você.</div>}
          <div ref={fimRef} />
        </div>

        {erro && <p className="alert error at-err">{erro}</p>}

        <form
          className="at-input"
          onSubmit={(e) => {
            e.preventDefault();
            const m = texto;
            setTexto("");
            enviar(m);
          }}
        >
          <button type="button" className="icon-btn" onClick={() => setUpload(true)} aria-label="Enviar documento" title="Enviar documento">📎</button>
          <textarea
            ref={inputRef}
            rows={1}
            value={texto}
            placeholder="Escreva sua mensagem…"
            maxLength={4000}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                (e.currentTarget.form as HTMLFormElement).requestSubmit();
              }
            }}
          />
          <button type="submit" className="send-btn" disabled={enviando || !texto.trim()} aria-label="Enviar">➤</button>
        </form>
      </section>

      {upload && (
        <div className="modal-back" onClick={() => !subindo && setUpload(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Enviar documento</h2>
            <p className="muted">PDF ou foto, até 4 MB. Escolha o tipo:</p>
            <div className="doc-types">
              {checklist.map((c) => (
                <button key={c.tipo} className={`doc-type ${tipoDoc === c.tipo ? "on" : ""}`} onClick={() => setTipoDoc(c.tipo)}>
                  {enviados.has(c.tipo) && <span className="ok-dot">✓</span>}
                  {c.label}
                </button>
              ))}
            </div>
            <label className={`drop ${subindo ? "busy" : ""}`}>
              <input
                type="file"
                accept="application/pdf,image/*"
                disabled={subindo}
                onChange={(e) => e.target.files?.[0] && enviarArquivo(e.target.files[0])}
              />
              {subindo ? "Enviando…" : "Toque para escolher o arquivo"}
            </label>
            <button className="btn btn-ghost-dark" onClick={() => setUpload(false)} disabled={subindo}>Cancelar</button>
          </div>
        </div>
      )}

      {termoAberto && estado.termo && !concluido && (
        <div className="modal-back">
          <div className="modal wide">
            <h2>Termo de Relato</h2>
            <p className="muted">Revise com atenção. Se algo estiver errado, feche e peça a correção para a assistente.</p>
            <pre className="termo">{estado.termo.texto}</pre>
            <label className="field">
              Para confirmar, digite seu nome completo
              <input value={nomeTermo} onChange={(e) => setNomeTermo(e.target.value)} placeholder="Nome completo" />
            </label>
            {erro && <p className="alert error">{erro}</p>}
            <div className="row">
              <button className="btn btn-ghost-dark" onClick={() => setTermoAberto(false)}>Pedir correção</button>
              <button className="btn btn-primary" disabled={nomeTermo.trim().length < 5} onClick={confirmarTermo}>Li e confirmo</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
