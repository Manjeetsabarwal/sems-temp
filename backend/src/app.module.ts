import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { AcademicYearsModule } from './modules/academic-years/academic-years.module';
import { ClassesModule } from './modules/classes/classes.module';
import { SectionsModule } from './modules/sections/sections.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { StudentsModule } from './modules/students/students.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { ExamsModule } from './modules/exams/exams.module';
import { ExamPapersModule } from './modules/exam-papers/exam-papers.module';
import { PaperRulesModule } from './modules/paper-rules/paper-rules.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { QuestionOptionsModule } from './modules/question-options/question-options.module';
import { StudentAttemptsModule } from './modules/student-attempts/student-attempts.module';
import { StudentResponsesModule } from './modules/student-responses/student-responses.module';
import { StudentHabitsModule } from './modules/student-habits/student-habits.module';
import { MarksModule } from './modules/marks/marks.module';
import { ResultsModule } from './modules/results/results.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'env.example'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    AcademicYearsModule,
    ClassesModule,
    SectionsModule,
    TeachersModule,
    StudentsModule,
    SubjectsModule,
    ExamsModule,
    ExamPapersModule,
    PaperRulesModule,
    QuestionsModule,
    QuestionOptionsModule,
    StudentAttemptsModule,
    StudentResponsesModule,
    StudentHabitsModule,
    MarksModule,
    ResultsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
