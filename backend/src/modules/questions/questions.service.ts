import { NotFoundException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { Question } from './question.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

export class QuestionsService {
  private readonly questionRepository: Repository<Question>;

  constructor(dataSource: DataSource) {
    this.questionRepository = dataSource.getRepository(Question);
  }

  async create(createDto: CreateQuestionDto): Promise<Question> {
    const question = this.questionRepository.create(createDto);
    return await this.questionRepository.save(question);
  }

  async findAll(filters?: {
    paperId?: string;
    sectionId?: string;
    questionType?: string;
    difficulty?: string;
  }): Promise<Question[]> {
    const queryBuilder = this.questionRepository.createQueryBuilder('question');

    if (filters?.paperId) {
      queryBuilder.andWhere('question.paperId = :paperId', { paperId: filters.paperId });
    }

    if (filters?.sectionId) {
      queryBuilder.andWhere('question.sectionId = :sectionId', { sectionId: filters.sectionId });
    }

    if (filters?.questionType) {
      queryBuilder.andWhere('question.questionType = :questionType', {
        questionType: filters.questionType,
      });
    }

    if (filters?.difficulty) {
      queryBuilder.andWhere('question.difficulty = :difficulty', {
        difficulty: filters.difficulty,
      });
    }

    return queryBuilder
      .orderBy('question.displayOrder', 'ASC')
      .addOrderBy('question.createdAt', 'ASC')
      .getMany();
  }

  async findOne(questionId: string): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { questionId },
      relations: ['paper'],
    });

    if (!question) {
      throw new NotFoundException(`Question with ID "${questionId}" not found`);
    }

    return question;
  }

  async findByPaperId(paperId: string): Promise<Question[]> {
    return this.questionRepository.find({
      where: { paperId },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findByPaperIdAndType(
    paperId: string,
    questionType: 'MCQ' | 'THEORY' | 'DESCRIPTIVE',
  ): Promise<Question[]> {
    return this.questionRepository.find({
      where: { paperId, questionType },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async update(questionId: string, updateDto: UpdateQuestionDto): Promise<Question> {
    const question = await this.findOne(questionId);
    Object.assign(question, updateDto);
    return await this.questionRepository.save(question);
  }

  async remove(questionId: string): Promise<void> {
    const question = await this.findOne(questionId);
    await this.questionRepository.remove(question);
  }

  async bulkDelete(questionIds: string[]): Promise<{ deleted: number }> {
    const result = await this.questionRepository.delete(questionIds);
    return { deleted: result.affected || 0 };
  }

  async reorderQuestions(paperId: string, questionOrders: { questionId: string; displayOrder: number }[]): Promise<void> {
    // Update display order for multiple questions
    for (const { questionId, displayOrder } of questionOrders) {
      await this.questionRepository.update(questionId, { displayOrder });
    }
  }

  async getQuestionStatistics(paperId: string): Promise<{
    total: number;
    byType: { type: string; count: number }[];
    byDifficulty: { difficulty: string; count: number }[];
    totalMarks: number;
  }> {
    const questions = await this.findByPaperId(paperId);

    const byType = questions.reduce((acc, q) => {
      const existing = acc.find((item) => item.type === q.questionType);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ type: q.questionType, count: 1 });
      }
      return acc;
    }, [] as { type: string; count: number }[]);

    const byDifficulty = questions.reduce((acc, q) => {
      const existing = acc.find((item) => item.difficulty === q.difficulty);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ difficulty: q.difficulty, count: 1 });
      }
      return acc;
    }, [] as { difficulty: string; count: number }[]);

    const totalMarks = questions.reduce((sum, q) => sum + Number(q.marks), 0);

    return {
      total: questions.length,
      byType,
      byDifficulty,
      totalMarks,
    };
  }
}
