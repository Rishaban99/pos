async function digest(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPassword(password: string): Promise<string> {
  return digest(password);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const hash = await digest(password);
  return hash === passwordHash;
}
