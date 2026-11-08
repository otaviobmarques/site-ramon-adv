/** Campos do dossiê, na ordem do roteiro do POP Comercial Fraude PIX. */
export const ETAPAS = [
  { id: 1, nome: "Identificação" },
  { id: 2, nome: "Relato" },
  { id: 3, nome: "Detalhes da fraude" },
  { id: 4, nome: "Hábitos de uso do PIX" },
  { id: 5, nome: "Documentos" },
  { id: 6, nome: "Agendamento" },
  { id: 7, nome: "Termo de relato" },
] as const;

export const CAMPOS = [
  // 1. Identificação
  { key: "nome", label: "Nome completo", etapa: 1, obrigatorio: true },
  { key: "telefone", label: "Telefone com DDD", etapa: 1, obrigatorio: true },
  { key: "email", label: "E-mail", etapa: 1, obrigatorio: true },
  { key: "cidade_uf", label: "Cidade/UF", etapa: 1 },
  // 2. Relato
  { key: "resumo_relato", label: "Resumo do que aconteceu", etapa: 2, obrigatorio: true },
  { key: "banco_pagador", label: "Banco do cliente (pagador)", etapa: 2, obrigatorio: true },
  { key: "tentou_resolver", label: "Já tentou resolver com o banco?", etapa: 2, obrigatorio: true },
  { key: "protocolo_banco", label: "Protocolo da reclamação no banco", etapa: 2 },
  { key: "data_reclamacao", label: "Data da reclamação no banco", etapa: 2 },
  { key: "documentos_que_possui", label: "Documentos que possui", etapa: 2 },
  { key: "como_conheceu", label: "Como conheceu o escritório", etapa: 2 },
  // 3. Detalhes da fraude
  { key: "valor", label: "Valor total transferido (R$)", etapa: 3, obrigatorio: true },
  { key: "data_fraude", label: "Data da fraude", etapa: 3, obrigatorio: true },
  { key: "hora_fraude", label: "Hora aproximada", etapa: 3 },
  { key: "como_ocorreu", label: "Como o golpe ocorreu", etapa: 3, obrigatorio: true },
  { key: "quem_fez_pix", label: "Quem fez o PIX (o cliente ou terceiro)", etapa: 3, obrigatorio: true },
  { key: "acesso_terceiros", label: "Terceiros tiveram acesso ao celular/conta?", etapa: 3 },
  { key: "celular_perdido_senha_notas", label: "Celular perdido/roubado com senha anotada?", etapa: 3 },
  { key: "senha_salva_navegador", label: "Senha salva no navegador?", etapa: 3 },
  { key: "impacto_sustento", label: "Impacto no sustento", etapa: 3 },
  { key: "banco_recebedor", label: "Banco recebedor", etapa: 3 },
  { key: "chave_pix_destino", label: "Chave PIX de destino", etapa: 3 },
  { key: "boletim_ocorrencia", label: "Boletim de ocorrência (fez? número)", etapa: 3 },
  { key: "med_solicitado", label: "MED solicitado ao banco? (protocolo)", etapa: 3 },
  // 4. Hábitos de uso do PIX
  { key: "pix_noturno", label: "Costuma fazer PIX à noite?", etapa: 4 },
  { key: "pix_fim_de_semana", label: "Costuma fazer PIX no fim de semana?", etapa: 4 },
  { key: "media_pix_6m", label: "Valor médio dos PIX nos últimos 6 meses", etapa: 4 },
  { key: "media_ted_6m", label: "Valor médio das TED nos últimos 6 meses", etapa: 4 },
  { key: "pix_anterior_mesma_chave", label: "Já tinha feito PIX para a mesma chave?", etapa: 4 },
  { key: "limite_pix", label: "Limite de PIX", etapa: 4 },
  { key: "aumento_limite", label: "Houve aumento de limite antes do golpe?", etapa: 4 },
  { key: "emprestimo_seguido_pix", label: "Houve empréstimo seguido de PIX?", etapa: 4 },
  // 6. Agendamento
  { key: "agendamento_modalidade", label: "Consulta: presencial ou vídeo", etapa: 6, obrigatorio: true },
  { key: "agendamento_preferencia", label: "Dia e horário de preferência", etapa: 6, obrigatorio: true },
] as const;

export type CampoKey = (typeof CAMPOS)[number]["key"];
export type Dossie = Partial<Record<CampoKey, string>>;

