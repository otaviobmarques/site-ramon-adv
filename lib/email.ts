import { Resend } from "resend";

export function emailConfigurado() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function enviarEmail(para: string, assunto: string, linhas: [string, string][], rodape?: string) {
  if (!emailConfigurado() || !para) {
    console.warn("E-mail não enviado (RESEND_API_KEY/EMAIL_FROM ou destinatário ausente):", assunto);
    return false;
  }
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;color:#1d2433">
<h2 style="color:#0f1d33">${esc(assunto)}</h2>
<table style="border-collapse:collapse;width:100%">${linhas
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;color:#5d6677;width:40%;vertical-align:top">${esc(k)}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;white-space:pre-wrap">${esc(v)}</td></tr>`,
    )
    .join("")}</table>${rodape ? `<p style="margin-top:20px">${rodape}</p>` : ""}</div>`;
  const text = `${assunto}\n\n${linhas.map(([k, v]) => `${k}: ${v}`).join("\n")}`;
  try {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.EMAIL_FROM!,
      to: [para],
      subject: assunto,
      html,
      text,
    });
    if (error) {
      console.error("Falha no envio de e-mail:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Falha no envio de e-mail:", err);
    return false;
  }
}
