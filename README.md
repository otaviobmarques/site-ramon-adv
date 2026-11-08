# Site Ramon Advocacia — com assistente de IA

Site institucional (Next.js) com **assistente virtual de IA (Claude, da Anthropic)** e um **portal administrativo** em `/admin` onde o escritório cadastra a chave de IA e edita os textos do site.

## O que tem

- **Site** (`/`): apresentação, áreas de atuação, sobre, contato, botão de WhatsApp.
- **Chat com IA**: balão flutuante que responde dúvidas gerais em tempo real (streaming), com regras éticas para advocacia (não promete resultado, não informa honorários, encaminha ao WhatsApp).
- **Portal** (`/admin`, protegido por senha):
  - cadastrar / trocar / remover a **chave de API da Anthropic** (guardada criptografada com AES-256-GCM; nunca é exibida de novo);
  - botão **Testar conexão**;
  - escolher modelo (Opus 5.5, Sonnet 5.5, Haiku 5.5) e nível de esforço;
  - ligar/desligar o chat, nome do assistente, mensagem de boas-vindas e instruções extras para a IA;
  - editar nome do escritório, OAB, telefone, WhatsApp, e-mail, endereço, textos e áreas de atuação.

## Deploy na Vercel

1. Importe este repositório em **vercel.com/new**.
2. Em **Settings → Environment Variables**, crie:
   - `ADMIN_USER` (padrão `Admin`) e `ADMIN_PASSWORD` — login do portal;
   - `SESSION_SECRET` — texto aleatório longo (ex.: `openssl rand -hex 32`). **Não troque depois**: ele também descriptografa a chave salva.
3. Em **Storage → Create → Blob**, crie um Blob Store e conecte ao projeto (isso cria `BLOB_READ_WRITE_TOKEN` automaticamente). É onde as configurações do portal ficam salvas.
4. Faça o redeploy, acesse `https://SEU-SITE.vercel.app/admin`, entre com a senha e cole a chave `sk-ant-...` (crie em https://platform.claude.com/settings/keys).

Opcional: `ANTHROPIC_API_KEY` como variável de ambiente serve de chave reserva caso nenhuma seja cadastrada no portal.

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha ADMIN_PASSWORD e SESSION_SECRET
npm run dev
```

Sem `BLOB_READ_WRITE_TOKEN`, as configurações ficam em `.data/settings.json` (ignorado pelo git).

## Estrutura

```
app/page.tsx                 site
app/admin/page.tsx           portal
app/api/chat                 chat com IA (streaming)
app/api/admin/*              login, logout, configurações, teste da chave
components/                  ChatWidget, AdminLogin, AdminPanel
lib/settings.ts              armazenamento (Vercel Blob / arquivo local)
lib/claude.ts                prompt do assistente e cliente da Anthropic
lib/crypto.ts, lib/auth.ts   criptografia e sessão do admin
```
