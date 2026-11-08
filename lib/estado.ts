import type { Caso } from "./cases";
import { progresso } from "./dossie";

/** O que o cliente pode ver do próprio caso. */
export function estadoCliente(c: Caso) {
  return {
    id: c.id,
    conversa: c.conversa.map(({ role, texto }) => ({ role, texto })),
    progresso: progresso(c.dossie, c.documentos.length, Boolean(c.termo?.aceitoEm)),
    documentos: c.documentos.map(({ id, tipo, nome }) => ({ id, tipo, nome })),
    termo: c.termo ? { versao: c.termo.versao, texto: c.termo.texto, hash: c.termo.hash, aceito: Boolean(c.termo.aceitoEm) } : null,
  };
}
export type EstadoCliente = ReturnType<typeof estadoCliente>;