export const CHECKLIST_DOCUMENTOS = [
  { tipo: "documento_identidade", label: "Documento de identidade (RG ou CNH)" },
  { tipo: "comprovante_residencia", label: "Comprovante de residência" },
  { tipo: "comprovante_pix", label: "Comprovante(s) do PIX" },
  { tipo: "extrato", label: "Extrato bancário dos últimos 6 meses" },
  { tipo: "boletim_ocorrencia", label: "Boletim de ocorrência" },
  { tipo: "reclamacao_banco", label: "Protocolo/print da reclamação no banco" },
  { tipo: "prints_conversa", label: "Prints da conversa com o golpista" },
  { tipo: "outros", label: "Outros documentos" },
] as const;
export type TipoDocumento = (typeof CHECKLIST_DOCUMENTOS)[number]["tipo"];

export const STATUS = [
  { id: "atendimento_ia", label: "Em atendimento IA" },
  { id: "reuniao_agendada", label: "Reunião agendada" },
  { id: "contrato_notificacao", label: "Contrato / notificação" },
  { id: "analise_acao", label: "Análise de ação" },
  { id: "perdido", label: "Perdido" },
] as const;
export type Status = (typeof STATUS)[number]["id"];
export type Temperatura = "quente" | "morno" | "frio";

export function progresso(d: Dossie, docs: number, termoAceito: boolean) {
  return ETAPAS.map((e) => {
    if (e.id === 5) return { ...e, ok: docs > 0 };
    if (e.id === 7) return { ...e, ok: termoAceito };
    const obrig = CAMPOS.filter((c) => c.etapa === e.id && "obrigatorio" in c && c.obrigatorio);
    const todos = CAMPOS.filter((c) => c.etapa === e.id);
    const alvo = obrig.length ? obrig : todos;
    const ok = e.id === 4 ? todos.filter((c) => d[c.key]).length >= 4 : alvo.every((c) => d[c.key]);
    return { ...e, ok };
  });
}

/** Pontos de verificação para triagem de viabilidade (edite conforme o POP do escritório). */
export const VIABILIDADE = {
  pagador: [
    "Transação fora do perfil do cliente sem bloqueio ou confirmação adicional",
    "Aumento de limite liberado sem verificação reforçada",
    "Empréstimo contratado e transferido em seguida sem alerta",
    "Demora ou ausência de resposta ao pedido de MED",
    "Falha de segurança no app ou nos canais do banco",
  ],
  recebedor: [
    "Conta recebedora aberta com dados falsos ou de terceiros",
    "Conta com movimentação atípica (recebe e repassa rapidamente)",
    "Não bloqueou os valores após o MED",
    "Conta já usada em outras fraudes",
  ],
} as const;

export const FOLLOWUPS = [
  { id: "d3", dias: 3, titulo: "D+3", msg: (n: string) => `Olá, ${n}! Aqui é do escritório. Passando para saber se conseguiu reunir os documentos do seu caso e se podemos confirmar a sua consulta.` },
  { id: "d10", dias: 10, titulo: "D+10", msg: (n: string) => `Olá, ${n}! Tudo bem? Seu atendimento continua registrado conosco. Se quiser seguir com a análise do seu caso, é só responder esta mensagem para agendarmos.` },
  { id: "d30", dias: 30, titulo: "D+30", msg: (n: string) => `Olá, ${n}! Estamos encerrando os atendimentos em aberto deste mês. Se ainda tiver interesse em conversar com o advogado sobre o seu caso, responda esta mensagem.` },
] as const;

export function parseValor(v?: string): number | null {
  if (!v) return null;
  const m = v.replace(/[^\d,.-]/g, "");
  if (!m) return null;
  const n = Number(m.includes(",") ? m.replace(/\./g, "").replace(",", ".") : m);
  return Number.isFinite(n) ? n : null;
}

/** Aceita AAAA-MM-DD, DD/MM/AAAA ou ISO completo. */
export function paraData(v: string) {
  const br = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) return new Date(`${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}T12:00:00`);
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? v + "T12:00:00" : v);
}

export function somarDias(iso: string, dias: number) {
  const d = paraData(iso);
  d.setDate(d.getDate() + dias);
  return d;
}

export function somarDiasUteis(iso: string, dias: number) {
  const d = paraData(iso);
  let n = 0;
  while (n < dias) {
    d.setDate(d.getDate() + 1);
    const w = d.getDay();
    if (w !== 0 && w !== 6) n++;
  }
  return d;
}
