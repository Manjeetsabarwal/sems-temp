import { NotFoundException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { ReportCardTemplate } from './report-card-template.entity';
import { CreateReportCardTemplateDto } from './dto/create-report-card-template.dto';
import { UpdateReportCardTemplateDto } from './dto/update-report-card-template.dto';

export class ReportCardTemplatesService {
  private readonly templateRepository: Repository<ReportCardTemplate>;

  constructor(dataSource: DataSource) {
    this.templateRepository = dataSource.getRepository(ReportCardTemplate);
  }

  async findAll(activeOnly?: boolean): Promise<ReportCardTemplate[]> {
    const qb = this.templateRepository.createQueryBuilder('t');
    if (activeOnly) qb.andWhere('t.isActive = :active', { active: true });
    return qb.orderBy('t.code', 'ASC').getMany();
  }

  async findOne(id: number): Promise<ReportCardTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) throw new NotFoundException(`Report card template ${id} not found`);
    return template;
  }

  async findByCode(code: string): Promise<ReportCardTemplate> {
    const template = await this.templateRepository.findOne({ where: { code } });
    if (!template) throw new NotFoundException(`Report card template ${code} not found`);
    return template;
  }

  async create(dto: CreateReportCardTemplateDto): Promise<ReportCardTemplate> {
    const template = this.templateRepository.create(dto);
    return this.templateRepository.save(template);
  }

  async update(id: number, dto: UpdateReportCardTemplateDto): Promise<ReportCardTemplate> {
    const template = await this.findOne(id);
    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  async remove(id: number): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepository.remove(template);
  }

  async getDropdown(): Promise<Array<{ id: number; code: string; displayName: string }>> {
    const list = await this.findAll(true);
    return list.map((t) => ({ id: t.id, code: t.code, displayName: t.displayName }));
  }
}
