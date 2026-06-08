import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey() {
  const rawKey = process.env.TOKEN_ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error("TOKEN_ENCRYPTION_KEY is required to encrypt Threads access tokens.");
  }

  const isHex = /^[a-fA-F0-9]{64}$/.test(rawKey);
  const key = isHex ? Buffer.from(rawKey, "hex") : Buffer.from(rawKey, "base64");

  if (key.length !== 32) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes. Use 64 hex chars or a base64 32-byte key.",
    );
  }

  return key;
}

export function encryptSecret(plainText: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
}

export function decryptSecret(cipherText: string): string {
  const key = getEncryptionKey();
  const payload = Buffer.from(cipherText, "base64url");
  const iv = payload.subarray(0, IV_LENGTH);
  const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
