import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { PaperRule } from './paper-rule.entity';
import { CreatePaperRuleDto } from './dto/create-paper-rule.dto';
import { UpdatePaperRuleDto } from './dto/update-paper-rule.dto';

export class PaperRulesService {
  private readonly ruleRepository: Repository<PaperRule>;

  constructor(dataSource: DataSource) {
    this.ruleRepository = dataSource.getRepository(PaperRule);
  }

  async create(createDto: CreatePaperRuleDto): Promise<PaperRule> {
    // Check if rule already exists for this paper
    const existing = await this.ruleRepository.findOne({
      where: { paperId: createDto.paperId },
    });

    if (existing) {
      throw new ConflictException(
        `A rule already exists for paper "${createDto.paperId}"`,
      );
    }

    const rule = this.ruleRepository.create(createDto);
    return await this.ruleRepository.save(rule);
  }

  async findAll(filters?: {
    paperId?: string;
    evaluationMode?: string;
  }): Promise<PaperRule[]> {
    const queryBuilder = this.ruleRepository.createQueryBuilder('rule');

    if (filters?.paperId) {
      queryBuilder.andWhere('rule.paperId = :paperId', { paperId: filters.paperId });
    }

    if (filters?.evaluationMode) {
      queryBuilder.andWhere('rule.evaluationMode = :evaluationMode', {
        evaluationMode: filters.evaluationMode,
      });
    }

    return queryBuilder.orderBy('rule.createdAt', 'ASC').getMany();
  }

  async findOne(ruleId: string): Promise<PaperRule> {
    const rule = await this.ruleRepository.findOne({
      where: { ruleId },
      relations: ['paper'],
    });

    if (!rule) {
      throw new NotFoundException(`Paper rule with ID "${ruleId}" not found`);
    }

    return rule;
  }

  async findByPaperId(paperId: string): Promise<PaperRule | null> {
    return this.ruleRepository.findOne({
      where: { paperId },
      relations: ['paper'],
    });
  }

  async update(ruleId: string, updateDto: UpdatePaperRuleDto): Promise<PaperRule> {
    const rule = await this.findOne(ruleId);
    Object.assign(rule, updateDto);
    return await this.ruleRepository.save(rule);
  }

  async updateByPaperId(
    paperId: string,
    updateDto: UpdatePaperRuleDto,
  ): Promise<PaperRule> {
    const rule = await this.findByPaperId(paperId);
    if (!rule) {
      throw new NotFoundException(`No rule found for paper "${paperId}"`);
    }
    Object.assign(rule, updateDto);
    return await this.ruleRepository.save(rule);
  }

  async remove(ruleId: string): Promise<void> {
    const rule = await this.findOne(ruleId);
    await this.ruleRepository.remove(rule);
  }

  async removeByPaperId(paperId: string): Promise<void> {
    const rule = await this.findByPaperId(paperId);
    if (rule) {
      await this.ruleRepository.remove(rule);
    }
  }

  /**
   * Evaluate if a student passed based on the paper rules
   */
  async evaluatePassFail(
    paperId: string,
    marksObtained: number,
    totalMarks: number,
    sectionMarks?: { sectionId: string; marksObtained: number; totalMarks: number }[],
  ): Promise<{
    passed: boolean;
    percentage: number;
    reason?: string;
  }> {
    const rule = await this.findByPaperId(paperId);
    if (!rule) {
      throw new NotFoundException(`No rule found for paper "${paperId}"`);
    }

    const percentage = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;

    // Check minimum percentage
    if (percentage < rule.minPercentage) {
      return {
        passed: false,
        percentage,
        reason: `Failed: ${percentage.toFixed(2)}% is below minimum ${rule.minPercentage}%`,
      };
    }

    // Check minimum marks
    if (marksObtained < rule.minMarksToPass) {
      return {
        passed: false,
        percentage,
        reason: `Failed: ${marksObtained} marks is below minimum ${rule.minMarksToPass} marks`,
      };
    }

    // Check section-wise pass if required
    if (rule.sectionWisePassRequired && sectionMarks) {
      const sectionPassed = sectionMarks.every((section) => {
        const sectionPercentage =
          section.totalMarks > 0
            ? (section.marksObtained / section.totalMarks) * 100
            : 0;
        return sectionPercentage >= rule.minPercentage;
      });

      if (!sectionPassed) {
        return {
          passed: false,
          percentage,
          reason: 'Failed: Did not pass all required sections',
        };
      }
    }

    return {
      passed: true,
      percentage,
    };
  }
}
