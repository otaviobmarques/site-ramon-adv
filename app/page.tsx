import ChatWidget from "@/components/ChatWidget";
import { getSettings, publicView } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const s = publicView(await getSettings());
  const wa = `https://wa.me/${s.whatsapp}?text=${encodeURIComponent("Olá! Gostaria de agendar um atendimento.")}`;

  return (
    <>
      <header className="nav">
        <div className="container nav-inner">
          <a href="#inicio" className="brand">
            <span className="brand-mark">⚖</span> {s.officeName}
          </a>
          <nav className="nav-links">
            <a href="#areas">Áreas</a>
            <a href="#sobre">Sobre</a>
            <a href="#contato">Contato</a>
            <a href={wa} className="btn btn-gold btn-sm" target="_blank" rel="noopener noreferrer">
              Agendar
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section id="inicio" className="hero">
          <div className="container hero-inner">
            <p className="eyebrow">{s.lawyerName} · {s.oab}</p>
            <h1>{s.tagline}</h1>
            <p className="lead">{s.about}</p>
            <div className="hero-actions">
              <a href={wa} className="btn btn-gold" target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
              {s.chatAvailable && (
                <a href="#chat" className="btn btn-outline" data-open-chat>
                  Tirar dúvidas com o assistente
                </a>
              )}
            </div>
          </div>
        </section>

        <section id="areas" className="section">
          <div className="container">
            <p className="eyebrow dark">Atuação</p>
            <h2>Áreas de atuação</h2>
            <div className="grid">
              {s.practiceAreas.map((area) => (
                <article key={area} className="card">
                  <span className="card-icon">§</span>
                  <h3>{area}</h3>
                  <p>Consultoria preventiva e atuação judicial e extrajudicial, com acompanhamento próximo de cada etapa.</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="sobre" className="section alt">
          <div className="container about">
            <div>
              <p className="eyebrow dark">O escritório</p>
              <h2>Compromisso com o seu direito</h2>
              <p>{s.about}</p>
            </div>
            <ul className="values">
              <li><strong>Atendimento humano</strong><span>Você fala diretamente com o advogado responsável.</span></li>
              <li><strong>Transparência</strong><span>Explicações claras sobre riscos, prazos e custos.</span></li>
              <li><strong>Agilidade</strong><span>Assistente virtual 24h para dúvidas iniciais e agendamento.</span></li>
            </ul>
          </div>
        </section>

        <section id="contato" className="section">
          <div className="container contact">
            <div>
              <p className="eyebrow dark">Contato</p>
              <h2>Agende seu atendimento</h2>
              <p>Atendimento presencial e on-line.</p>
            </div>
            <dl className="contact-list">
              <div><dt>WhatsApp</dt><dd><a href={wa} target="_blank" rel="noopener noreferrer">Enviar mensagem</a></dd></div>
              <div><dt>Telefone</dt><dd>{s.phone}</dd></div>
              <div><dt>E-mail</dt><dd><a href={`mailto:${s.email}`}>{s.email}</a></dd></div>
              <div><dt>Endereço</dt><dd>{s.address}</dd></div>
            </dl>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} {s.officeName} · {s.oab}</p>
          <p className="muted">
            As respostas do assistente virtual são informativas e não substituem a consulta com um advogado.
          </p>
        </div>
      </footer>

      {s.chatAvailable && (
        <ChatWidget assistantName={s.assistantName} welcomeMessage={s.welcomeMessage} whatsappUrl={wa} />
      )}
    </>
  );
}
