// Simple client-side encryption utilities
// IMPORTANT: For production, API keys should be encrypted server-side
// This provides basic obfuscation for client-side storage

const ENCRYPTION_KEY = 'mood-app-encryption-key-v1';

function base64Encode(str: string): string {
  // Convert string to byte array, then to base64
  // This handles all characters correctly including extended ASCII
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }

  // Convert bytes to base64-safe string
  const binaryString = String.fromCharCode(...bytes);
  return btoa(binaryString);
}

function base64Decode(str: string): string {
  // Decode base64 to binary string
  const binaryString = atob(str);

  // Convert binary string back to original string
  const bytes: number[] = [];
  for (let i = 0; i < binaryString.length; i++) {
    bytes.push(binaryString.charCodeAt(i));
  }

  return String.fromCharCode(...bytes);
}

export function encryptValue(value: string): string {
  if (!value) return '';

  // Simple XOR cipher with base64 encoding
  // For production, use proper encryption library
  const key = ENCRYPTION_KEY;
  let encrypted = '';

  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    encrypted += String.fromCharCode(charCode);
  }

  return base64Encode(encrypted);
}

export function decryptValue(encrypted: string): string {
  if (!encrypted) return '';

  try {
    const decoded = base64Decode(encrypted);
    const key = ENCRYPTION_KEY;
    let decrypted = '';

    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      decrypted += String.fromCharCode(charCode);
    }

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '••••••••';
  return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
}

export function validateStripeKey(key: string, type: 'publishable' | 'secret'): boolean {
  if (!key) return false;

  if (type === 'publishable') {
    return key.startsWith('pk_test_') || key.startsWith('pk_live_');
  } else {
    return key.startsWith('sk_test_') || key.startsWith('sk_live_');
  }
}

export function isTestKey(key: string): boolean {
  return key.includes('_test_');
}
