/**
 * BatchiT Genuine End-to-End Encryption (E2EE)
 * Implemented using the audited W3C Web Crypto API (SubtleCrypto)
 * - Algorithm: ECDH (Curve P-256) for key agreement
 * - Cipher: AES-GCM (256-bit) with random 96-bit IV per message
 * Private keys are generated and stored exclusively in browser local storage and never transmitted to the server.
 */

const KEY_PAIR_STORAGE = 'batchit_e2ee_keys';

// Convert ArrayBuffer to Base64
export const bufferToBase64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Convert Base64 to ArrayBuffer
export const base64ToBuffer = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Generate or retrieve existing ECDH keypair
export const getOrGenerateE2EEKeyPair = async () => {
  try {
    const stored = localStorage.getItem(KEY_PAIR_STORAGE);
    if (stored) {
      const parsed = JSON.parse(stored);
      const publicKey = await window.crypto.subtle.importKey(
        'jwk',
        parsed.publicKey,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        []
      );
      const privateKey = await window.crypto.subtle.importKey(
        'jwk',
        parsed.privateKey,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey', 'deriveBits']
      );
      return { publicKey, privateKey, rawPublicKeyBase64: parsed.rawPublicKeyBase64 };
    }

    // Generate fresh ECDH keypair
    const keyPair = await window.crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );

    const exportedPublicJWK = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const exportedPrivateJWK = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
    const exportedPublicRaw = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
    const rawPublicKeyBase64 = bufferToBase64(exportedPublicRaw);

    localStorage.setItem(
      KEY_PAIR_STORAGE,
      JSON.stringify({
        publicKey: exportedPublicJWK,
        privateKey: exportedPrivateJWK,
        rawPublicKeyBase64
      })
    );

    return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey, rawPublicKeyBase64 };
  } catch (error) {
    console.error('E2EE Key Generation Error:', error);
    return null;
  }
};

// Derive AES-GCM shared key from own private key and recipient's public key
export const deriveSharedKey = async (ownPrivateKey, recipientPublicKeyBase64) => {
  try {
    const recipientRawBuffer = base64ToBuffer(recipientPublicKeyBase64);
    const recipientPublicKey = await window.crypto.subtle.importKey(
      'raw',
      recipientRawBuffer,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      []
    );

    const sharedKey = await window.crypto.subtle.deriveKey(
      { name: 'ECDH', public: recipientPublicKey },
      ownPrivateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return sharedKey;
  } catch (error) {
    console.error('Failed to derive E2EE shared key:', error);
    return null;
  }
};

// Encrypt plaintext with AES-GCM
export const encryptMessage = async (plaintext, sharedKey) => {
  try {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      encoded
    );

    return {
      ciphertext: bufferToBase64(ciphertext),
      iv: bufferToBase64(iv)
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
};

// Decrypt ciphertext with AES-GCM
export const decryptMessage = async (ciphertextBase64, ivBase64, sharedKey) => {
  try {
    const ciphertext = base64ToBuffer(ciphertextBase64);
    const iv = base64ToBuffer(ivBase64);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.warn('Failed to decrypt message (keys might have changed):', error.message);
    return '🔒 [Encrypted Message]';
  }
};
