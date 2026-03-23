import { NotFoundException, BadRequestException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { QuestionOption } from './question-option.entity';
import { CreateQuestionOptionDto } from './dto/create-question-option.dto';
import { UpdateQuestionOptionDto } from './dto/update-question-option.dto';

export class QuestionOptionsService {
  private readonly optionRepository: Repository<QuestionOption>;

  constructor(dataSource: DataSource) {
    this.optionRepository = dataSource.getRepository(QuestionOption);
  }

  async create(createDto: CreateQuestionOptionDto): Promise<QuestionOption> {
    const option = this.optionRepository.create(createDto);
    return await this.optionRepository.save(option);
  }

  async createBulk(
    questionId: string,
    options: Omit<CreateQuestionOptionDto, 'questionId' | 'optionId'>[],
  ): Promise<QuestionOption[]> {
    const createdOptions = options.map((opt, index) =>
      this.optionRepository.create({
        ...opt,
        questionId,
        optionId: `${questionId}-OPT-${index + 1}`,
        displayOrder: opt.displayOrder || index + 1,
      }),
    );

    return await this.optionRepository.save(createdOptions);
  }

  async findAll(filters?: {
    questionId?: string;
    isCorrect?: boolean;
  }): Promise<QuestionOption[]> {
    const queryBuilder = this.optionRepository.createQueryBuilder('option');

    if (filters?.questionId) {
      queryBuilder.andWhere('option.questionId = :questionId', {
        questionId: filters.questionId,
      });
    }

    if (filters?.isCorrect !== undefined) {
      queryBuilder.andWhere('option.isCorrect = :isCorrect', {
        isCorrect: filters.isCorrect,
      });
    }

    return queryBuilder
      .orderBy('option.displayOrder', 'ASC')
      .addOrderBy('option.createdAt', 'ASC')
      .getMany();
  }

  async findOne(optionId: string): Promise<QuestionOption> {
    const option = await this.optionRepository.findOne({
      where: { optionId },
      relations: ['question'],
    });

    if (!option) {
      throw new NotFoundException(`Question option with ID "${optionId}" not found`);
    }

    return option;
  }

  async findByQuestionId(questionId: string): Promise<QuestionOption[]> {
    return this.optionRepository.find({
      where: { questionId },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async getCorrectOption(questionId: string): Promise<QuestionOption | null> {
    return this.optionRepository.findOne({
      where: { questionId, isCorrect: true },
    });
  }

  async update(optionId: string, updateDto: UpdateQuestionOptionDto): Promise<QuestionOption> {
    const option = await this.findOne(optionId);

    // If updating isCorrect to true, ensure only one option is correct
    if (updateDto.isCorrect === true && !option.isCorrect) {
      // Set all other options for this question to false
      await this.optionRepository.update(
        { questionId: option.questionId, isCorrect: true },
        { isCorrect: false },
      );
    }

    Object.assign(option, updateDto);
    return await this.optionRepository.save(option);
  }

  async remove(optionId: string): Promise<void> {
    const option = await this.findOne(optionId);
    await this.optionRepository.remove(option);
  }

  async removeByQuestionId(questionId: string): Promise<{ deleted: number }> {
    const result = await this.optionRepository.delete({ questionId });
    return { deleted: result.affected || 0 };
  }

  async bulkDelete(optionIds: string[]): Promise<{ deleted: number }> {
    const result = await this.optionRepository.delete(optionIds);
    return { deleted: result.affected || 0 };
  }

  async reorderOptions(
    questionId: string,
    optionOrders: { optionId: string; displayOrder: number }[],
  ): Promise<void> {
    for (const { optionId, displayOrder } of optionOrders) {
      await this.optionRepository.update(optionId, { displayOrder });
    }
  }

  async validateMcqOptions(questionId: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const options = await this.findByQuestionId(questionId);

    const errors: string[] = [];

    if (options.length < 2) {
      errors.push('MCQ question must have at least 2 options');
    }

    if (options.length > 10) {
      errors.push('MCQ question cannot have more than 10 options');
    }

    const correctCount = options.filter((opt) => opt.isCorrect).length;

    if (correctCount === 0) {
      errors.push('MCQ question must have at least one correct option');
    }

    if (correctCount > 1) {
      errors.push('MCQ question should have exactly one correct option (multi-select not yet supported)');
    }

    // Check for duplicate option text
    const optionTexts = options.map((opt) => opt.optionText.trim().toLowerCase());
    const duplicates = optionTexts.filter(
      (text, index) => optionTexts.indexOf(text) !== index,
    );
    if (duplicates.length > 0) {
      errors.push('Duplicate option text found');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
