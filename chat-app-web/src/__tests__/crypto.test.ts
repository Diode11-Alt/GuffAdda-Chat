import { describe, it, expect, beforeAll } from 'vitest';
import { encryptFile, decryptFile } from '../utils/fileEncryption';
import _sodium from 'libsodium-wrappers';

describe('File Encryption and Decryption', () => {
  beforeAll(async () => {
    await _sodium.ready;
  });

  it('should successfully encrypt and decrypt a file, matching the original content', async () => {
    // Create a dummy file
    const textContent = 'Hello, this is a secret file content for testing!';
    const file = new File([textContent], 'secret.txt', { type: 'text/plain' });

    // Encrypt
    const { encryptedBlob, key } = await encryptFile(file);

    expect(encryptedBlob).toBeInstanceOf(Blob);
    expect(key).toBeTypeOf('string');
    expect(key.length).toBeGreaterThan(0);

    // Decrypt
    const decryptedBlob = await decryptFile(encryptedBlob, key, 'text/plain');

    // Verify content
    const decryptedText = await decryptedBlob.text();
    expect(decryptedText).toBe(textContent);
    expect(decryptedBlob.type).toBe('text/plain');
  });

  it('should throw an error if decrypted with a wrong key', async () => {
    const textContent = 'This should not be decipherable with a bad key';
    const file = new File([textContent], 'another-secret.txt', { type: 'text/plain' });

    const { encryptedBlob } = await encryptFile(file);

    // Generate a different valid base64 key
    const badKey = _sodium.crypto_secretbox_keygen();
    const badKeyBase64 = _sodium.to_base64(badKey, _sodium.base64_variants.ORIGINAL);

    await expect(decryptFile(encryptedBlob, badKeyBase64, 'text/plain')).rejects.toThrow();
  });

  it('should throw an error if the blob data is tampered with', async () => {
    const textContent = 'Tampering test';
    const file = new File([textContent], 'tampered.txt', { type: 'text/plain' });

    const { encryptedBlob, key } = await encryptFile(file);

    // Tamper with the ciphertext by flipping a bit
    const buffer = await encryptedBlob.arrayBuffer();
    const tamperedData = new Uint8Array(buffer);
    tamperedData[tamperedData.length - 1] ^= 1; // flip a bit in the ciphertext
    const tamperedBlob = new Blob([tamperedData], { type: 'application/octet-stream' });

    await expect(decryptFile(tamperedBlob, key, 'text/plain')).rejects.toThrow();
  });
});
