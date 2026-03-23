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
import { PaperRulesService } from './paper-rules.service';
import { CreatePaperRuleDto } from './dto/create-paper-rule.dto';
import { UpdatePaperRuleDto } from './dto/update-paper-rule.dto';

@Controller('api/paper-rules')
export class PaperRulesController {
  constructor(private readonly paperRulesService: PaperRulesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreatePaperRuleDto) {
    return this.paperRulesService.create(createDto);
  }

  @Get()
  async findAll(
    @Query('paperId') paperId?: string,
    @Query('evaluationMode') evaluationMode?: string,
  ) {
    return this.paperRulesService.findAll({
      paperId,
      evaluationMode,
    });
  }

  @Get(':ruleId')
  async findOne(@Param('ruleId') ruleId: string) {
    return this.paperRulesService.findOne(ruleId);
  }

  @Get('by-paper/:paperId')
  async findByPaperId(@Param('paperId') paperId: string) {
    const rule = await this.paperRulesService.findByPaperId(paperId);
    if (!rule) {
      return { message: 'No rule found for this paper' };
    }
    return rule;
  }

  @Put(':ruleId')
  async update(@Param('ruleId') ruleId: string, @Body() updateDto: UpdatePaperRuleDto) {
    return this.paperRulesService.update(ruleId, updateDto);
  }

  @Put('by-paper/:paperId')
  async updateByPaperId(
    @Param('paperId') paperId: string,
    @Body() updateDto: UpdatePaperRuleDto,
  ) {
    return this.paperRulesService.updateByPaperId(paperId, updateDto);
  }

  @Delete(':ruleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('ruleId') ruleId: string) {
    await this.paperRulesService.remove(ruleId);
  }

  @Delete('by-paper/:paperId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByPaperId(@Param('paperId') paperId: string) {
    await this.paperRulesService.removeByPaperId(paperId);
  }

  @Post(':paperId/evaluate')
  @HttpCode(HttpStatus.OK)
  async evaluatePassFail(
    @Param('paperId') paperId: string,
    @Body() body: {
      marksObtained: number;
      totalMarks: number;
      sectionMarks?: { sectionId: string; marksObtained: number; totalMarks: number }[];
    },
  ) {
    return this.paperRulesService.evaluatePassFail(
      paperId,
      body.marksObtained,
      body.totalMarks,
      body.sectionMarks,
    );
  }
}
