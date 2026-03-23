import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExamPapersService } from './exam-papers.service';
import { CreateExamPaperDto } from './dto/create-exam-paper.dto';
import { UpdateExamPaperDto } from './dto/update-exam-paper.dto';

@Controller('api/exam-papers')
export class ExamPapersController {
  constructor(private readonly examPapersService: ExamPapersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateExamPaperDto) {
    return this.examPapersService.create(createDto);
  }

  @Get()
  async findAll(
    @Query('examId') examId?: string,
    @Query('isOnline') isOnline?: string,
    @Query('status') status?: string,
  ) {
    return this.examPapersService.findAll({
      examId,
      isOnline: isOnline === 'true' ? true : isOnline === 'false' ? false : undefined,
      status,
    });
  }

  @Get(':paperId')
  async findOne(@Param('paperId') paperId: string) {
    return this.examPapersService.findOne(paperId);
  }

  @Get('by-exam/:examId')
  async findByExamId(@Param('examId') examId: string) {
    return this.examPapersService.findByExamId(examId);
  }

  @Put(':paperId')
  async update(@Param('paperId') paperId: string, @Body() updateDto: UpdateExamPaperDto) {
    return this.examPapersService.update(paperId, updateDto);
  }

  @Delete(':paperId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('paperId') paperId: string) {
    await this.examPapersService.remove(paperId);
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  async bulkDelete(@Body() body: { paperIds: string[] }) {
    return this.examPapersService.bulkDelete(body.paperIds);
  }
}
