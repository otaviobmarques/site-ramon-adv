import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const display = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
const descricao = "Atendimento on-line para vítimas de golpes e fraudes pelo PIX. Organize seu caso com nossa assistente virtual e fale com o advogado.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Ramon Advocacia",
    title: "Caiu em um golpe pelo PIX? Entenda seus direitos.",
    description: descricao,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "Caiu em um golpe pelo PIX? Entenda seus direitos.", description: descricao },
  title: { default: "Ramon Advocacia · Golpes e fraudes pelo PIX", template: "%s · Ramon Advocacia" },
  description: descricao,
};
export const viewport: Viewport = { themeColor: "#07111f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
