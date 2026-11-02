const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** URL-safe random id; 12 base62 chars is ~71 bits. */
export function newId(length = 12): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  // 62 * 4 = 248, so rejecting bytes >= 248 keeps the distribution uniform.
  for (let i = 0; out.length < length; i++) {
    if (i >= bytes.length) {
      crypto.getRandomValues(bytes);
      i = 0;
    }
    if (bytes[i] < 248) out += ALPHABET[bytes[i] % 62];
  }
  return out;
}
