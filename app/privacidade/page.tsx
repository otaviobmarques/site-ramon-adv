import Link from "next/link";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Política de privacidade" };

export default async function Privacidade() {
  const s = await getSettings();
  return (
    <main className="doc-page">
      <div className="doc">
        <Link href="/" className="back">← Voltar</Link>
        <h1>Política de privacidade</h1>
        <p>Esta política explica como o escritório {s.officeName} ({s.lawyerName}, {s.oab}) trata os dados pessoais coletados no atendimento on-line, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>
        <h2>Quais dados coletamos</h2>
        <p>Nome, telefone, e-mail, cidade, o relato do ocorrido, dados da transação (valor, data, bancos, chave PIX), hábitos de uso do PIX informados por você e os documentos que você enviar. Não coletamos senhas, tokens, códigos de verificação nem dados completos de cartão.</p>
        <h2>Para que usamos</h2>
        <p>Exclusivamente para organizar o atendimento, preparar a consulta com o advogado e, se você contratar o escritório, conduzir o seu caso. Os dados não são vendidos nem compartilhados para publicidade.</p>
        <h2>Inteligência artificial</h2>
        <p>O atendimento inicial é conduzido por uma assistente virtual de inteligência artificial (modelo Claude, da Anthropic), que processa as mensagens para organizar o dossiê. A análise jurídica é sempre feita pelo advogado.</p>
        <h2>Armazenamento e segurança</h2>
        <p>Os dados ficam em armazenamento privado, com acesso restrito ao escritório por login. Guardamos as informações pelo tempo necessário ao atendimento e às obrigações legais e profissionais.</p>
        <h2>Seus direitos</h2>
        <p>Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento pelo e-mail <a href={`mailto:${s.email}`}>{s.email}</a> ou pelo WhatsApp {s.phone}.</p>
      </div>
    </main>
  );
}
