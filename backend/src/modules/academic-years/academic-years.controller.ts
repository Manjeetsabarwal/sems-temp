import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

@Controller('api/academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.academicYearsService.findAll({ status });
  }

  @Get('current')
  findCurrent() {
    return this.academicYearsService.findCurrent();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.academicYearsService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateAcademicYearDto) {
    return this.academicYearsService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateAcademicYearDto) {
    return this.academicYearsService.update(id, updateDto);
  }

  @Patch(':id/set-current')
  setAsCurrent(@Param('id') id: string) {
    return this.academicYearsService.setAsCurrent(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.academicYearsService.remove(id);
  }
}
