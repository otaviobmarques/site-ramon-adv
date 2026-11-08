import Link from "next/link";
import Faq from "@/components/Faq";
import HeroChat from "@/components/HeroChat";
import Reveal from "@/components/Reveal";
import { getSettings, publicView } from "@/lib/settings";

export const dynamic = "force-dynamic";

const PASSOS = [
  { n: "01", t: "Conte o que aconteceu", d: "Nossa assistente com IA faz as perguntas certas, uma de cada vez, a qualquer hora do dia." },
  { n: "02", t: "Envie seus documentos", d: "Comprovantes, extrato, BO e prints, direto pelo chat, com orientação sobre cada um." },
  { n: "03", t: "Confirme o seu relato", d: "Você revisa e confirma o Termo de Relato com as suas próprias palavras, com data e hora." },
  { n: "04", t: "Consulta com o advogado", d: "O advogado recebe o dossiê completo e conversa com você, presencialmente ou por vídeo." },
];

const AGORA = [
  { i: "⚡", t: "Peça o MED ao seu banco", d: "O Mecanismo Especial de Devolução do PIX deve ser solicitado o quanto antes, pelo app ou central do banco. Anote o protocolo." },
  { i: "📄", t: "Registre o boletim de ocorrência", d: "Muitos estados permitem fazer o BO pela delegacia on-line. Guarde o número e o arquivo." },
  { i: "📸", t: "Guarde todas as provas", d: "Comprovantes do PIX, extratos e prints das conversas com data, hora e o número ou perfil do golpista." },
  { i: "🔒", t: "Proteja suas contas", d: "Troque senhas, ative a verificação em duas etapas e nunca informe senhas ou códigos a ninguém." },
];

const FAQ = [
  { p: "Quem vai me atender?", r: "O primeiro atendimento é feito por uma assistente virtual com inteligência artificial, que organiza as informações do seu caso. A análise, a orientação jurídica e qualquer decisão são sempre do advogado, na consulta." },
  { p: "A assistente vai pedir minhas senhas?", r: "Nunca. O escritório não pede senhas, tokens, códigos de verificação ou dados completos de cartão, em nenhum canal. Se alguém pedir em nosso nome, desconfie." },
  { p: "Meus dados ficam seguros?", r: "Sim. Só pedimos o necessário para o atendimento, com o seu consentimento, em armazenamento privado e com acesso restrito ao escritório, conforme a LGPD. Você pode pedir a exclusão a qualquer momento." },
  { p: "Preciso ter todos os documentos agora?", r: "Não. Envie o que tiver. A assistente explica o que falta e você pode completar depois, até a consulta." },
  { p: "Quanto custa?", r: "Valores e condições são apresentados somente pelo advogado, na consulta, depois de entender o seu caso." },
];

