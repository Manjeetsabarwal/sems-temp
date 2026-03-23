import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentHabitsService } from './student-habits.service';
import { StudentHabitsController } from './student-habits.controller';
import { StudentHabit } from './student-habit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentHabit])],
  controllers: [StudentHabitsController],
  providers: [StudentHabitsService],
  exports: [StudentHabitsService],
})
export class StudentHabitsModule {}
