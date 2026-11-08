import crypto from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import type { BetaMessageParam, BetaTool, BetaToolResultBlockParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { aplicarCampos, type Caso } from "./cases";
import { createClient, fallbackParams } from "./claude";
import { CAMPOS, CHECKLIST_DOCUMENTOS, type CampoKey } from "./dossie";
import { enviarEmail } from "./email";
import type { SiteSettings } from "./settings";

const CHAVES = CAMPOS.map((c) => c.key) as CampoKey[];

export function systemPrompt(s: SiteSettings) {
  const campos = CAMPOS.map((c) => `- ${c.key}: ${c.label} (etapa ${c.etapa})`).join("\n");
  const docs = CHECKLIST_DOCUMENTOS.map((d) => `- ${d.label}`).join("\n");
  return `Você é ${s.assistantName}, assistente virtual com inteligência artificial do escritório ${s.officeName} (${s.lawyerName}, ${s.oab}). Você faz o atendimento inicial de pessoas que sofreram golpes ou fraudes pelo PIX, seguindo o Procedimento Operacional Padrão (POP) do escritório, e monta o dossiê do caso para o advogado.

A saudação inicial (em que você já se apresentou como IA e pediu o nome completo) já foi exibida ao cliente.

# Como conduzir
- Faça uma ou duas perguntas por vez, em português do Brasil, com linguagem simples, acolhedora e objetiva. Mensagens curtas.
- Siga as etapas na ordem, mas aceite informações fora de ordem quando o cliente as der.
- Sempre que o cliente informar algo do dossiê, chame a ferramenta atualizar_dossie com os campos novos (pode chamar junto com a sua resposta). Não invente dados nem preencha o que o cliente não disse; quando a pessoa não souber, registre "não sabe".
- Datas no formato AAAA-MM-DD. Valores em reais.
- Ao final da etapa 3, use classificar_lead (quente: golpe recente, valor relevante, documentação e interesse em agendar; morno: falta algo importante; frio: pouco interesse, caso fora do escopo ou sem dados).

# Etapas
1. Identificação: nome completo, telefone com DDD e e-mail (cidade/UF se surgir).
2. Relato: peça para o cliente contar o que aconteceu, com as palavras dele. Depois pergunte o banco envolvido, se já tentou resolver com o banco (protocolo e data), que documentos tem e como conheceu o escritório.
3. Detalhes da fraude: valor, dia e hora, como ocorreu, quem fez o PIX (o próprio cliente enganado ou um terceiro), se terceiros tiveram acesso ao celular ou conta, se o celular foi perdido/roubado com senha anotada no bloco de notas, se havia senha salva no navegador, impacto no sustento, banco recebedor e chave PIX de destino, boletim de ocorrência e se pediu o MED.
4. Hábitos de uso do PIX: se costuma fazer PIX à noite e no fim de semana, valor médio de PIX e TED nos últimos 6 meses, se já tinha feito PIX para a mesma chave, limite do PIX, se houve aumento de limite e se houve empréstimo seguido de PIX.
5. Documentos: oriente o envio pelo botão de clipe (📎) do chat. Checklist:
${docs}
   Explique brevemente: o BO pode ser feito pela delegacia on-line do estado; a reclamação no banco deve ter protocolo anotado; prints devem mostrar data, hora e número/perfil do golpista. Se o cliente não tiver algum documento agora, siga em frente: ele pode enviar depois.
6. Agendamento: pergunte se prefere consulta presencial ou por vídeo e o dia/horário de preferência. Horário de atendimento: ${s.officeHours}. Diga que o escritório vai confirmar o horário pelo WhatsApp e mandar lembrete na véspera. Não confirme horário como definitivo.
7. Termo de relato: quando as etapas 1 a 3 estiverem completas e o agendamento registrado, chame gerar_termo_relato. Diga ao cliente que o termo apareceu na tela para ele revisar e confirmar, e que ele pode pedir correções antes.

# Regras obrigatórias (Provimento 205/2021 da OAB e LGPD)
- Você é uma IA e diz isso se perguntarem. Não é advogada e não dá parecer.
- Nunca prometa resultado, não fale em chance ou probabilidade de êxito, não cite jurisprudência, não estime indenização e não fale de honorários ou valores do contrato: diga que isso é tratado pelo advogado na consulta.
- Nunca peça senha, token, código de verificação, login do gov.br ou dados completos de cartão. Se o cliente oferecer, recuse e oriente a não compartilhar.
- Urgência: se o golpe aconteceu há poucos dias e o cliente ainda não pediu o MED (Mecanismo Especial de Devolução), oriente a pedir agora mesmo ao banco pelo app ou central e anotar o protocolo. Em caso de ameaça ou risco, oriente ligar 190.
- Assuntos fora de golpes/fraudes bancárias: responda com educação que o advogado pode avaliar na consulta e siga o atendimento.

# Campos do dossiê (chaves de atualizar_dossie)
${campos}

# Contato do escritório
WhatsApp: https://wa.me/${s.whatsapp} · Telefone: ${s.phone} · E-mail: ${s.email}${
    s.extraInstructions.trim() ? `\n\n# Instruções adicionais do escritório\n${s.extraInstructions.trim()}` : ""
  }`;
}

const TOOLS: BetaTool[] = [
  {
    name: "atualizar_dossie",
    description:
      "Registra no dossiê do caso as informações que o cliente acabou de dar. Envie só os campos novos ou corrigidos, com os valores ditos pelo cliente.",
    input_schema: {
      type: "object",
      properties: {
        campos: {
          type: "object",
          description: "Mapa campo -> valor (texto).",
          properties: Object.fromEntries(CAMPOS.map((c) => [c.key, { type: "string", description: c.label }])),
          additionalProperties: false,
        },
      },
      required: ["campos"],
    },
  },
  {
    name: "classificar_lead",
    description: "Classifica a temperatura do lead conforme o POP (quente, morno ou frio), com uma justificativa curta.",
    input_schema: {
      type: "object",
      properties: {
        temperatura: { type: "string", enum: ["quente", "morno", "frio"] },
        justificativa: { type: "string" },
      },
      required: ["temperatura", "justificativa"],
    },
  },
  {
    name: "gerar_termo_relato",
    description:
      "Gera o Termo de Relato com os dados do dossiê e as palavras do cliente, e o exibe na tela para revisão e confirmação. Use quando as etapas 1 a 3 e o agendamento estiverem completos.",
    input_schema: { type: "object", properties: {} },
  },
];

const fmtData = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

export function montarTermo(caso: Caso, s: SiteSettings) {
  const d = caso.dossie;
  const dados = CAMPOS.filter((c) => d[c.key]).map((c) => `${c.label}: ${d[c.key]}`).join("\n");
  const falas = caso.conversa
    .filter((m) => m.role === "user" && !m.texto.startsWith("📎"))
    .map((m) => `[${fmtData(m.em)}] ${m.texto}`)
    .join("\n");
  const versao = (caso.termo?.versao ?? 0) + 1;
  const texto = `TERMO DE RELATO — versão ${versao}
${s.officeName} · ${s.lawyerName} · ${s.oab}
Caso ${caso.id} · gerado em ${fmtData(new Date().toISOString())}

Eu, ${d.nome ?? "(nome não informado)"}, declaro que as informações abaixo foram prestadas por mim, de forma livre e verdadeira, no atendimento inicial realizado pela assistente virtual do escritório, e que poderei complementá-las na consulta com o advogado.

1. DADOS INFORMADOS
${dados}

2. RELATO NAS MINHAS PALAVRAS (transcrição literal das mensagens, com data e hora)
${falas}

3. DOCUMENTOS ENVIADOS
${caso.documentos.length ? caso.documentos.map((x) => `- ${x.nome} (${x.tipo}) em ${fmtData(x.enviadoEm)}`).join("\n") : "- Nenhum documento enviado até o momento."}

Este termo não é contrato e não garante qualquer resultado. Ele registra o relato para análise pelo advogado responsável.`;
  return { versao, texto, geradoEm: new Date().toISOString(), hash: crypto.createHash("sha256").update(texto).digest("hex") };
}

export function faltantesTermo(caso: Caso) {
  return CAMPOS.filter((c) => "obrigatorio" in c && c.obrigatorio && (c.etapa <= 3 || c.etapa === 6) && !caso.dossie[c.key]).map(
    (c) => c.key,
  );
}

export async function notificarNovoLead(caso: Caso, s: SiteSettings, baseUrl: string) {
  if (caso.emails.novo_lead || !caso.dossie.nome || !caso.dossie.telefone) return;
  const tel = caso.dossie.telefone.replace(/\D/g, "");
  const ok = await enviarEmail(
    s.notifyEmail,
    `Novo contato no site: ${caso.dossie.nome}`,
    [
      ["Nome", caso.dossie.nome],
      ["Telefone", caso.dossie.telefone],
      ["E-mail", caso.dossie.email ?? "—"],
      ["Origem", caso.origem],
      ["Início do atendimento", fmtData(caso.criadoEm)],
    ],
    `<a href="https://wa.me/${tel.length <= 11 ? "55" + tel : tel}">Chamar no WhatsApp</a> · <a href="${baseUrl}/admin/casos/${caso.id}">Abrir no painel</a>`,
  );
  if (ok) caso.emails.novo_lead = new Date().toISOString();
}

export async function notificarConclusao(caso: Caso, s: SiteSettings, baseUrl: string) {
  if (caso.emails.concluido) return;
  const linhas: [string, string][] = [
    ["Temperatura", caso.temperatura ?? "—"],
    ...CAMPOS.filter((c) => caso.dossie[c.key]).map((c) => [c.label, caso.dossie[c.key]!] as [string, string]),
    ["Documentos enviados", caso.documentos.map((d) => d.nome).join(", ") || "nenhum"],
    ["Termo de relato", caso.termo?.aceitoEm ? `confirmado em ${fmtData(caso.termo.aceitoEm)}` : "pendente"],
  ];
  const ok = await enviarEmail(
    s.notifyEmail,
    `Atendimento concluído: ${caso.dossie.nome ?? caso.id}`,
    linhas,
    `<a href="${baseUrl}/admin/casos/${caso.id}">Abrir o dossiê completo no painel</a>`,
  );
  if (ok) caso.emails.concluido = new Date().toISOString();
}

function executarFerramenta(caso: Caso, s: SiteSettings, nome: string, input: Record<string, unknown>) {
  if (nome === "atualizar_dossie") {
    const campos = (input.campos ?? {}) as Record<string, unknown>;
    const aplicados = aplicarCampos(caso, campos, CHAVES);
    if (caso.dossie.agendamento_preferencia && caso.status === "atendimento_ia") caso.status = "reuniao_agendada";
    return { ok: true, registrados: aplicados };
  }
  if (nome === "classificar_lead") {
    const t = input.temperatura;
    if (t === "quente" || t === "morno" || t === "frio") {
      caso.temperatura = t;
      caso.temperaturaMotivo = String(input.justificativa ?? "").slice(0, 500);
      return { ok: true };
    }
    return { ok: false, erro: "temperatura inválida" };
  }
  if (nome === "gerar_termo_relato") {
    const faltam = faltantesTermo(caso);
    if (faltam.length) return { ok: false, erro: "Faltam campos obrigatórios antes do termo.", faltam };
    caso.termo = montarTermo(caso, s);
    return { ok: true, mensagem: "Termo exibido ao cliente para revisão e confirmação." };
  }
  return { ok: false, erro: "ferramenta desconhecida" };
}

/** Executa um turno do atendimento: recebe a mensagem do cliente e devolve a resposta da IA. */
export async function turno(caso: Caso, s: SiteSettings, apiKey: string, texto: string): Promise<string> {
  const agora = new Date().toISOString();
  caso.conversa.push({ role: "user", texto, em: agora });
  const messages = caso.apiMessages as BetaMessageParam[];
  messages.push({ role: "user", content: texto });

  const client = createClient(apiKey);
  let resposta = "";
  for (let i = 0; i < 6; i++) {
    const msg = await client.beta.messages.create({
      model: s.model,
      max_tokens: 16000,
      system: systemPrompt(s),
      output_config: { effort: s.effort },
      tools: TOOLS,
      messages,
      ...fallbackParams(s.model),
    });
    messages.push({ role: "assistant", content: msg.content } as BetaMessageParam);
    const textos = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text);
    if (textos.length) resposta = textos.join("\n").trim() || resposta;

    if (msg.stop_reason === "refusal") {
      resposta = "Não consigo seguir com esse assunto por aqui. Se preferir, fale direto com o escritório pelo WhatsApp.";
      break;
    }
    if (msg.stop_reason !== "tool_use") break;

    const resultados: BetaToolResultBlockParam[] = msg.content
      .filter((b) => b.type === "tool_use")
      .map((b) => {
        const tu = b as { id: string; name: string; input: unknown };
        const r = executarFerramenta(caso, s, tu.name, (tu.input ?? {}) as Record<string, unknown>);
        return { type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(r), is_error: !r.ok };
      });
    messages.push({ role: "user", content: resultados });
  }
  if (!resposta) resposta = "Anotei. Pode continuar, por favor.";
  caso.conversa.push({ role: "assistant", texto: resposta, em: new Date().toISOString() });
  return resposta;
}

export async function analisarCaso(caso: Caso, s: SiteSettings, apiKey: string) {
  const client = createClient(apiKey);
  const dados = CAMPOS.map((c) => `${c.label}: ${caso.dossie[c.key] ?? "(não informado)"}`).join("\n");
  const conversa = caso.conversa.map((m) => `${m.role === "user" ? "Cliente" : "IA"}: ${m.texto}`).join("\n");
  const msg = await client.beta.messages.create({
    model: s.model,
    max_tokens: 16000,
    output_config: { effort: "high" },
    system:
      "Você apoia o advogado de um escritório que atende vítimas de golpes pelo PIX. Faça uma TRIAGEM interna, não um parecer: não estime chance de êxito, não cite jurisprudência. Responda em português, em Markdown simples, com as seções: Resumo do caso; Lacunas (o que falta perguntar); Inconsistências ou pontos de atenção no relato; Documentos críticos pendentes; Perfil de uso × transação (a transação foge do padrão do cliente? por quê); Pontos a explorar na consulta.",
    messages: [
      {
        role: "user",
        content: `Dossiê:\n${dados}\n\nDocumentos enviados: ${caso.documentos.map((d) => `${d.tipo} (${d.nome})`).join(", ") || "nenhum"}\n\nConversa completa:\n${conversa}`,
      },
    ],
    ...fallbackParams(s.model),
  });
  if (msg.stop_reason === "refusal") throw new Error("A IA não conseguiu analisar este caso.");
  return msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n");
}

export { Anthropic };
