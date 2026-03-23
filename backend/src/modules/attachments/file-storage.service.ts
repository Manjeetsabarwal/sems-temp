
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Use require() for optional S3 dependency so TypeScript doesn't fail at compile time
function tryLoadS3(): any | null {
  try {
    return require('@aws-sdk/client-s3');
  } catch {
    return null;
  }
}

export interface StorageResult {
  storedName: string;
  storagePath: string;
  storageType: 'local' | 's3';
}

export class FileStorageService {
  private useS3: boolean;
  private readonly localUploadDir: string;
  private readonly s3Bucket: string;
  private readonly s3Region: string;
  private readonly s3AccessKey: string;
  private readonly s3SecretKey: string;
  private s3Client: any = null;
  private s3Sdk: any = null;

  constructor() {
    this.s3AccessKey = process.env.AWS_ACCESS_KEY_ID || '';
    this.s3SecretKey = process.env.AWS_SECRET_ACCESS_KEY || '';
    this.s3Bucket = process.env.AWS_S3_BUCKET || '';
    this.s3Region = process.env.AWS_S3_REGION || 'ap-south-1';

    this.useS3 = !!(this.s3AccessKey && this.s3SecretKey && this.s3Bucket);

    this.localUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

    if (this.useS3) {
      this.s3Sdk = tryLoadS3();
      if (this.s3Sdk) {
        this.s3Client = new this.s3Sdk.S3Client({
          region: this.s3Region,
          credentials: {
            accessKeyId: this.s3AccessKey,
            secretAccessKey: this.s3SecretKey,
          },
        });
        console.log(`File storage: S3 (bucket=${this.s3Bucket}, region=${this.s3Region})`);
      } else {
        console.warn('@aws-sdk/client-s3 not installed. Falling back to local storage.');
        console.warn('Run: npm install @aws-sdk/client-s3 to enable S3 uploads.');
        this.useS3 = false;
      }
    }

    if (!this.useS3) {
      console.log(`File storage: Local (dir=${this.localUploadDir})`);
      this.ensureLocalDir(this.localUploadDir);
    }
  }

  private ensureLocalDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created upload directory: ${dir}`);
    }
  }

  private generateStoredName(originalName: string): string {
    const ext = path.extname(originalName);
    const uuid = crypto.randomUUID();
    return `${uuid}${ext}`;
  }

  /**
   * Store a file (S3 or local)
   */
  async store(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    entityType: string,
    entityId: string,
  ): Promise<StorageResult> {
    const storedName = this.generateStoredName(originalName);
    const subDir = `${entityType}/${entityId}`;

    if (this.useS3 && this.s3Client) {
      return this.storeToS3(buffer, storedName, mimeType, subDir);
    }
    return this.storeToLocal(buffer, storedName, subDir);
  }

  private async storeToS3(
    buffer: Buffer,
    storedName: string,
    mimeType: string,
    subDir: string,
  ): Promise<StorageResult> {
    const key = `${subDir}/${storedName}`;

    try {
      await this.s3Client.send(
        new this.s3Sdk.PutObjectCommand({
          Bucket: this.s3Bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        }),
      );

      console.log(`Stored file to S3: ${key}`);
      return { storedName, storagePath: key, storageType: 's3' };
    } catch (err) {
      console.error(`S3 upload failed, falling back to local: ${err}`);
      return this.storeToLocal(buffer, storedName, subDir);
    }
  }

  private storeToLocal(
    buffer: Buffer,
    storedName: string,
    subDir: string,
  ): StorageResult {
    const dir = path.join(this.localUploadDir, subDir);
    this.ensureLocalDir(dir);

    const filePath = path.join(dir, storedName);
    fs.writeFileSync(filePath, buffer);

    const relativePath = path.join(subDir, storedName);
    console.log(`Stored file locally: ${relativePath}`);

    return { storedName, storagePath: relativePath, storageType: 'local' };
  }

  /**
   * Retrieve a file (returns buffer)
   */
  async retrieve(storagePath: string, storageType: string): Promise<Buffer> {
    if (storageType === 's3' && this.s3Client) {
      return this.retrieveFromS3(storagePath);
    }
    return this.retrieveFromLocal(storagePath);
  }

  private async retrieveFromS3(key: string): Promise<Buffer> {
    const response = await this.s3Client.send(
      new this.s3Sdk.GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
      }),
    );

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  private retrieveFromLocal(relativePath: string): Buffer {
    const fullPath = path.join(this.localUploadDir, relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${relativePath}`);
    }
    return fs.readFileSync(fullPath);
  }

  /**
   * Delete a file
   */
  async delete(storagePath: string, storageType: string): Promise<void> {
    if (storageType === 's3' && this.s3Client) {
      return this.deleteFromS3(storagePath);
    }
    return this.deleteFromLocal(storagePath);
  }

  private async deleteFromS3(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new this.s3Sdk.DeleteObjectCommand({
          Bucket: this.s3Bucket,
          Key: key,
        }),
      );
      console.log(`Deleted file from S3: ${key}`);
    } catch (err) {
      console.error(`Failed to delete S3 file: ${err}`);
    }
  }

  private deleteFromLocal(relativePath: string): void {
    const fullPath = path.join(this.localUploadDir, relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted local file: ${relativePath}`);
    }
  }

  getStorageMode(): 'local' | 's3' {
    return this.useS3 ? 's3' : 'local';
  }
}
