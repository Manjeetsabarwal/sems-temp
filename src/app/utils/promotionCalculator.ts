/**
 * Promotion Calculator Utility
 * Calculates promotion status based on marks, attendance, and other criteria
 */

export interface PromotionCriteria {
  overallPercentage: number;
  englishPassed: boolean;
  attendancePercentage: number;
  minimumAttendanceRequired?: number; // Default: 75
  minimumPercentageRequired?: number; // Default: 33
}

export type PromotionStatus = 'Promotion Granted' | 'Promotion Not Granted' | 'On Trial';

export interface PromotionResult {
  status: PromotionStatus;
  retestRequired: boolean;
  retestSubjects?: string[];
  remarks: string;
  date?: string; // Editable promotion date
}

/**
 * Calculate promotion status based on criteria
 * Rules:
 * 1. Individual promotion is based on the child's ability to cope with the next educational step
 * 2. Average marks from examinations and regular assessments are the basis for promotion
 * 3. Failing in English will disqualify a student's promotion
 * 4. 75% attendance is the minimum requirement
 * 5. The school authorities' decision regarding promotion is final
 */
export function calculatePromotion(criteria: PromotionCriteria): PromotionResult {
  const {
    overallPercentage,
    englishPassed,
    attendancePercentage,
    minimumAttendanceRequired = 75,
    minimumPercentageRequired = 33,
  } = criteria;

  // Rule 3: Failing in English disqualifies promotion
  if (!englishPassed) {
    return {
      status: 'Promotion Not Granted',
      retestRequired: true,
      retestSubjects: ['English'],
      remarks: 'Failed in English. Retest required in English.',
    };
  }

  // Rule 4: 75% attendance is minimum requirement
  if (attendancePercentage < minimumAttendanceRequired) {
    return {
      status: 'Promotion Not Granted',
      retestRequired: false,
      remarks: `Attendance (${attendancePercentage.toFixed(1)}%) is below minimum requirement (${minimumAttendanceRequired}%).`,
    };
  }

  // Check overall percentage
  if (overallPercentage < minimumPercentageRequired) {
    return {
      status: 'Promotion Not Granted',
      retestRequired: true,
      remarks: `Overall percentage (${overallPercentage.toFixed(1)}%) is below minimum requirement (${minimumPercentageRequired}%). Retest may be required.`,
    };
  }

  // If all criteria met, grant promotion
  if (overallPercentage >= 50 && attendancePercentage >= minimumAttendanceRequired) {
    return {
      status: 'Promotion Granted',
      retestRequired: false,
      remarks: 'All criteria met. Promotion granted.',
    };
  }

  // Borderline case - On Trial
  if (overallPercentage >= minimumPercentageRequired && overallPercentage < 50) {
    return {
      status: 'On Trial',
      retestRequired: false,
      remarks: 'Borderline performance. Student is on trial for next class.',
    };
  }

  // Default: Not granted
  return {
    status: 'Promotion Not Granted',
    retestRequired: true,
    remarks: 'Does not meet promotion criteria.',
  };
}

/**
 * Check if a specific subject is passed
 */
export function isSubjectPassed(marksObtained: number, totalMarks: number, passingPercentage: number = 33): boolean {
  const percentage = (marksObtained / totalMarks) * 100;
  return percentage >= passingPercentage;
}
