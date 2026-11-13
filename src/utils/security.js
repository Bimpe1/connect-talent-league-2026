/**
 * Security & Password Hashing Utilities using Web Crypto API (SHA-256)
 */

export async function hashPassword(plainText) {
  if (!plainText) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(plainText, storedHash) {
  if (!plainText || !storedHash) return false;
  const computed = await hashPassword(plainText);
  return computed.toLowerCase() === storedHash.toLowerCase();
}
