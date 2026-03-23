
export class CreateStudentHabitDto {
  habitId: string;

  studentId: string;

  academicYear: string;

  habitName: 'Courteous' | 'Art/Craft' | 'Responsibility' | 'Systematic' | 'Sports' | 'Elocution' | 'Gen.Knowledge' | 'Cultural Activities' | 'Cleanliness' | 'Hindi Oral' | 'English Oral';

  term1Grade?: 'A' | 'B' | 'C' | 'D' | 'E';

  term2Grade?: 'A' | 'B' | 'C' | 'D' | 'E';

  remarks?: string;
}
