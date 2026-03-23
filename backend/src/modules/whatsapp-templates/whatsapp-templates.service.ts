import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { WhatsAppTemplate } from './whatsapp-template.entity';
import { CreateWhatsAppTemplateDto } from './dto/create-whatsapp-template.dto';
import { UpdateWhatsAppTemplateDto } from './dto/update-whatsapp-template.dto';

export class WhatsAppTemplatesService {
  private readonly templateRepository: Repository<WhatsAppTemplate>;

  constructor(dataSource: DataSource) {
    this.templateRepository = dataSource.getRepository(WhatsAppTemplate);
  }

  async findAll(filters?: { status?: string; language?: string }): Promise<WhatsAppTemplate[]> {
    const qb = this.templateRepository.createQueryBuilder('t');
    if (filters?.status) qb.andWhere('t.status = :status', { status: filters.status });
    if (filters?.language) qb.andWhere('t.language = :language', { language: filters.language });
    return qb.orderBy('t.createdAt', 'DESC').getMany();
  }

  async findOne(id: number): Promise<WhatsAppTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) throw new NotFoundException(`Template ${id} not found`);
    return template;
  }

  async findByTemplateId(templateId: string): Promise<WhatsAppTemplate> {
    const template = await this.templateRepository.findOne({ where: { templateId } });
    if (!template) throw new NotFoundException(`Template ${templateId} not found`);
    return template;
  }

  async create(dto: CreateWhatsAppTemplateDto): Promise<WhatsAppTemplate> {
    try {
      const template = this.templateRepository.create(dto);
      return await this.templateRepository.save(template);
    } catch (error: any) {
      if (error.code === '23505') throw new ConflictException('Template ID already exists');
      throw error;
    }
  }

  async update(id: number, dto: UpdateWhatsAppTemplateDto): Promise<WhatsAppTemplate> {
    const template = await this.findOne(id);
    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  async remove(id: number): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepository.remove(template);
  }

  async getDropdown(): Promise<Array<{ id: number; templateId: string; name: string }>> {
    const list = await this.findAll();
    return list.map((t) => ({ id: t.id, templateId: t.templateId, name: t.name }));
  }
}
