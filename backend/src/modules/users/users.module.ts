import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Student } from '../students/student.entity';
import { Teacher } from '../teachers/teacher.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Student, Teacher])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
