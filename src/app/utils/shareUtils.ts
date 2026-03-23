import jsPDF from 'jspdf';
import type { Result, ReportCard } from '../types';
import { generateResultPDF } from './pdfGenerator';

/**
 * Generate PDF as Blob for sharing
 */
export function generatePDFBlob(
  result: Result | ReportCard,
  schoolName: string = 'School Exam Management System'
): Blob {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Helper function to check if result is ReportCard and get appropriate values
  const getResultValues = () => {
    if ('result' in result) {
      // It's a ReportCard
      return {
        studentName: result.student.name,
        examName: result.exam.examName,
        classId: result.student.className,
        totalMarksObtained: result.result.totalMarksObtained,
        totalMaxMarks: result.result.totalMaxMarks,
        percentage: result.result.percentage,
        grade: result.result.grade,
        isPassed: result.result.isPassed,
        rank: result.result.rank,
        subjects: result.subjects.map(s => ({
          subjectName: s.subjectName,
          marksObtained: s.marksObtained,
          totalMarks: s.totalMarks,
          grade: s.grade,
          isPassed: s.isPassed,
          internalMarks: s.internalMarks,
          externalMarks: s.externalMarks,
        })),
      };
    } else {
      // It's a Result
      return {
        studentName: result.studentName,
        examName: result.examName,
        classId: result.classId,
        totalMarksObtained: result.totalMarksObtained,
        totalMaxMarks: result.totalMaxMarks,
        percentage: result.percentage,
        grade: result.grade,
        isPassed: result.isPassed,
        rank: result.rank,
        subjects: result.subjects.map(s => ({
          subjectName: s.subjectName,
          marksObtained: s.marksObtained,
          maxMarks: s.maxMarks,
          grade: s.grade,
          isPassed: s.isPassed,
          internalMarks: s.internalMarks,
          externalMarks: s.externalMarks,
        })),
      };
    }
  };

  const values = getResultValues();

  // Helper function to add text with auto-wrap
  const addText = (text: string, x: number, y: number, fontSize: number, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    if (align === 'center') {
      doc.text(text, pageWidth / 2, y, { align: 'center' });
    } else if (align === 'right') {
      doc.text(text, pageWidth - margin, y, { align: 'right' });
    } else {
      doc.text(text, x, y);
    }
  };

  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  addText(schoolName, pageWidth / 2, 20, 20, true, 'center');
  addText('EXAMINATION RESULT', pageWidth / 2, 30, 14, true, 'center');
  
  yPos = 50;

  // Student Information Box
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 35, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 35, 'S');

  yPos += 10;
  addText('STUDENT INFORMATION', margin + 5, yPos, 12, true);
  yPos += 8;
  addText(`Name: ${values.studentName}`, margin + 5, yPos, 11);
  yPos += 6;
  addText(`Exam: ${values.examName}`, margin + 5, yPos, 11);
  yPos += 6;
  addText(`Class: ${values.classId}`, margin + 5, yPos, 11);
  if (values.rank) {
    addText(`Rank: ${values.rank}`, pageWidth - margin - 5, yPos, 11);
  }

  yPos += 15;

  // Overall Result Box
  const fillColor: [number, number, number] = values.isPassed ? [220, 252, 231] : [254, 226, 226];
  const drawColor: [number, number, number] = values.isPassed ? [34, 197, 94] : [239, 68, 68];
  doc.setFillColor(...fillColor);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 25, 'F');
  doc.setDrawColor(...drawColor);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 25, 'S');

  yPos += 10;
  addText('OVERALL RESULT', pageWidth / 2, yPos, 14, true, 'center');
  yPos += 8;
  addText(
    `Total: ${values.totalMarksObtained} / ${values.totalMaxMarks} | Percentage: ${values.percentage.toFixed(2)}% | Grade: ${values.grade}`,
    pageWidth / 2,
    yPos,
    11,
    false,
    'center'
  );
  yPos += 6;
  addText(
    values.isPassed ? 'STATUS: PASSED ✓' : 'STATUS: FAILED ✗',
    pageWidth / 2,
    yPos,
    12,
    true,
    'center'
  );

  yPos += 20;

  // Subject-wise Marks Table
  if (values.subjects && values.subjects.length > 0) {
    addText('SUBJECT-WISE MARKS', margin + 5, yPos, 12, true);
    yPos += 8;

    // Table header
    doc.setFillColor(59, 130, 246);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(255, 255, 255);
    addText('Subject', margin + 5, yPos + 6, 10, true);
    addText('Marks', pageWidth / 2 - 20, yPos + 6, 10, true);
    addText('Grade', pageWidth - margin - 30, yPos + 6, 10, true);
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    // Table rows
    values.subjects.forEach((subject: any) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin + 10;
      }
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'S');
      addText(subject.subjectName || 'N/A', margin + 5, yPos, 10);
      addText(
        `${subject.marksObtained || 0} / ${subject.maxMarks || subject.totalMarks || 100}`,
        pageWidth / 2 - 20,
        yPos,
        10
      );
      addText(subject.grade || 'N/A', pageWidth - margin - 30, yPos, 10);
      yPos += 8;
    });
  }

  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  addText(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, footerY, 8, false, 'center');
  addText('This is a computer-generated document', pageWidth / 2, footerY + 5, 8, false, 'center');

  // Convert to blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

