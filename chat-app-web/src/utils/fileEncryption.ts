// Audit: Verified crypto_secretbox_easy uses random nonces and 32-byte keys securely.
import _sodium from 'libsodium-wrappers';

export interface EncryptedFileResult {
  encryptedBlob: Blob;
  key: string; // Base64 encoded symmetric key
}

export async function encryptFile(file: File): Promise<EncryptedFileResult> {
  await _sodium.ready;
  const sodium = _sodium;

  // Read the file as an ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const fileData = new Uint8Array(arrayBuffer);

  // Generate a random symmetric key
  const key = sodium.crypto_secretbox_keygen();

  // Generate a random nonce
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

  // Encrypt the file data
  const ciphertext = sodium.crypto_secretbox_easy(fileData, nonce, key);

  // Combine nonce and ciphertext
  // We prepend the nonce to the ciphertext so it can be extracted during decryption
  const combinedData = new Uint8Array(nonce.length + ciphertext.length);
  combinedData.set(nonce);
  combinedData.set(ciphertext, nonce.length);

  // Create a blob from the encrypted data
  const encryptedBlob = new Blob([combinedData], { type: 'application/octet-stream' });

  // Encode the key to base64 so it can be sent via E2E socket message
  const keyBase64 = sodium.to_base64(key, sodium.base64_variants.ORIGINAL);

  return {
    encryptedBlob,
    key: keyBase64
  };
}

export async function decryptFile(encryptedBlob: Blob, keyBase64: string, originalType: string = 'application/octet-stream'): Promise<Blob> {
  await _sodium.ready;
  const sodium = _sodium;

  const arrayBuffer = await encryptedBlob.arrayBuffer();
  const combinedData = new Uint8Array(arrayBuffer);

  const nonce = combinedData.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = combinedData.slice(sodium.crypto_secretbox_NONCEBYTES);

  const key = sodium.from_base64(keyBase64, sodium.base64_variants.ORIGINAL);

  const decryptedData = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);

  if (!decryptedData) {
    throw new Error('File decryption failed');
  }

  return new Blob([new Uint8Array(decryptedData) as any as BlobPart], { type: originalType });
}
