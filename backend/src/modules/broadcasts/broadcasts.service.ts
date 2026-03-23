import { NotFoundException } from '../../common/app-error';
import { Repository, DataSource, In } from 'typeorm';
import { Broadcast } from './broadcast.entity';
import { BroadcastMessage } from './broadcast-message.entity';
import { CreateBroadcastDto, CreateBroadcastMessageDto } from './dto/create-broadcast.dto';
import { UpdateBroadcastDto } from './dto/update-broadcast.dto';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { Student } from '../students/student.entity';

export class BroadcastsService {
  private readonly broadcastRepository: Repository<Broadcast>;
  private readonly messageRepository: Repository<BroadcastMessage>;
  private readonly studentRepository: Repository<Student>;

  constructor(
    dataSource: DataSource,
    private readonly whatsAppService: WhatsAppService,
  ) {
    this.broadcastRepository = dataSource.getRepository(Broadcast);
    this.messageRepository = dataSource.getRepository(BroadcastMessage);
    this.studentRepository = dataSource.getRepository(Student);
  }

  async findAll(filters?: { status?: string }): Promise<Broadcast[]> {
    const qb = this.broadcastRepository.createQueryBuilder('b');
    if (filters?.status) qb.andWhere('b.status = :status', { status: filters.status });
    return qb
      .orderBy('b.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number): Promise<Broadcast> {
    const broadcast = await this.broadcastRepository.findOne({
      where: { id },
      relations: ['messages'],
    });
    if (!broadcast) throw new NotFoundException(`Broadcast ${id} not found`);
    return broadcast;
  }

  async create(dto: CreateBroadcastDto): Promise<Broadcast> {
    const broadcast = this.broadcastRepository.create(dto);
    return this.broadcastRepository.save(broadcast);
  }

  async update(id: number, dto: UpdateBroadcastDto): Promise<Broadcast> {
    const broadcast = await this.findOne(id);
    Object.assign(broadcast, dto);
    await this.broadcastRepository.save(broadcast);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const broadcast = await this.findOne(id);
    await this.broadcastRepository.remove(broadcast);
  }

  async getMessages(broadcastId: number): Promise<BroadcastMessage[]> {
    return this.messageRepository.find({
      where: { broadcastId },
      order: { createdAt: 'DESC' },
    });
  }

  async getStats(broadcastId: number): Promise<{ total: number; sent: number; delivered: number; failed: number; pending: number }> {
    const messages = await this.getMessages(broadcastId);
    const total = messages.length;
    const sent = messages.filter((m) => ['sent', 'delivered', 'read'].includes(m.status)).length;
    const delivered = messages.filter((m) => ['delivered', 'read'].includes(m.status)).length;
    const failed = messages.filter((m) => m.status === 'failed').length;
    const pending = messages.filter((m) => ['pending', 'sending'].includes(m.status)).length;
    return { total, sent, delivered, failed, pending };
  }

  /**
   * Get WhatsApp templates (proxy to WhatsAppService)
   */
  async getWhatsAppTemplates() {
    return this.whatsAppService.getTemplates();
  }

  /**
   * Create a broadcast with auto-populated recipient messages from student filters
   */
  async createWithRecipients(
    dto: CreateBroadcastDto & { filters?: any },
  ): Promise<Broadcast> {
    const filters = dto.filters || dto; // Check both nested and top-level
    const qb = this.studentRepository.createQueryBuilder('s');
    qb.where('s.status = :status', { status: 'Active' });

    if (filters?.targetType === 'CLASS' && filters.classId) {
      qb.andWhere('s.class_id = :classId', { classId: filters.classId });
    } else if (filters?.targetType === 'SECTION' && filters.sectionId) {
      qb.andWhere('s.section_id = :sectionId', { sectionId: filters.sectionId });
    } else if (filters?.targetType === 'SELECTIVE' && filters.studentIds && filters.studentIds.length > 0) {
      qb.andWhere('s.student_id IN (:...ids)', { ids: filters.studentIds });
    }

    const students = await qb.getMany();
    const validStudents = students.filter((s) => s.phone || s.parentPhone);

    dto.totalRecipients = validStudents.length;
    dto.status = 'pending';
    dto.targetType = filters?.targetType || 'ALL';
    dto.targetId = filters?.targetType === 'CLASS' ? filters.classId : 
                   filters?.targetType === 'SECTION' ? filters.sectionId : null;

    const broadcast = this.broadcastRepository.create(dto);
    const saved = await this.broadcastRepository.save(broadcast);

    // Create individual messages using resolved variables
    const messageData = validStudents.map((student) => {
      const resolvedParams = this.resolveTemplateVariables(dto.templateParams, student);
      return {
        broadcastId: saved.id,
        studentId: student.studentId,
        phoneNumber: student.parentPhone || student.phone || '',
        templateId: dto.templateId,
        templateName: dto.templateName,
        templateLanguage: dto.templateLanguage || 'en',
        templateParams: resolvedParams,
        status: 'pending',
      };
    });

    // Chunk size for bulk saving to avoid database limits
    const CHUNK_SIZE = 500;
    for (let i = 0; i < messageData.length; i += CHUNK_SIZE) {
      const chunk = messageData.slice(i, i + CHUNK_SIZE);
      const entities = this.messageRepository.create(chunk);
      await this.messageRepository.insert(entities);
    }

    return this.findOne(saved.id);
  }

  /**
   * Resolve template variables like {{name}} from student data
   */
  private resolveTemplateVariables(templateParams: any, student: Student): any {
    if (!templateParams || !templateParams.body) return templateParams;

    const resolvedBody = templateParams.body.map((param: string) => {
      let resolved = param;
      resolved = resolved.replace(/{{name}}/g, student.name || '');
      resolved = resolved.replace(/{{parent}}/g, student.parentName || '');
      resolved = resolved.replace(/{{id}}/g, student.studentId || '');
      resolved = resolved.replace(/{{class}}/g, student.classId || '');
      resolved = resolved.replace(/{{section}}/g, student.sectionId || '');
      return resolved;
    });

    return { ...templateParams, body: resolvedBody };
  }

  /**
   * Retry failed messages in a broadcast
   */
  async retryFailed(broadcastId: number): Promise<void> {
    await this.messageRepository.update(
      { broadcastId, status: 'failed' },
      { status: 'pending', retryCount: 0, errorMessage: null }
    );
    
    await this.broadcastRepository.update(
      { id: broadcastId },
      { status: 'processing' }
    );
  }
}