/**
 * Share PDF via WhatsApp
 */
export function shareViaWhatsApp(
  result: Result | ReportCard,
  recipientPhone?: string
): void {
  // Helper function to get values based on type
  const getValues = () => {
    if ('result' in result) {
      // It's a ReportCard
      return {
        studentName: result.student.name,
        examName: result.exam.examName,
        classId: result.student.className,
        totalMarksObtained: result.result.totalMarksObtained,
        totalMaxMarks: result.result.totalMaxMarks,
        percentage: result.result.percentage,
        grade: result.result.grade,
        isPassed: result.result.isPassed,
      };
    } else {
      // It's a Result
      return {
        studentName: result.studentName,
        examName: result.examName,
        classId: result.classId,
        totalMarksObtained: result.totalMarksObtained,
        totalMaxMarks: result.totalMaxMarks,
        percentage: result.percentage,
        grade: result.grade,
        isPassed: result.isPassed,
      };
    }
  };

  const values = getValues();

  const message = `📊 *Exam Result*\n\n` +
    `*Student:* ${values.studentName}\n` +
    `*Exam:* ${values.examName}\n` +
    `*Class:* ${values.classId}\n` +
    `*Total Marks:* ${values.totalMarksObtained}/${values.totalMaxMarks}\n` +
    `*Percentage:* ${values.percentage.toFixed(2)}%\n` +
    `*Grade:* ${values.grade}\n` +
    `*Status:* ${values.isPassed ? 'PASSED ✓' : 'FAILED ✗'}\n\n` +
    `Please find the PDF attached.`;

  const encodedMessage = encodeURIComponent(message);
  
  // WhatsApp Web URL format: https://wa.me/?text=message
  // If phone number provided: https://wa.me/PHONENUMBER?text=message
  let whatsappUrl: string;
  if (recipientPhone) {
    const phoneNumber = recipientPhone.replace(/[^0-9]/g, '');
    whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  } else {
    whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  }
  
  window.open(whatsappUrl, '_blank');
}

/**
 * Share PDF via Email using mailto
 */
