
export class CreateAttendanceDto {
  lectureId: number;

  studentId: string;

  status: 'present' | 'absent' | 'late' | 'excused';

  notes?: string;
}

export class AttendanceRecordDto {
  studentId: string;

  status: 'present' | 'absent' | 'late' | 'excused';

  notes?: string;
}

export class BulkMarkAttendanceDto {
  lectureId: number;

  records: AttendanceRecordDto[];
}
