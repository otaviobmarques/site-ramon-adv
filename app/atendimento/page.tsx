import type { Metadata } from "next";
import Atendimento from "@/components/Atendimento";
import { CHECKLIST_DOCUMENTOS } from "@/lib/dossie";
import { getSettings, publicView } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Atendimento on-line", robots: { index: false } };

export default async function Page() {
  const s = publicView(await getSettings());
  return (
    <Atendimento
      disponivel={s.chatAvailable}
      assistente={s.assistantName}
      escritorio={s.officeName}
      whatsapp={s.whatsapp}
      checklist={CHECKLIST_DOCUMENTOS.map((d) => ({ ...d }))}
    />
  );
}
