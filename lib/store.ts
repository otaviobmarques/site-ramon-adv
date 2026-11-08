import { promises as fs } from "node:fs";
import path from "node:path";
import { del, get, list, put } from "@vercel/blob";

/** Armazenamento privado: Vercel Blob em produção, pasta .data/ em desenvolvimento. */
const LOCAL_ROOT = path.join(process.cwd(), ".data");

export function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function localPath(p: string) {
  const full = path.join(LOCAL_ROOT, p);
  if (!full.startsWith(LOCAL_ROOT)) throw new Error("Caminho inválido");
  return full;
}

function assertWritable() {
  if (!useBlob() && process.env.VERCEL) {
    throw new Error("Conecte um Vercel Blob Store ao projeto para salvar dados.");
  }
}

export async function readText(p: string): Promise<string | null> {
  try {
    if (useBlob()) {
      const res = await get(p, { access: "private", useCache: false });
      if (!res || res.statusCode !== 200) return null;
      return await new Response(res.stream).text();
    }
    return await fs.readFile(localPath(p), "utf8");
  } catch (err) {
    const e = err as { code?: string; name?: string };
    if (e?.code !== "ENOENT" && e?.name !== "BlobNotFoundError") console.error("readText", p, err);
    return null;
  }
}

export async function readJSON<T>(p: string): Promise<T | null> {
  const t = await readText(p);
  return t ? (JSON.parse(t) as T) : null;
}

export async function writeFile(p: string, body: string | Buffer | ArrayBuffer, contentType: string) {
  assertWritable();
  if (useBlob()) {
    await put(p, body as Buffer, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      cacheControlMaxAge: 60,
    });
    return;
  }
  const full = localPath(p);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, typeof body === "string" ? body : Buffer.from(body as ArrayBuffer));
}

export async function writeJSON(p: string, data: unknown) {
  await writeFile(p, JSON.stringify(data), "application/json");
}

export async function readFile(p: string): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string } | null> {
  if (useBlob()) {
    const res = await get(p, { access: "private" });
    if (!res || res.statusCode !== 200) return null;
    return { stream: res.stream, contentType: res.blob.contentType };
  }
  try {
    const buf = await fs.readFile(localPath(p));
    return { stream: new Response(buf).body!, contentType: "application/octet-stream" };
  } catch {
    return null;
  }
}

export async function listPaths(prefix: string): Promise<string[]> {
  if (useBlob()) {
    const out: string[] = [];
    let cursor: string | undefined;
    do {
      const res = await list({ prefix, cursor, limit: 1000 });
      out.push(...res.blobs.map((b) => b.pathname));
      cursor = res.hasMore ? res.cursor : undefined;
    } while (cursor);
    return out;
  }
  const root = localPath(prefix);
  const out: string[] = [];
  async function walk(dir: string) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else out.push(path.relative(LOCAL_ROOT, full).split(path.sep).join("/"));
    }
  }
  await walk(root.endsWith("/") ? root : path.dirname(root + "x"));
  return out.filter((p) => p.startsWith(prefix));
}

export async function deletePrefix(prefix: string) {
  const paths = await listPaths(prefix);
  if (!paths.length) return;
  if (useBlob()) await del(paths);
  else await Promise.all(paths.map((p) => fs.rm(localPath(p), { force: true })));
}
