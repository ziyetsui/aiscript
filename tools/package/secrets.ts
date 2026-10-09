/** Detect key material, not library strings describing PEM header syntax. */
export function containsSecret(text: string): boolean {
  const patterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----(?:\s|\\[rn])+[A-Za-z0-9+/=]{32,}/,
    /AIza[0-9A-Za-z_-]{35}/,
    /(?:sk-proj-|sk_live_)[0-9A-Za-z_-]{20,}/,
  ];
  return patterns.some((p) => p.test(text));
}