export function shareViaEmail(
  result: Result | ReportCard,
  recipientEmail?: string
): void {
  // Helper function to get values based on type
  const getValues = () => {
    if ('result' in result) {
      // It's a ReportCard
      return {
        studentName: result.student.name,
        examName: result.exam.examName,
        classId: result.student.className,
        totalMarksObtained: result.result.totalMarksObtained,
        totalMaxMarks: result.result.totalMaxMarks,
        percentage: result.result.percentage,
        grade: result.result.grade,
        isPassed: result.result.isPassed,
      };
    } else {
      // It's a Result
      return {
        studentName: result.studentName,
        examName: result.examName,
        classId: result.classId,
        totalMarksObtained: result.totalMarksObtained,
        totalMaxMarks: result.totalMaxMarks,
        percentage: result.percentage,
        grade: result.grade,
        isPassed: result.isPassed,
      };
    }
  };

  const values = getValues();

  const subject = encodeURIComponent(`Exam Result - ${values.studentName} - ${values.examName}`);
  const body = encodeURIComponent(
    `Dear Parent/Guardian,\n\n` +
    `Please find the exam result for ${values.studentName} attached.\n\n` +
    `Exam: ${values.examName}\n` +
    `Class: ${values.classId}\n` +
    `Total Marks: ${values.totalMarksObtained}/${values.totalMaxMarks}\n` +
    `Percentage: ${values.percentage.toFixed(2)}%\n` +
    `Grade: ${values.grade}\n` +
    `Status: ${values.isPassed ? 'PASSED' : 'FAILED'}\n\n` +
    `Please find the PDF attached.\n\n` +
    `Best regards,\nSchool Administration`
  );

  // mailto URL format: mailto:email?subject=...&body=...
  let mailtoUrl: string;
  if (recipientEmail) {
    mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${subject}&body=${body}`;
  } else {
    mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
  }
  
  window.location.href = mailtoUrl;
}

/**
 * Share PDF via Email with attachment (using email service)
 * This requires the PDF to be sent through the backend email service
 */
export async function shareViaEmailWithAttachment(
  result: Result | ReportCard,
  recipientEmail: string,
  studentEmail?: string,
  parentEmail?: string
): Promise<void> {
  try {
    // Helper function to get values based on type
    const getValues = () => {
      if ('result' in result) {
        // It's a ReportCard
        return {
          studentName: result.student.name,
          examName: result.exam.examName,
          classId: result.student.className,
          totalMarksObtained: result.result.totalMarksObtained,
          totalMaxMarks: result.result.totalMaxMarks,
          percentage: result.result.percentage,
          grade: result.result.grade,
          isPassed: result.result.isPassed,
          resultId: result.result.resultId,
        };
      } else {
        // It's a Result
        return {
          studentName: result.studentName,
          examName: result.examName,
          classId: result.classId,
          totalMarksObtained: result.totalMarksObtained,
          totalMaxMarks: result.totalMaxMarks,
          percentage: result.percentage,
          grade: result.grade,
          isPassed: result.isPassed,
          resultId: result.resultId,
        };
      }
    };

    const values = getValues();

    // Generate PDF blob
    const pdfBlob = generatePDFBlob(result);
    const pdfBase64 = await blobToBase64(pdfBlob);
    const fileName = `Result_${values.studentName.replace(/\s+/g, '_')}_${values.examName.replace(/\s+/g, '_')}.pdf`;

    // Call backend API to send email with PDF attachment
    const response = await fetch('/api/results/share-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resultId: values.resultId,
        recipientEmail,
        studentEmail,
        parentEmail,
        pdfBase64,
        fileName,
        subject: `Exam Result - ${values.studentName} - ${values.examName}`,
        body: `Dear Parent/Guardian,\n\nPlease find the exam result for ${values.studentName} attached.\n\nExam: ${values.examName}\nClass: ${values.classId}\nTotal Marks: ${values.totalMarksObtained}/${values.totalMaxMarks}\nPercentage: ${values.percentage.toFixed(2)}%\nGrade: ${values.grade}\nStatus: ${values.isPassed ? 'PASSED' : 'FAILED'}\n\nBest regards,\nSchool Administration`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Error sharing via email:', error);
    throw error;
  }
}

/**
 * Convert blob to base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Download PDF and prepare for sharing
 * This function downloads the PDF first, then the share functions will open WhatsApp/Email
 */
export function downloadPDFForSharing(
  result: Result | ReportCard,
  schoolName: string = 'School Exam Management System'
): void {
  // Download the PDF first
  generateResultPDF(result, schoolName);
}
