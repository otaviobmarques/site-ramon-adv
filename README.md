# Ramon Advocacia — atendimento com IA para vítimas de fraude PIX

Implementação do MVP descrito na *Especificação funcional do Sistema de Atendimento com IA para Vítimas de Fraude PIX* (baseada no POP Comercial Fraude PIX).

## Páginas

| Rota | O que é |
|---|---|
| `/` | Site do escritório (moderno, com animações), orientações imediatas, FAQ e contato |
| `/atendimento` | Atendimento com a assistente de IA: consentimento LGPD → roteiro do POP em 7 etapas → upload de documentos → Termo de Relato |
| `/privacidade` | Política de privacidade (LGPD) |
| `/admin` | Painel do escritório (login): funil com arrastar e soltar, filtro por temperatura e indicadores |
| `/admin/casos/[id]` | Dossiê, documentos (checklist + cobrança pronta), prazos de notificação, viabilidade, honorários, follow-up D+3/D+10/D+30, análise IA e conversa completa |
| `/admin/configuracoes` | Chave de IA, modelo, contatos (WhatsApp, telefone, e-mail), e-mail que recebe os contatos, textos do site |

## Como a IA trabalha

- Claude (Anthropic) com ferramentas: `atualizar_dossie`, `classificar_lead` e `gerar_termo_relato` (`lib/atendimento.ts`).
- Regras do Provimento 205/2021 e da LGPD no prompt: apresenta-se como IA, não promete resultado, não fala de honorários, nunca pede senha, orienta o MED em golpes recentes.
- O Termo de Relato traz os dados do dossiê e a transcrição literal das mensagens do cliente, com data/hora e hash SHA-256. O cliente confirma digitando o nome completo (registro de data, hora e IP).

## E-mails

A cada contato o escritório recebe e-mail (via Resend) em dois momentos: **novo lead** (quando nome e telefone são informados) e **atendimento concluído** (termo confirmado, com o dossiê completo). Exige `RESEND_API_KEY` e `EMAIL_FROM`. Sem elas, tudo continua disponível no funil.

## Variáveis de ambiente (Vercel)

| Variável | Uso |
|---|---|
| `ADMIN_USER` / `ADMIN_PASSWORD` | Login do painel |
| `SESSION_SECRET` | Assina a sessão e criptografa a chave de IA. **Não altere** depois de cadastrar a chave |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (privado): configurações, casos e documentos |
| `RESEND_API_KEY`, `EMAIL_FROM` | Envio dos e-mails de contato (ex.: `Site Ramon Advocacia <site@seudominio.com.br>`) |
| `ANTHROPIC_API_KEY` | Opcional: chave reserva caso nenhuma seja cadastrada no painel |

## Desenvolvimento

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sem `BLOB_READ_WRITE_TOKEN`, os dados ficam em `.data/` (ignorado pelo git).

## Fora deste MVP (fases 2 e 3 da especificação)

WhatsApp (Domma Chat), transcrição de áudio, leitura automática de documentos, agenda/lembretes automáticos, assinatura eletrônica com certificadora (ZapSign/Clicksign/D4Sign), integração com Goalfy, relatórios por origem.
