"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Caso } from "@/lib/cases";
import {
  CAMPOS, CHECKLIST_DOCUMENTOS, ETAPAS, FOLLOWUPS, STATUS, VIABILIDADE,
  paraData, parseValor, progresso, somarDias, somarDiasUteis,
} from "@/lib/dossie";

type CasoSeguro = Omit<Caso, "tokenHash" | "apiMessages">;
const ABAS = ["Dossiê", "Documentos", "Prazos", "Viabilidade", "Honorários", "Follow-up", "Análise IA", "Conversa"] as const;
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dt = (d: Date | string) => { const x = typeof d === "string" ? paraData(d) : d; return Number.isNaN(x.getTime()) ? String(d) : x.toLocaleDateString("pt-BR"); };
const dth = (d: string) => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function waLink(tel: string | undefined, msg: string) {
  const n = (tel ?? "").replace(/\D/g, "");
  const full = n.length <= 11 ? `55${n}` : n;
  return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`;
}

function Markdown({ t }: { t: string }) {
  return (
    <div className="md">
      {t.split("\n").map((l, i) => {
        if (/^#{1,3} /.test(l)) return <h4 key={i}>{l.replace(/^#+ /, "")}</h4>;
        if (/^\s*[-*] /.test(l)) return <li key={i}>{l.replace(/^\s*[-*] /, "").replace(/\*\*/g, "")}</li>;
        if (!l.trim()) return <br key={i} />;
        return <p key={i}>{l.replace(/\*\*/g, "")}</p>;
      })}
    </div>
  );
}

export default function CasoView({ inicial }: { inicial: CasoSeguro }) {
  const router = useRouter();
  const [c, setC] = useState(inicial);
  const [aba, setAba] = useState<(typeof ABAS)[number]>("Dossiê");
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [editando, setEditando] = useState(false);
  const [dossieEd, setDossieEd] = useState(c.dossie);
  const [notas, setNotas] = useState(c.notas);
  const [analisando, setAnalisando] = useState(false);
  const [nova, setNova] = useState({ banco: "", tipo: "pagador", canal: "consumidor.gov.br", enviadaEm: new Date().toISOString().slice(0, 10) });
  const valorNum = parseValor(c.dossie.valor) ?? 0;
  const [hon, setHon] = useState(c.honorarios ?? { base: valorNum, percInicial: 5, parcelas: 1 });

  const prog = progresso(c.dossie, c.documentos.length, Boolean(c.termo?.aceitoEm));
  const nome1 = (c.dossie.nome ?? "").split(" ")[0] || "tudo bem";

  async function patch(body: Record<string, unknown>, msg = "Salvo") {
    setSalvando(true);
    const r = await fetch(`/api/admin/casos/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSalvando(false);
    if (r.status === 401) return window.location.reload();
    if (!r.ok) return setAviso("Falha ao salvar");
    const d = await r.json();
    setC(d.caso);
    setAviso(msg);
    setTimeout(() => setAviso(""), 2000);
  }

  async function analisar() {
    setAnalisando(true);
    const r = await fetch(`/api/admin/casos/${c.id}/analise`, { method: "POST" });
    const d = await r.json().catch(() => ({}));
    setAnalisando(false);
    if (!r.ok) return setAviso(d.error || "Falha na análise");
    setC({ ...c, analiseIA: d.analiseIA });
  }

  async function excluir() {
    if (!confirm("Excluir este caso e todos os documentos? Use para pedidos de exclusão (LGPD). Não pode ser desfeito.")) return;
    await fetch(`/api/admin/casos/${c.id}`, { method: "DELETE" });
    router.push("/admin");
  }

  const pendentes = CHECKLIST_DOCUMENTOS.filter((d) => d.tipo !== "outros" && !c.documentos.some((x) => x.tipo === d.tipo));
  const msgCobranca = `Olá, ${nome1}! Para darmos andamento à análise do seu caso, ainda precisamos dos seguintes documentos:\n${pendentes.map((p) => `• ${p.label}`).join("\n")}\nVocê pode enviar por aqui mesmo. Obrigado!`;

  const alertasPerfil = useMemo(() => {
    const a: string[] = [];
    const d = c.dossie;
    const media = parseValor(d.media_pix_6m);
    if (media && valorNum && valorNum > media * 3) a.push(`Valor da fraude (${brl(valorNum)}) é ${Math.round(valorNum / media)}× a média de PIX do cliente (${brl(media)}).`);
    const h = parseInt((d.hora_fraude ?? "").replace(/\D/g, "").slice(0, 2), 10);
    if (!Number.isNaN(h) && (h >= 20 || h < 6) && /n[aã]o/i.test(d.pix_noturno ?? "")) a.push("Transação noturna, e o cliente diz não fazer PIX à noite.");
    if (d.data_fraude) {
      const w = paraData(d.data_fraude).getDay();
      if ((w === 0 || w === 6) && /n[aã]o/i.test(d.pix_fim_de_semana ?? "")) a.push("Transação no fim de semana, fora do hábito informado.");
    }
    if (/n[aã]o/i.test(d.pix_anterior_mesma_chave ?? "")) a.push("Primeiro PIX para a chave de destino.");
    if (/sim/i.test(d.aumento_limite ?? "")) a.push("Houve aumento de limite antes do golpe.");
    if (/sim/i.test(d.emprestimo_seguido_pix ?? "")) a.push("Empréstimo seguido de PIX.");
    return a;
  }, [c.dossie, valorNum]);

  return (
    <div className="caso">
      <div className="caso-head fade-up">
        <div>
          <button className="link-back" onClick={() => router.push("/admin")}>← Funil</button>
          <h1>{c.dossie.nome || "Cliente sem nome"}</h1>
          <p className="muted">
            Caso {c.id} · criado em {dth(c.criadoEm)} · origem {c.origem} · LGPD aceita em {dth(c.consentimentoLGPD)}
          </p>
          <div className="caso-contato">
            {c.dossie.telefone && <a className="pill-link" href={waLink(c.dossie.telefone, `Olá, ${nome1}! Aqui é do escritório.`)} target="_blank" rel="noreferrer">WhatsApp {c.dossie.telefone}</a>}
            {c.dossie.email && <a className="pill-link" href={`mailto:${c.dossie.email}`}>{c.dossie.email}</a>}
          </div>
        </div>
        <div className="caso-ctrl">
          <label>Etapa do funil
            <select value={c.status} onChange={(e) => patch({ status: e.target.value })}>
              {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          <label>Temperatura
            <select value={c.temperatura ?? ""} onChange={(e) => patch({ temperatura: e.target.value })}>
              <option value="" disabled>—</option>
              <option value="quente">🔥 Quente</option>
              <option value="morno">🌤 Morno</option>
              <option value="frio">❄️ Frio</option>
            </select>
          </label>
          {c.status === "perdido" && (
            <label>Motivo da perda
              <input defaultValue={c.motivoPerda} onBlur={(e) => e.target.value !== (c.motivoPerda ?? "") && patch({ motivoPerda: e.target.value })} />
            </label>
          )}
          {aviso && <span className="saved">{salvando ? "Salvando…" : aviso}</span>}
        </div>
      </div>

      <div className="etapas">
        {prog.map((p) => <span key={p.id} className={p.ok ? "ok" : ""}>{p.ok ? "✓" : p.id} {p.nome}</span>)}
      </div>
      {c.temperaturaMotivo && <p className="muted small">IA: {c.temperaturaMotivo}</p>}

      <div className="tabs">
        {ABAS.map((a) => <button key={a} className={aba === a ? "on" : ""} onClick={() => setAba(a)}>{a}</button>)}
      </div>

      <div className="tab-panel fade-up" key={aba}>
        {aba === "Dossiê" && (
          <>
            <div className="panel-head">
              <h2>Dossiê</h2>
              {editando ? (
                <div className="row">
                  <button className="btn btn-ghost-dark btn-sm" onClick={() => { setDossieEd(c.dossie); setEditando(false); }}>Cancelar</button>
                  <button className="btn btn-primary btn-sm" onClick={async () => { await patch({ dossie: dossieEd }); setEditando(false); }}>Salvar</button>
                </div>
              ) : (
                <button className="btn btn-ghost-dark btn-sm" onClick={() => setEditando(true)}>Editar</button>
              )}
            </div>
            {ETAPAS.filter((e) => CAMPOS.some((f) => f.etapa === e.id)).map((e) => (
              <div key={e.id} className="dossie-sec">
                <h3>{e.id}. {e.nome}</h3>
                <dl className="dl">
                  {CAMPOS.filter((f) => f.etapa === e.id).map((f) => (
                    <div key={f.key} className={!c.dossie[f.key] ? "vazio" : ""}>
                      <dt>{f.label}</dt>
                      <dd>
                        {editando ? (
                          <input value={dossieEd[f.key] ?? ""} onChange={(ev) => setDossieEd({ ...dossieEd, [f.key]: ev.target.value })} />
                        ) : (
                          c.dossie[f.key] || "—"
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
            <div className="dossie-sec">
              <h3>7. Termo de relato</h3>
              {c.termo ? (
                <>
                  <p>
                    Versão {c.termo.versao} · gerado em {dth(c.termo.geradoEm)} ·{" "}
                    {c.termo.aceitoEm ? <strong className="ok-t">confirmado por “{c.termo.aceitoNome}” em {dth(c.termo.aceitoEm)} (IP {c.termo.aceitoIp})</strong> : <strong className="warn-t">aguardando confirmação do cliente</strong>}
                  </p>
                  <p className="muted small">Hash SHA-256: <code>{c.termo.hash}</code></p>
                  <details><summary>Ver texto do termo</summary><pre className="termo">{c.termo.texto}</pre></details>
                </>
              ) : <p className="muted">Ainda não gerado.</p>}
            </div>
            <div className="dossie-sec">
              <h3>Notas internas</h3>
              <textarea rows={4} value={notas} onChange={(e) => setNotas(e.target.value)} onBlur={() => notas !== c.notas && patch({ notas })} placeholder="Anotações do advogado (não aparecem para o cliente)" />
            </div>
          </>
        )}

        {aba === "Documentos" && (
          <>
            <h2>Checklist de documentos</h2>
            <ul className="checklist">
              {CHECKLIST_DOCUMENTOS.map((d) => {
                const docs = c.documentos.filter((x) => x.tipo === d.tipo);
                return (
                  <li key={d.tipo} className={docs.length ? "ok" : ""}>
                    <span className="check">{docs.length ? "✓" : ""}</span>
                    <div>
                      <strong>{d.label}</strong>
                      {docs.map((x) => (
                        <a key={x.id} href={`/api/admin/casos/${c.id}/doc/${x.id}`} target="_blank" rel="noreferrer" className="doc-link">
                          📎 {x.nome} <small>({Math.round(x.tamanho / 1024)} KB · {dth(x.enviadoEm)})</small>
                        </a>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
            {pendentes.length > 0 && (
              <div className="callout">
                <h3>Mensagem pronta para cobrar o cliente</h3>
                <pre>{msgCobranca}</pre>
                <div className="row">
                  <a className="btn btn-primary btn-sm" href={waLink(c.dossie.telefone, msgCobranca)} target="_blank" rel="noreferrer">Enviar pelo WhatsApp</a>
                  <button className="btn btn-ghost-dark btn-sm" onClick={() => navigator.clipboard.writeText(msgCobranca)}>Copiar</button>
                </div>
              </div>
            )}
          </>
        )}

        {aba === "Prazos" && (
          <>
            <h2>Prazos de notificação</h2>
            {c.dossie.data_reclamacao ? (
              <div className="callout">
                Reclamação no banco em <strong>{dt(c.dossie.data_reclamacao)}</strong> (protocolo {c.dossie.protocolo_banco || "—"}).
                <br />Notificação liberada a partir de <strong>{dt(somarDias(c.dossie.data_reclamacao, 7))}</strong>
                {somarDias(c.dossie.data_reclamacao, 7) <= new Date() ? <span className="ok-t"> · já liberada</span> : <span className="warn-t"> · aguardar</span>}
              </div>
            ) : <p className="callout warn">Sem data de reclamação no banco no dossiê. Informe em Dossiê → Editar.</p>}
            <table className="tbl">
              <thead><tr><th>Banco</th><th>Tipo</th><th>Canal</th><th>Enviada</th><th>Conferir resposta</th><th>Resposta / próximo passo</th><th /></tr></thead>
              <tbody>
                {c.notificacoes.map((n) => {
                  const conferir = somarDiasUteis(n.enviadaEm, 10);
                  const vencido = conferir <= new Date() && !n.resposta;
                  return (
                    <tr key={n.id} className={vencido ? "late" : ""}>
                      <td>{n.banco}</td><td>{n.tipo}</td><td>{n.canal}</td><td>{dt(n.enviadaEm)}</td>
                      <td>{dt(conferir)}{vencido && <div className="warn-t small">Sem resposta: usar o segundo canal</div>}</td>
                      <td>
                        <input defaultValue={n.resposta} placeholder="Resposta do banco" onBlur={(e) => e.target.value !== (n.resposta ?? "") && patch({ atualizarNotificacao: { id: n.id, resposta: e.target.value } })} />
                        <input defaultValue={n.proximoPasso} placeholder="Próximo passo" onBlur={(e) => e.target.value !== (n.proximoPasso ?? "") && patch({ atualizarNotificacao: { id: n.id, proximoPasso: e.target.value } })} />
                      </td>
                      <td><button className="x" onClick={() => patch({ removerNotificacao: n.id })}>✕</button></td>
                    </tr>
                  );
                })}
                <tr className="new">
                  <td><input value={nova.banco} onChange={(e) => setNova({ ...nova, banco: e.target.value })} placeholder={c.dossie.banco_pagador || "Banco"} /></td>
                  <td><select value={nova.tipo} onChange={(e) => setNova({ ...nova, tipo: e.target.value })}><option value="pagador">pagador</option><option value="recebedor">recebedor</option></select></td>
                  <td><select value={nova.canal} onChange={(e) => setNova({ ...nova, canal: e.target.value })}><option>consumidor.gov.br</option><option>BACEN</option><option value="outro">outro</option></select></td>
                  <td><input type="date" value={nova.enviadaEm} onChange={(e) => setNova({ ...nova, enviadaEm: e.target.value })} /></td>
                  <td colSpan={3}><button className="btn btn-primary btn-sm" disabled={!nova.banco} onClick={async () => { await patch({ novaNotificacao: nova }); setNova({ ...nova, banco: "" }); }}>+ Registrar notificação</button></td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {aba === "Viabilidade" && (
          <>
            <h2>Viabilidade (triagem interna)</h2>
            <div className="two-col">
              {(["pagador", "recebedor"] as const).map((lado) => (
                <div key={lado} className="callout">
                  <h3>Banco {lado} {lado === "pagador" ? `(${c.dossie.banco_pagador ?? "—"})` : `(${c.dossie.banco_recebedor ?? "—"})`}</h3>
                  {VIABILIDADE[lado].map((item) => (
                    <label key={item} className="check-line">
                      <input type="checkbox" checked={Boolean(c.viabilidade[item])} onChange={(e) => patch({ viabilidade: { [item]: e.target.checked } })} />
                      {item}
                    </label>
                  ))}
                </div>
              ))}
            </div>
            <div className="callout">
              <h3>Perfil de uso × transação</h3>
              {alertasPerfil.length ? <ul>{alertasPerfil.map((a) => <li key={a}>{a}</li>)}</ul> : <p className="muted">Sem divergências detectadas com os dados atuais (ou faltam dados de hábitos de uso).</p>}
            </div>
          </>
        )}

        {aba === "Honorários" && (
          <>
            <h2>Honorários <span className="badge">uso interno</span></h2>
            <div className="hon">
              <label>Valor de referência (R$)
                <input type="number" min={0} step="0.01" value={hon.base} onChange={(e) => setHon({ ...hon, base: Number(e.target.value) })} />
              </label>
              <label>Inicial: {hon.percInicial.toFixed(1)}%
                <input type="range" min={2} max={5} step={0.5} value={hon.percInicial} onChange={(e) => setHon({ ...hon, percInicial: Number(e.target.value) })} />
              </label>
              <label>Parcelas do inicial
                <input type="number" min={1} max={24} value={hon.parcelas} onChange={(e) => setHon({ ...hon, parcelas: Number(e.target.value) })} />
              </label>
            </div>
            <div className="hon-res">
              <div><span>Honorário inicial</span><strong>{brl((hon.base * hon.percInicial) / 100)}</strong><small>{hon.parcelas}× de {brl((hon.base * hon.percInicial) / 100 / Math.max(1, hon.parcelas))}</small></div>
              <div><span>Êxito (25%)</span><strong>{brl(hon.base * 0.25)}</strong><small>sobre o valor de referência</small></div>
            </div>
            <button className="btn btn-primary" onClick={() => patch({ honorarios: hon })}>Salvar simulação</button>
          </>
        )}

        {aba === "Follow-up" && (
          <>
            <h2>Follow-up</h2>
            <div className="fu">
              {FOLLOWUPS.map((f) => {
                const quando = somarDias(c.criadoEm, f.dias);
                const msg = f.msg(nome1);
                const enviado = c.followups[f.id];
                return (
                  <div key={f.id} className={`fu-item ${enviado ? "done" : quando <= new Date() ? "due" : ""}`}>
                    <div className="fu-h"><strong>{f.titulo}</strong><span>{dt(quando)}</span>{enviado && <em>enviado em {dt(enviado)}</em>}</div>
                    <p>{msg}</p>
                    <div className="row">
                      <a className="btn btn-primary btn-sm" href={waLink(c.dossie.telefone, msg)} target="_blank" rel="noreferrer">Abrir no WhatsApp</a>
                      <button className="btn btn-ghost-dark btn-sm" onClick={() => patch({ followups: { [f.id]: enviado ? "" : new Date().toISOString() } })}>
                        {enviado ? "Desmarcar" : "Marcar como enviado"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {aba === "Análise IA" && (
          <>
            <div className="panel-head">
              <h2>Análise IA <span className="badge">triagem, não parecer</span></h2>
              <button className="btn btn-primary btn-sm" onClick={analisar} disabled={analisando}>{analisando ? "Analisando…" : c.analiseIA ? "Gerar novamente" : "Gerar análise"}</button>
            </div>
            {analisando && <div className="shimmer" />}
            {c.analiseIA && !analisando && (
              <>
                <p className="muted small">Gerada em {dth(c.analiseIA.geradaEm)}</p>
                <Markdown t={c.analiseIA.texto} />
              </>
            )}
            {!c.analiseIA && !analisando && <p className="muted">Gera um resumo do caso, lacunas, inconsistências e documentos críticos a partir do dossiê e da conversa.</p>}
          </>
        )}

        {aba === "Conversa" && (
          <>
            <h2>Conversa completa</h2>
            <div className="conv">
              {c.conversa.map((m, i) => (
                <div key={i} className={`conv-m ${m.role}`}>
                  <small>{m.role === "user" ? "Cliente" : "IA"} · {dth(m.em)}</small>
                  <p>{m.texto}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="danger-zone">
        <button className="btn btn-danger btn-sm" onClick={excluir}>Excluir caso (LGPD)</button>
      </div>
    </div>
  );
}
