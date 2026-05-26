import fs from 'fs';
import path from 'path';

export interface StorageProvider {
  uploadFile(fileBuffer: Buffer, filename: string, mimeType: string): Promise<string>;
  getPresignedUrl(fileUrl: string, expiryInSeconds?: number): Promise<string>;
}

export class LocalDiskStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(fileBuffer: Buffer, filename: string, mimeType: string): Promise<string> {
    const filePath = path.join(this.uploadDir, filename);
    await fs.promises.writeFile(filePath, fileBuffer);
    return `/uploads/documents/${filename}`;
  }

  async getPresignedUrl(fileUrl: string, expiryInSeconds = 900): Promise<string> {
    // Local development: simulate a presigned token for secure preview checks
    const expiresAt = Date.now() + expiryInSeconds * 1000;
    const token = Buffer.from(`${fileUrl}:${expiresAt}`).toString('base64');
    return `${fileUrl}?token=${token}`;
  }
}

export class S3StorageProvider implements StorageProvider {
  private bucket: string;

  constructor() {
    this.bucket = process.env.STORAGE_BUCKET || 'oasis-documents';
  }

  async uploadFile(fileBuffer: Buffer, filename: string, mimeType: string): Promise<string> {
    // S3 client putObject implementation would be active here in production
    // Return mock R2/S3 path
    return `https://${this.bucket}.s3.amazonaws.com/documents/${filename}`;
  }

  async getPresignedUrl(fileUrl: string, expiryInSeconds = 900): Promise<string> {
    // S3 client getSignedUrl implementation
    return `${fileUrl}?AWSAccessKeyId=MOCKKEY&Expires=${Math.floor(Date.now() / 1000) + expiryInSeconds}&Signature=MOCKSIGNATURE`;
  }
}

// Get the active storage provider based on configured environment variables
export function getStorageProvider(): StorageProvider {
  if (process.env.STORAGE_PROVIDER === 's3' || process.env.STORAGE_PROVIDER === 'r2') {
    return new S3StorageProvider();
  }
  return new LocalDiskStorageProvider();
}
