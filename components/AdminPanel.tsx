"use client";

import { useState } from "react";

type View = {
  officeName: string; lawyerName: string; oab: string; tagline: string; about: string;
  phone: string; whatsapp: string; email: string; address: string; practiceAreas: string[];
  chatEnabled: boolean; assistantName: string; welcomeMessage: string; model: string;
  effort: "low" | "medium" | "high"; extraInstructions: string; updatedAt?: string;
  apiKeyMasked: string | null; apiKeySource: "portal" | "env" | null; storage: string;
  notifyEmail: string; officeHours: string; emailAtivo: boolean;
};

type Notice = { type: "ok" | "error"; text: string } | null;

export default function AdminPanel({ initial, models }: { initial: View; models: { id: string; label: string }[] }) {
  const [s, setS] = useState<View>(initial);
  const [areas, setAreas] = useState(initial.practiceAreas.join("\n"));
  const [newKey, setNewKey] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const set = <K extends keyof View>(k: K, v: View[K]) => setS((p) => ({ ...p, [k]: v }));

  async function save(extra: Record<string, unknown> = {}) {
    setBusy("save");
    setNotice(null);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...s, practiceAreas: areas.split("\n"), ...(newKey ? { apiKey: newKey } : {}), ...extra }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (res.status === 401) return window.location.reload();
    if (!res.ok) return setNotice({ type: "error", text: data.error || "Falha ao salvar." });
    setS(data);
    setAreas(data.practiceAreas.join("\n"));
    setNewKey("");
    setNotice({ type: "ok", text: "Configurações salvas." });
  }

  async function test() {
    setBusy("test");
    setNotice(null);
    const res = await fetch("/api/admin/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: newKey || undefined, model: s.model }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    setNotice(data.ok ? { type: "ok", text: data.message } : { type: "error", text: data.error || "Falha no teste." });
  }

  const field = (k: keyof View, label: string, opts: { area?: boolean; hint?: string } = {}) => (
    <label>
      {label}
      {opts.area ? (
        <textarea rows={3} value={s[k] as string} onChange={(e) => set(k, e.target.value as never)} />
      ) : (
        <input value={s[k] as string} onChange={(e) => set(k, e.target.value as never)} />
      )}
      {opts.hint && <small>{opts.hint}</small>}
    </label>
  );

  return (
    <main className="cfg">
      <div className="admin-wrap">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Portal do escritório</p>
            <h1>Configurações</h1>
          </div>
        </header>

        {notice && <p className={`alert ${notice.type}`}>{notice.text}</p>}

        <section className="admin-card highlight">
          <h2>Contato e notificações</h2>
          <p className="muted small">Estes dados aparecem no site e na assistente. Os resultados de cada atendimento vão para o e-mail de notificações.</p>
          <div className="two">
            {field("whatsapp", "WhatsApp do escritório (com DDI e DDD)", { hint: "Somente números, ex.: 5574991371324" })}
            {field("phone", "Telefone exibido no site")}
            {field("email", "E-mail exibido no site")}
            {field("notifyEmail", "E-mail que recebe os contatos", { hint: "Novo lead e atendimento concluído chegam aqui." })}
          </div>
          {field("officeHours", "Horário de atendimento")}
          <div className="status-row">
            <span className={`pill ${s.emailAtivo ? "ok" : "warn"}`}>{s.emailAtivo ? "Envio de e-mail ativo" : "Envio de e-mail não configurado"}</span>
            {!s.emailAtivo && <small>Falta definir RESEND_API_KEY e EMAIL_FROM na Vercel. Enquanto isso, todos os contatos ficam no Funil.</small>}
          </div>
        </section>

        <section className="admin-card">
          <h2>Integração de IA (Claude)</h2>
          <div className="status-row">
            <span className={`pill ${s.apiKeyMasked ? "ok" : "warn"}`}>
              {s.apiKeyMasked ? "Chave configurada" : "Sem chave"}
            </span>
            {s.apiKeyMasked && (
              <code>{s.apiKeyMasked}</code>
            )}
            {s.apiKeySource === "env" && <small>(vinda da variável ANTHROPIC_API_KEY)</small>}
          </div>
          <label>
            {s.apiKeyMasked ? "Substituir chave de API" : "Chave de API da Anthropic"}
            <input
              type="password"
              placeholder="sk-ant-..."
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              autoComplete="off"
            />
            <small>
              Crie em <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noopener noreferrer">platform.claude.com</a>.
              A chave é guardada criptografada no servidor e nunca é exibida de novo.
            </small>
          </label>
          <div className="two">
            <label>
              Modelo
              <select value={s.model} onChange={(e) => set("model", e.target.value)}>
                {models.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </label>
            <label>
              Esforço de raciocínio
              <select value={s.effort} onChange={(e) => set("effort", e.target.value as View["effort"])}>
                <option value="low">Baixo (respostas rápidas, recomendado)</option>
                <option value="medium">Médio</option>
                <option value="high">Alto (mais lento e caro)</option>
              </select>
            </label>
          </div>
          <label className="check">
            <input type="checkbox" checked={s.chatEnabled} onChange={(e) => set("chatEnabled", e.target.checked)} />
            Exibir o assistente virtual no site
          </label>
          <div className="row">
            <button className="btn btn-ghost-dark" onClick={test} disabled={busy !== null}>
              {busy === "test" ? "Testando…" : "Testar conexão"}
            </button>
            {s.apiKeySource === "portal" && (
              <button
                className="btn btn-danger"
                disabled={busy !== null}
                onClick={() => confirm("Remover a chave salva? O chat ficará indisponível.") && save({ removeApiKey: true })}
              >
                Remover chave
              </button>
            )}
          </div>
        </section>

        <section className="admin-card">
          <h2>Assistente virtual</h2>
          {field("assistantName", "Nome do assistente")}
          {field("welcomeMessage", "Mensagem de boas-vindas", { area: true })}
          <label>
            Instruções adicionais para a IA
            <textarea
              rows={5}
              value={s.extraInstructions}
              placeholder="Ex.: Atendemos de segunda a sexta, das 9h às 18h. Primeira consulta on-line disponível."
              onChange={(e) => set("extraInstructions", e.target.value)}
            />
            <small>Horários, cidades atendidas, documentos que o cliente deve trazer etc.</small>
          </label>
        </section>

        <section className="admin-card">
          <h2>Dados do escritório</h2>
          <div className="two">
            {field("officeName", "Nome do escritório")}
            {field("lawyerName", "Advogado responsável")}
            {field("oab", "Inscrição OAB")}
          </div>
          {field("address", "Endereço")}
          {field("tagline", "Frase de destaque")}
          {field("about", "Sobre o escritório", { area: true })}
          <label>
            Áreas de atuação (uma por linha)
            <textarea rows={6} value={areas} onChange={(e) => setAreas(e.target.value)} />
          </label>
        </section>

        <div className="save-bar">
          <small className="muted">
            Armazenamento: {s.storage}
            {s.updatedAt && ` · última alteração ${new Date(s.updatedAt).toLocaleString("pt-BR")}`}
          </small>
          <button className="btn btn-primary" onClick={() => save()} disabled={busy !== null}>
            {busy === "save" ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </div>
    </main>
  );
}
