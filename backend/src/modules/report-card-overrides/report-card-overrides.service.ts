import { DataSource, Repository } from 'typeorm';
import { ReportCardOverride } from './report-card-override.entity';

export class ReportCardOverridesService {
  private overrideRepo: Repository<ReportCardOverride>;

  constructor(private dataSource: DataSource) {
    this.overrideRepo = dataSource.getRepository(ReportCardOverride);
  }

  async findOne(studentId: string, academicYear: string, templateId: string): Promise<ReportCardOverride | null> {
    return this.overrideRepo.findOne({
      where: {
        studentId,
        academicYear,
        templateId,
      },
    });
  }

  async upsert(data: {
    studentId: string;
    academicYear: string;
    templateId: string;
    overrides: Record<string, any>;
  }): Promise<ReportCardOverride> {
    let override = await this.findOne(data.studentId, data.academicYear, data.templateId);

    if (override) {
      override.overrides = data.overrides;
      return this.overrideRepo.save(override);
    } else {
      override = this.overrideRepo.create(data);
      return this.overrideRepo.save(override);
    }
  }

  async remove(id: string): Promise<void> {
    await this.overrideRepo.delete(id);
  }
}