export default async function Home() {
  const s = publicView(await getSettings());
  const wa = `https://wa.me/${s.whatsapp}?text=${encodeURIComponent("Olá! Gostaria de falar sobre um golpe do PIX.")}`;
  const cta = s.chatAvailable ? "/atendimento" : wa;

  return (
    <>
      <Reveal />
      <header className="nav">
        <div className="container nav-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">R</span>
            <span>{s.officeName}</span>
          </Link>
          <nav className="nav-links">
            <a href="#como-funciona">Como funciona</a>
            <a href="#o-que-fazer">O que fazer agora</a>
            <a href="#duvidas">Dúvidas</a>
            <a href="#contato">Contato</a>
            <Link href={cta} className="btn btn-primary btn-sm">Iniciar atendimento</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-bg" aria-hidden="true"><span className="blob b1" /><span className="blob b2" /><span className="blob b3" /><span className="grid-lines" /></div>
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="chip" data-reveal><span className="pulse" /> Atendimento on-line 24 horas</p>
              <h1 data-reveal style={{ "--d": "80ms" } as React.CSSProperties}>
                Caiu em um <span className="grad">golpe pelo PIX</span>? Entenda seus direitos.
              </h1>
              <p className="lead" data-reveal style={{ "--d": "160ms" } as React.CSSProperties}>{s.about}</p>
              <div className="hero-actions" data-reveal style={{ "--d": "240ms" } as React.CSSProperties}>
                <Link href={cta} className="btn btn-primary btn-lg">Começar meu atendimento <span className="arrow">→</span></Link>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-lg">Falar no WhatsApp</a>
              </div>
              <ul className="hero-trust" data-reveal style={{ "--d": "320ms" } as React.CSSProperties}>
                <li>✓ Sem pedir senhas</li>
                <li>✓ Dados protegidos (LGPD)</li>
                <li>✓ {s.lawyerName} · {s.oab}</li>
              </ul>
            </div>
            <div data-reveal className="reveal-scale" style={{ "--d": "200ms" } as React.CSSProperties}>
              <HeroChat nome={s.assistantName} />
            </div>
          </div>
        </section>

        <section className="band">
          <div className="marquee" aria-hidden="true">
            <div>
              {[...Array(2)].map((_, k) => (
                <span key={k}>Falso funcionário do banco · Falsa central · Golpe do WhatsApp clonado · Falso leilão · Golpe do Pix agendado · Celular roubado · Empréstimo não reconhecido · Falsa venda on-line ·&nbsp;</span>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="section">
          <div className="container">
            <div className="section-head" data-reveal>
              <p className="eyebrow">Como funciona</p>
              <h2>Do primeiro contato à consulta, sem burocracia</h2>
            </div>
            <div className="steps">
              {PASSOS.map((p, i) => (
                <article key={p.n} className="step" data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
                  <span className="step-n">{p.n}</span>
                  <h3>{p.t}</h3>
                  <p>{p.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="o-que-fazer" className="section dark">
          <div className="container">
            <div className="section-head" data-reveal>
              <p className="eyebrow">Acabou de acontecer?</p>
              <h2>O que fazer agora</h2>
              <p className="muted-inv">Orientações gerais e imediatas. Cada caso é analisado individualmente pelo advogado.</p>
            </div>
            <div className="cards">
              {AGORA.map((c, i) => (
                <article key={c.t} className="glass" data-reveal style={{ "--d": `${i * 80}ms` } as React.CSSProperties}>
                  <span className="glass-icon">{c.i}</span>
                  <h3>{c.t}</h3>
                  <p>{c.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container split">
            <div data-reveal>
              <p className="eyebrow">Áreas de atuação</p>
              <h2>Foco em fraudes bancárias</h2>
              <p className="muted">{s.tagline}</p>
              <div className="tags">
                {s.practiceAreas.map((a) => <span key={a} className="tag">{a}</span>)}
              </div>
            </div>
            <div className="stats" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
              <div><strong>24h</strong><span>atendimento inicial on-line</span></div>
              <div><strong>7</strong><span>etapas organizadas no dossiê</span></div>
              <div><strong>100%</strong><span>do relato registrado com data e hora</span></div>
              <div><strong>0</strong><span>senhas solicitadas</span></div>
            </div>
          </div>
        </section>

        <section id="duvidas" className="section alt">
          <div className="container narrow-c">
            <div className="section-head center" data-reveal>
              <p className="eyebrow">Dúvidas frequentes</p>
              <h2>Perguntas comuns</h2>
            </div>
            <Faq itens={FAQ} />
          </div>
        </section>

        <section id="contato" className="section">
          <div className="container">
            <div className="cta-box" data-reveal>
              <div>
                <h2>Vamos organizar o seu caso?</h2>
                <p>Leva poucos minutos. Ao final, o advogado recebe tudo pronto para a sua consulta.</p>
              </div>
              <Link href={cta} className="btn btn-light btn-lg">Iniciar atendimento <span className="arrow">→</span></Link>
            </div>
            <div className="contact-grid">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="contact-card" data-reveal>
                <span>WhatsApp</span><strong>{s.phone}</strong>
              </a>
              <a href={`tel:+${s.whatsapp}`} className="contact-card" data-reveal style={{ "--d": "80ms" } as React.CSSProperties}>
                <span>Telefone</span><strong>{s.phone}</strong>
              </a>
              <a href={`mailto:${s.email}`} className="contact-card" data-reveal style={{ "--d": "160ms" } as React.CSSProperties}>
                <span>E-mail</span><strong>{s.email}</strong>
              </a>
              <div className="contact-card" data-reveal style={{ "--d": "240ms" } as React.CSSProperties}>
                <span>Atendimento</span><strong>{s.officeHours}</strong>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <strong>{s.officeName}</strong>
            <p>{s.lawyerName} · {s.oab}</p>
            <p>{s.address}</p>
          </div>
          <div className="footer-links">
            <Link href="/privacidade">Política de privacidade</Link>
            <Link href="/admin">Área do escritório</Link>
          </div>
        </div>
        <div className="container">
          <p className="fine">
            Conteúdo informativo, em conformidade com o Provimento 205/2021 da OAB. A assistente virtual usa inteligência
            artificial, não presta consultoria jurídica e não substitui a análise do advogado.
          </p>
        </div>
      </footer>

      <a href={wa} target="_blank" rel="noopener noreferrer" className="wa-fab" aria-label="Falar no WhatsApp">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"/></svg>
      </a>
    </>
  );
}
