
export class CreateSectionDto {
  sectionId: string;

  sectionName: string;

  // Optional - kept for backward compatibility
  classId?: string;

  // Multiple classes (new - for many-to-many relationship)
  classIds?: string[];

  capacity?: number;

  currentStrength?: number;

  roomNumber?: string;

  status?: string;
}
