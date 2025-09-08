import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static getEncryptionKey(): string {
    const key = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY environment variable is required');
    }
    return key;
  }

  static encrypt(data: string): string {
    try {
      const key = this.getEncryptionKey();
      return CryptoJS.AES.encrypt(data, key).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  static decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  static encryptObject<T>(obj: T): string {
    return this.encrypt(JSON.stringify(obj));
  }

  static decryptObject<T>(encryptedData: string): T {
    const decryptedString = this.decrypt(encryptedData);
    return JSON.parse(decryptedString);
  }
}