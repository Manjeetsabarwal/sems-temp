import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { StudentResponse } from './student-response.entity';
import { CreateStudentResponseDto } from './dto/create-student-response.dto';
import { UpdateStudentResponseDto } from './dto/update-student-response.dto';

export class StudentResponsesService {
  private readonly responseRepository: Repository<StudentResponse>;

  constructor(dataSource: DataSource) {
    this.responseRepository = dataSource.getRepository(StudentResponse);
  }

  async create(createDto: CreateStudentResponseDto): Promise<StudentResponse> {
    // Check if response already exists
    const existing = await this.responseRepository.findOne({
      where: {
        attemptId: createDto.attemptId,
        questionId: createDto.questionId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Response already exists for this question in this attempt. Response ID: ${existing.responseId}`,
      );
    }

    const response = this.responseRepository.create(createDto);
    return await this.responseRepository.save(response);
  }

  async createOrUpdate(createDto: CreateStudentResponseDto): Promise<StudentResponse> {
    const existing = await this.responseRepository.findOne({
      where: {
        attemptId: createDto.attemptId,
        questionId: createDto.questionId,
      },
    });

    if (existing) {
      Object.assign(existing, createDto);
      return await this.responseRepository.save(existing);
    }

    const response = this.responseRepository.create(createDto);
    return await this.responseRepository.save(response);
  }

  async findAll(filters?: {
    attemptId?: string;
    questionId?: string;
    isEvaluated?: boolean;
  }): Promise<StudentResponse[]> {
    const queryBuilder = this.responseRepository.createQueryBuilder('response');

    if (filters?.attemptId) {
      queryBuilder.andWhere('response.attemptId = :attemptId', { attemptId: filters.attemptId });
    }

    if (filters?.questionId) {
      queryBuilder.andWhere('response.questionId = :questionId', {
        questionId: filters.questionId,
      });
    }

    if (filters?.isEvaluated !== undefined) {
      queryBuilder.andWhere('response.isEvaluated = :isEvaluated', {
        isEvaluated: filters.isEvaluated,
      });
    }

    return queryBuilder.orderBy('response.createdAt', 'ASC').getMany();
  }

  async findOne(responseId: string): Promise<StudentResponse> {
    const response = await this.responseRepository.findOne({
      where: { responseId },
      relations: ['attempt', 'question', 'selectedOption'],
    });

    if (!response) {
      throw new NotFoundException(`Student response with ID "${responseId}" not found`);
    }

    return response;
  }

  async findByAttemptId(attemptId: string): Promise<StudentResponse[]> {
    return this.responseRepository.find({
      where: { attemptId },
      relations: ['question', 'selectedOption'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByQuestionId(questionId: string): Promise<StudentResponse[]> {
    return this.responseRepository.find({
      where: { questionId },
      relations: ['attempt', 'selectedOption'],
      order: { createdAt: 'ASC' },
    });
  }

  async update(responseId: string, updateDto: UpdateStudentResponseDto): Promise<StudentResponse> {
    const response = await this.findOne(responseId);

    // If evaluating, set evaluatedAt
    if (updateDto.isEvaluated === true && !response.isEvaluated) {
      updateDto.evaluatedAt = new Date();
    }

    Object.assign(response, updateDto);
    return await this.responseRepository.save(response);
  }

  async evaluateResponse(
    responseId: string,
    marksAwarded: number,
    evaluatedBy: string,
    feedback?: string,
  ): Promise<StudentResponse> {
    const response = await this.findOne(responseId);

    response.marksAwarded = marksAwarded;
    response.isEvaluated = true;
    response.evaluatedBy = evaluatedBy;
    response.evaluatedAt = new Date();
    if (feedback) {
      response.feedback = feedback;
    }

    return await this.responseRepository.save(response);
  }

  async bulkEvaluate(
    attemptId: string,
    evaluations: {
      responseId: string;
      marksAwarded: number;
      evaluatedBy: string;
      feedback?: string;
    }[],
  ): Promise<StudentResponse[]> {
    const responses: StudentResponse[] = [];

    for (const evalData of evaluations) {
      const response = await this.findOne(evalData.responseId);
      response.marksAwarded = evalData.marksAwarded;
      response.isEvaluated = true;
      response.evaluatedBy = evalData.evaluatedBy;
      response.evaluatedAt = new Date();
      if (evalData.feedback) {
        response.feedback = evalData.feedback;
      }
      responses.push(await this.responseRepository.save(response));
    }

    return responses;
  }

  async remove(responseId: string): Promise<void> {
    const response = await this.findOne(responseId);
    await this.responseRepository.remove(response);
  }

  async removeByAttemptId(attemptId: string): Promise<{ deleted: number }> {
    const result = await this.responseRepository.delete({ attemptId });
    return { deleted: result.affected || 0 };
  }

  async getResponseStatistics(attemptId: string): Promise<{
    total: number;
    answered: number;
    evaluated: number;
    totalMarksObtained: number;
    totalMarksAvailable: number;
    byCorrectness: { correct: number; incorrect: number; notEvaluated: number };
  }> {
    const responses = await this.findByAttemptId(attemptId);

    const answered = responses.filter((r) => r.answerText || r.selectedOptionId).length;
    const evaluated = responses.filter((r) => r.isEvaluated).length;
    const totalMarksObtained = responses.reduce(
      (sum, r) => sum + Number(r.marksAwarded || 0),
      0,
    );

    // Calculate total marks available from questions
    const totalMarksAvailable = responses.reduce(
      (sum, r) => sum + Number(r.question?.marks || 0),
      0,
    );

    const correct = responses.filter((r) => r.isCorrect === true).length;
    const incorrect = responses.filter((r) => r.isCorrect === false).length;
    const notEvaluated = responses.filter((r) => r.isCorrect === null || r.isCorrect === undefined)
      .length;

    return {
      total: responses.length,
      answered,
      evaluated,
      totalMarksObtained: Number(totalMarksObtained.toFixed(2)),
      totalMarksAvailable: Number(totalMarksAvailable.toFixed(2)),
      byCorrectness: {
        correct,
        incorrect,
        notEvaluated,
      },
    };
  }
}
