// share-link.ts: encodes the playground state into a URL fragment and reads it back, so a link
// restores the same effect with no server. Format: `#v1.<data>`, where data is the JSON payload
// compressed with deflate-raw (the browser's CompressionStream) and written as base64url.

/** The fragment prefix of the current format. A later format gets a new number. */
export const SHARE_PREFIX = "v1.";

/**
 * The most text a link's data may hold, and the most JSON it may inflate to. Real payloads are a
 * few hundred characters; the limits stop a hostile link from inflating to megabytes.
 */
export const SHARE_LIMITS = { data: 8_000, json: 64_000 } as const;

/**
 * What a link carries. `content` is optional, so links made before it existed stay valid.
 */
export interface SharePayload {
  /** The settings object, unchecked: the settings store's `load` checks and clamps it. */
  settings: unknown;
  /** The preview content (image ratio), unchecked: the content store's `load` checks it. */
  content?: unknown;
}

/** Why a link could not be read. */
export type ShareError = "invalid" | "newer";

/** The result of {@link decodeShareLink}. */
export type ShareDecodeResult =
  { ok: true; payload: SharePayload } | { ok: false; error: ShareError };

/**
 * Writes bytes as base64url (RFC 4648 section 5, without padding), which needs no escaping in a
 * URL fragment.
 *
 * @param bytes - The bytes.
 * @returns The text.
 */
function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Reads base64url text back into bytes.
 *
 * @param text - The text, without padding.
 * @returns The bytes, or `null` when the text is not base64url.
 */
function fromBase64Url(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return null;
  try {
    const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    // atob throws on a length that no padding can fix (one character over a group of four).
    return null;
  }
}

/**
 * Runs bytes through a compression or decompression stream and collects the output, stopping
 * once it grows past `limit` bytes.
 *
 * @param bytes - The input.
 * @param stream - A CompressionStream or DecompressionStream.
 * @param limit - The most output bytes to accept.
 * @returns The output, or `null` when it would pass the limit.
 */
async function pipe(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
  limit: number,
): Promise<Uint8Array | null> {
  const writer = stream.writable.getWriter();
  // Writing and closing are not awaited here: the stream only makes progress while it is read,
  // so awaiting them first could wait forever. Their rejections surface through the reader.
  writer.write(bytes as Uint8Array<ArrayBuffer>).catch(() => {});
  writer.close().catch(() => {});
  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/**
 * Encodes a payload as a link fragment.
 *
 * @param payload - What the link carries.
 * @returns The fragment, starting with `#`.
 */
export async function encodeShareLink(payload: SharePayload): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(payload));
  // The output of deflate is never much larger than its input, so the limit is never reached.
  const packed = await pipe(json, new CompressionStream("deflate-raw"), Infinity);
  return `#${SHARE_PREFIX}${toBase64Url(packed!)}`;
}

/**
 * Reads a link fragment back. Every failure (wrong prefix, bad base64url, data that does not
 * inflate, JSON that does not parse or has no settings object, data past {@link SHARE_LIMITS})
 * is `invalid`, except a later format number, which is `newer`. The settings inside are not
 * checked here; pass them to the settings store's `load`.
 *
 * @param hash - The fragment, with or without the leading `#`.
 * @returns The payload, or why it could not be read.
 */
export async function decodeShareLink(hash: string): Promise<ShareDecodeResult> {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!fragment.startsWith(SHARE_PREFIX)) {
    // A link from a later version: `v2.` and so on.
    const version = /^v(\d+)\./.exec(fragment);
    return { ok: false, error: version && Number(version[1]) > 1 ? "newer" : "invalid" };
  }
  const data = fragment.slice(SHARE_PREFIX.length);
  if (data.length === 0 || data.length > SHARE_LIMITS.data) return { ok: false, error: "invalid" };
  const bytes = fromBase64Url(data);
  if (!bytes) return { ok: false, error: "invalid" };
  let payload: unknown;
  try {
    const json = await pipe(bytes, new DecompressionStream("deflate-raw"), SHARE_LIMITS.json);
    if (!json) return { ok: false, error: "invalid" };
    payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(json));
  } catch {
    // Corrupt deflate data, text that is not UTF-8, or JSON that does not parse.
    return { ok: false, error: "invalid" };
  }
  const { settings, content } = (payload ?? {}) as { settings?: unknown; content?: unknown };
  if (typeof settings !== "object" || settings === null || Array.isArray(settings)) {
    return { ok: false, error: "invalid" };
  }
  return { ok: true, payload: content === undefined ? { settings } : { settings, content } };
}

/**
 * The full link for the current page with a fragment, without the page's query (a `?preset`
 * frame request would win over the link when opened).
 *
 * @param location - The page location, such as `window.location`.
 * @param fragment - The fragment from {@link encodeShareLink}.
 * @returns The URL text.
 */
export function shareUrl(location: Pick<Location, "origin" | "pathname">, fragment: string) {
  return `${location.origin}${location.pathname}${fragment}`;
}
