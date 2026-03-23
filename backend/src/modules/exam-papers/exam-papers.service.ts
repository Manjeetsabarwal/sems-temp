import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { ExamPaper } from './exam-paper.entity';
import { CreateExamPaperDto } from './dto/create-exam-paper.dto';
import { UpdateExamPaperDto } from './dto/update-exam-paper.dto';

export class ExamPapersService {
  private readonly paperRepository: Repository<ExamPaper>;

  constructor(dataSource: DataSource) {
    this.paperRepository = dataSource.getRepository(ExamPaper);
  }

  async create(createDto: CreateExamPaperDto): Promise<ExamPaper> {
    // Check if paper code already exists for this exam
    if (createDto.paperCode) {
      const existing = await this.paperRepository.findOne({
        where: {
          examId: createDto.examId,
          paperCode: createDto.paperCode,
        },
      });

      if (existing) {
        throw new ConflictException(
          `A paper with code "${createDto.paperCode}" already exists for this exam`,
        );
      }
    }

    const paper = this.paperRepository.create(createDto);
    return await this.paperRepository.save(paper);
  }

  async findAll(filters?: {
    examId?: string;
    isOnline?: boolean;
    status?: string;
  }): Promise<ExamPaper[]> {
    const queryBuilder = this.paperRepository.createQueryBuilder('paper');

    if (filters?.examId) {
      queryBuilder.andWhere('paper.examId = :examId', { examId: filters.examId });
    }

    if (filters?.isOnline !== undefined) {
      queryBuilder.andWhere('paper.isOnline = :isOnline', { isOnline: filters.isOnline });
    }

    if (filters?.status) {
      queryBuilder.andWhere('paper.status = :status', { status: filters.status });
    }

    return queryBuilder
      .orderBy('paper.displayOrder', 'ASC')
      .addOrderBy('paper.createdAt', 'ASC')
      .getMany();
  }

  async findOne(paperId: string): Promise<ExamPaper> {
    const paper = await this.paperRepository.findOne({
      where: { paperId },
      relations: ['exam'],
    });

    if (!paper) {
      throw new NotFoundException(`Exam paper with ID "${paperId}" not found`);
    }

    return paper;
  }

  async findByExamId(examId: string): Promise<ExamPaper[]> {
    return this.paperRepository.find({
      where: { examId },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async update(paperId: string, updateDto: UpdateExamPaperDto): Promise<ExamPaper> {
    const paper = await this.findOne(paperId);

    // Check paper code uniqueness if being updated
    if (updateDto.paperCode && updateDto.paperCode !== paper.paperCode) {
      const existing = await this.paperRepository.findOne({
        where: {
          examId: paper.examId,
          paperCode: updateDto.paperCode,
        },
      });

      if (existing && existing.paperId !== paperId) {
        throw new ConflictException(
          `A paper with code "${updateDto.paperCode}" already exists for this exam`,
        );
      }
    }

    Object.assign(paper, updateDto);
    return await this.paperRepository.save(paper);
  }

  async remove(paperId: string): Promise<void> {
    const paper = await this.findOne(paperId);
    await this.paperRepository.remove(paper);
  }

  async bulkDelete(paperIds: string[]): Promise<{ deleted: number }> {
    const result = await this.paperRepository.delete(paperIds);
    return { deleted: result.affected || 0 };
  }
}
