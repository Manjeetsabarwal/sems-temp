import { NotFoundException, BadRequestException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { Attachment } from './attachment.entity';
import { FileStorageService } from './file-storage.service';

export class AttachmentsService {
  private readonly attachmentRepo: Repository<Attachment>;

  constructor(
    dataSource: DataSource,
    private readonly fileStorage: FileStorageService,
  ) {
    this.attachmentRepo = dataSource.getRepository(Attachment);
  }

  /**
   * Upload a file and create an attachment record
   */
  async upload(
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    entityType: string,
    entityId: string,
    category?: string,
    description?: string,
    uploadedBy?: string,
  ): Promise<Attachment> {
    // Validate file size (max 25MB)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 25MB limit');
    }

    // Store the file
    const result = await this.fileStorage.store(
      file.buffer,
      file.originalname,
      file.mimetype,
      entityType,
      entityId,
    );

    // Create the attachment record
    const attachment = new Attachment();
    attachment.entityType = entityType;
    attachment.entityId = entityId;
    attachment.originalName = file.originalname;
    attachment.storedName = result.storedName;
    attachment.mimeType = file.mimetype;
    attachment.size = file.size;
    attachment.storageType = result.storageType;
    attachment.storagePath = result.storagePath;
    attachment.category = category || null;
    attachment.description = description || null;
    attachment.uploadedBy = uploadedBy || null;

    return this.attachmentRepo.save(attachment);
  }

  /**
   * Get all attachments for an entity
   */
  async findByEntity(entityType: string, entityId: string): Promise<Attachment[]> {
    return this.attachmentRepo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a single attachment by ID
   */
  async findOne(id: number): Promise<Attachment> {
    const attachment = await this.attachmentRepo.findOne({ where: { id } });
    if (!attachment) {
      throw new NotFoundException(`Attachment #${id} not found`);
    }
    return attachment;
  }

  /**
   * Download a file (returns buffer + metadata)
   */
  async download(id: number): Promise<{ buffer: Buffer; attachment: Attachment }> {
    const attachment = await this.findOne(id);
    const buffer = await this.fileStorage.retrieve(
      attachment.storagePath,
      attachment.storageType,
    );
    return { buffer, attachment };
  }

  /**
   * Delete an attachment (file + record)
   */
  async remove(id: number): Promise<void> {
    const attachment = await this.findOne(id);

    // Delete the file from storage
    await this.fileStorage.delete(attachment.storagePath, attachment.storageType);

    // Delete the DB record
    await this.attachmentRepo.remove(attachment);
  }

  /**
   * Delete all attachments for an entity
   */
  async removeAllForEntity(entityType: string, entityId: string): Promise<number> {
    const attachments = await this.findByEntity(entityType, entityId);

    for (const attachment of attachments) {
      await this.fileStorage.delete(attachment.storagePath, attachment.storageType);
    }

    const result = await this.attachmentRepo.delete({ entityType, entityId });
    return result.affected || 0;
  }

  /**
   * Get storage info
   */
  getStorageInfo() {
    return {
      mode: this.fileStorage.getStorageMode(),
    };
  }
}
