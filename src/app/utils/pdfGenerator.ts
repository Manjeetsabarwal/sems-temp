import jsPDF from 'jspdf';
import type { Result, ReportCard } from '../types';

/**
 * Generate a PDF for a single result (notice board format)
 * Supports V2 with internal/external marks breakdown
 */
export function generateResultPDF(
  result: Result | ReportCard, 
  schoolName: string = 'School Exam Management System',
  version: 'v2' = 'v2' // V2 is the final version
): void {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Helper function to add text with auto-wrap
  const addText = (text: string, x: number, y: number, fontSize: number, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const textWidth = doc.getTextWidth(text);
    if (align === 'center') {
      doc.text(text, pageWidth / 2, y, { align: 'center' });
    } else if (align === 'right') {
      doc.text(text, pageWidth - margin, y, { align: 'right' });
    } else {
      doc.text(text, x, y);
    }
    return textWidth;
  };

  // Header
  doc.setFillColor(59, 130, 246); // Blue
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  addText(schoolName, pageWidth / 2, 20, 20, true, 'center');
  addText('EXAMINATION RESULT', pageWidth / 2, 30, 14, true, 'center');
  
  yPos = 50;

  // Student Information Box
  doc.setFillColor(249, 250, 251); // Light gray
  doc.rect(margin, yPos, pageWidth - 2 * margin, 55, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 55, 'S');

  // Helper to safely get properties from either Result or ReportCard
  const isReportCard = (r: any): r is ReportCard => 'student' in r && typeof r.student === 'object';
  
  const studentName = isReportCard(result) ? result.student.name : result.studentName;
  const examName = isReportCard(result) ? result.exam.examName : result.examName;
  const classId = isReportCard(result) ? result.student.classId : result.classId;
  const dob = isReportCard(result) ? result.student.dateOfBirth : result.dateOfBirth;
  const fatherName = isReportCard(result) ? result.student.fatherName : result.fatherName;
  const motherName = isReportCard(result) ? result.student.motherName : result.motherName;
  const rank = isReportCard(result) ? result.result.rank : result.rank;

  yPos += 10;
  addText('STUDENT INFORMATION', margin + 5, yPos, 12, true);
  yPos += 8;
  addText(`Name: ${studentName}`, margin + 5, yPos, 11);
  yPos += 6;
  addText(`Exam: ${examName}`, margin + 5, yPos, 11);
  yPos += 6;
  addText(`Class: ${classId}`, margin + 5, yPos, 11);
  yPos += 6;
  addText(`DOB: ${dob || '-'}`, margin + 5, yPos, 11);
  yPos += 6;
  addText(`Father's Name: ${fatherName || '-'}`, margin + 5, yPos, 11);
  yPos += 6;
  addText(`Mother's Name: ${motherName || '-'}`, margin + 5, yPos, 11);
  if (rank) {
    addText(`Rank: ${rank}`, pageWidth - margin - 5, yPos, 11, false, 'right');
  }

  yPos += 20;

  // Overall Result Box
  const isPassed = isReportCard(result) ? result.result.isPassed : result.isPassed;
  const totalMarksObtained = isReportCard(result) ? result.result.totalMarksObtained : result.totalMarksObtained;
  const totalMaxMarks = isReportCard(result) ? result.result.totalMaxMarks : result.totalMaxMarks;
  const percentage = isReportCard(result) ? result.result.percentage : result.percentage;
  const grade = isReportCard(result) ? result.result.grade : result.grade;
  const statusText = isPassed ? 'PASSED' : 'FAILED';

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(2);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 30, 'FD');

  yPos += 10;
  addText('OVERALL RESULT', pageWidth / 2, yPos, 14, true, 'center');
  yPos += 10;

  const resultColor = isPassed ? [34, 197, 94] : [239, 68, 68]; // Green or Red
  doc.setFillColor(resultColor[0], resultColor[1], resultColor[2]);
  doc.rect(margin + 10, yPos - 5, pageWidth - 2 * margin - 20, 15, 'F');

  const totalMarksStr = `Total Marks: ${totalMarksObtained} / ${totalMaxMarks}`;
  const percentageStr = `Percentage: ${percentage.toFixed(2)}%`;
  const gradeStr = `Grade: ${grade}`;

  addText(totalMarksStr, margin + 15, yPos + 3, 11, true);
  addText(percentageStr, pageWidth / 2, yPos + 3, 11, true, 'center');
  addText(gradeStr, pageWidth - margin - 15, yPos + 3, 11, true, 'right');
  yPos += 8;
  addText(statusText, pageWidth / 2, yPos + 3, 12, true, 'center');

  yPos += 25;

  // Subject-wise Marks Table
  if (result.subjects && result.subjects.length > 0) {
    addText('SUBJECT-WISE MARKS', pageWidth / 2, yPos, 12, true, 'center');
    yPos += 8;

    // V2 is the final version - check if breakdown data is available
    const hasBreakdown = result.subjects.some((s: any) => s.internalMarks !== undefined || s.breakdown);

    if (hasBreakdown) {
      // V2: Table with Internal/External breakdown
      // Calculate column widths (A4 portrait: ~180mm usable width, margin 15mm each side = 150mm)
      const usableWidth = pageWidth - 2 * margin; // ~150mm
      const subjectWidth = 50;
      const internalWidth = 30;
      const externalWidth = 25;
      const totalWidth = 25;
      const gradeWidth = 20;
      
      // Table Header - Single row for V2
      doc.setFillColor(59, 130, 246);
      doc.rect(margin, yPos, usableWidth, 10, 'F');
      
      let xPos = margin;
      addText('Subject', xPos + 5, yPos + 7, 9, true);
      xPos += subjectWidth;
      addText('Internal (20)', xPos + internalWidth / 2, yPos + 7, 9, true, 'center');
      xPos += internalWidth;
      addText('External (80)', xPos + externalWidth / 2, yPos + 7, 9, true, 'center');
      xPos += externalWidth;
      addText('Total (100)', xPos + totalWidth / 2, yPos + 7, 9, true, 'center');
      xPos += totalWidth;
      addText('Grade', pageWidth - margin - 5, yPos + 7, 9, true, 'right');
      
      yPos += 10;

      // Table Rows
      result.subjects.forEach((subject: any, index: number) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = margin;
        }

        const bgColor = index % 2 === 0 ? [249, 250, 251] : [255, 255, 255];
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(margin, yPos, usableWidth, 12, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPos, usableWidth, 12, 'S');

        const breakdown = subject.breakdown || {
          unitTest: subject.unitTestMarks || 0,
          assignment: subject.assignmentMarks || 0,
          attendance: subject.attendanceMarks || 0,
          external: subject.externalMarks || 0,
        };
        const internalTotal = (breakdown.unitTest || 0) + (breakdown.assignment || 0) + (breakdown.attendance || 0);
        const externalTotal = breakdown.external || subject.externalMarks || 0;
        const totalMarks = internalTotal + externalTotal;

        xPos = margin;
        // Subject name (truncate if too long)
        let subjectName = subject.subjectName || 'Subject';
        if (subjectName.length > 18) {
          subjectName = subjectName.substring(0, 15) + '...';
        }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(subjectName, xPos + 5, yPos + 7);
        
        // Internal marks (with breakdown in small text below)
        xPos += subjectWidth;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(internalTotal.toFixed(2), xPos + internalWidth / 2, yPos + 5, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        const breakdownText = `UT:${(breakdown.unitTest || 0).toFixed(1)} A:${(breakdown.assignment || 0).toFixed(1)} At:${(breakdown.attendance || 0).toFixed(1)}`;
        doc.text(breakdownText, xPos + internalWidth / 2, yPos + 9.5, { align: 'center' });
        
        // External marks
        xPos += internalWidth;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(externalTotal.toFixed(2), xPos + externalWidth / 2, yPos + 7, { align: 'center' });
        
        // Total marks
        xPos += externalWidth;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(totalMarks.toFixed(2), xPos + totalWidth / 2, yPos + 7, { align: 'center' });
        
        // Grade
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(subject.grade || 'N/A', pageWidth - margin - 5, yPos + 7, { align: 'right' });

        yPos += 12;
      });
    } else {
      // V2: Table with Internal/External Marks breakdown (Final Version)
      const usableWidth = pageWidth - 2 * margin;
      const subjectWidth = 50;
      const internalWidth = 25;
      const externalWidth = 25;
      const maxMarksWidth = 20;
      const obtainedWidth = 25;
      const gradeWidth = 20;

      // Table Header
      doc.setFillColor(59, 130, 246);
      doc.rect(margin, yPos, usableWidth, 10, 'F');
      
      let xPos = margin;
      addText('Subject', xPos + 5, yPos + 7, 9, true);
      xPos += subjectWidth;
      addText('Internal', xPos + internalWidth / 2, yPos + 7, 9, true, 'center');
      xPos += internalWidth;
      addText('External', xPos + externalWidth / 2, yPos + 7, 9, true, 'center');
      xPos += externalWidth;
      addText('Max', xPos + maxMarksWidth / 2, yPos + 7, 9, true, 'center');
      xPos += maxMarksWidth;
      addText('Obtained', xPos + obtainedWidth / 2, yPos + 7, 9, true, 'center');
      xPos += obtainedWidth;
      addText('Grade', xPos + gradeWidth / 2, yPos + 7, 9, true, 'center');

      yPos += 10;

      // Table Rows
      result.subjects.forEach((subject: any, index: number) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = margin;
        }

        const bgColor = index % 2 === 0 ? [249, 250, 251] : [255, 255, 255];
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(margin, yPos, usableWidth, 8, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPos, usableWidth, 8, 'S');

        xPos = margin;
        
        // Subject name
        const subjectName = (subject.subjectName || 'Subject').substring(0, 20);
        addText(subjectName, xPos + 2, yPos + 6, 9);
        xPos += subjectWidth;
        
        // Internal marks
        const internalMarks = (subject.internalMarks || 0).toFixed(1);
        addText(internalMarks, xPos + internalWidth / 2, yPos + 6, 9, false, 'center');
        xPos += internalWidth;
        
        // External marks
        const externalMarks = (subject.externalMarks || 0).toFixed(1);
        addText(externalMarks, xPos + externalWidth / 2, yPos + 6, 9, false, 'center');
        xPos += externalWidth;
        
        // Max marks
        const maxMarks = (subject.maxMarks || subject.totalMarks || 100).toString();
        addText(maxMarks, xPos + maxMarksWidth / 2, yPos + 6, 9, false, 'center');
        xPos += maxMarksWidth;
        
        // Obtained marks
        const marksObtained = (subject.marksObtained || 0).toFixed(1);
        addText(marksObtained, xPos + obtainedWidth / 2, yPos + 6, 9, false, 'center');
        xPos += obtainedWidth;
        
        // Grade
        addText(subject.grade || 'N/A', xPos + gradeWidth / 2, yPos + 6, 9, false, 'center');

        yPos += 8;
      });
      
      // Total row
      doc.setFillColor(220, 220, 220);
      doc.rect(margin, yPos, usableWidth, 8, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPos, usableWidth, 8, 'S');
      
      xPos = margin;
      addText('TOTAL', xPos + 5, yPos + 6, 9, true);
      xPos += subjectWidth;
      
      // Total internal
      const totalInternal = result.subjects.reduce((sum: number, s: any) => sum + (s.internalMarks || 0), 0);
      addText(totalInternal.toFixed(1), xPos + internalWidth / 2, yPos + 6, 9, true, 'center');
      xPos += internalWidth;
      
      // Total external
      const totalExternal = result.subjects.reduce((sum: number, s: any) => sum + (s.externalMarks || 0), 0);
      addText(totalExternal.toFixed(1), xPos + externalWidth / 2, yPos + 6, 9, true, 'center');
      xPos += externalWidth;
      
      // Total max
      const totalMax = isReportCard(result) ? result.result.totalMaxMarks : result.totalMaxMarks;
      addText(totalMax.toString(), xPos + maxMarksWidth / 2, yPos + 6, 9, true, 'center');
      xPos += maxMarksWidth;
      
      // Total obtained
      const totalObtained = isReportCard(result) ? result.result.totalMarksObtained : result.totalMarksObtained;
      addText(totalObtained.toFixed(1), xPos + obtainedWidth / 2, yPos + 6, 9, true, 'center');
      
      yPos += 8;
    }
  }

  yPos += 10;

  // Remarks Section
  if (result.remarks) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFillColor(249, 250, 251);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 20, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 20, 'S');

    yPos += 8;
    addText('REMARKS', margin + 5, yPos, 11, true);
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const remarks = isReportCard(result) ? result.remarks.teacher : result.remarks;
    const remarksLines = doc.splitTextToSize(remarks || '', pageWidth - 2 * margin - 10);
    doc.text(remarksLines, margin + 5, yPos);
  }

  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  addText(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, footerY, 8, false, 'center');
  addText('This is a computer-generated document', pageWidth / 2, footerY + 5, 8, false, 'center');

  // Save PDF
  const fileName = `Result_${studentName.replace(/\s+/g, '_')}_${examName.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}

/**
 * Generate a PDF for multiple results (notice board format - one per page)
 */
export function generateBulkResultsPDF(results: Result[], schoolName: string = 'School Exam Management System'): void {
  results.forEach((result, index) => {
    if (index > 0) {
      // Small delay to prevent browser blocking multiple downloads
      setTimeout(() => {
        generateResultPDF(result, schoolName);
      }, index * 500);
    } else {
      generateResultPDF(result, schoolName);
    }
  });
}

/**
 * Generate a notice board PDF with all results in a table format
 */
export function generateNoticeBoardPDF(
  results: Result[],
  examName: string,
  className: string,
  schoolName: string = 'School Exam Management System'
): void {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  let yPos = margin;

  // Helper function - Fixed to use actual x position for alignment (not page center)
  const addText = (text: string, x: number, y: number, fontSize: number, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    // Always use the x position passed, not pageWidth/2
    if (align === 'center') {
      doc.text(text, x, y, { align: 'center' });
    } else if (align === 'right') {
      doc.text(text, x, y, { align: 'right' });
    } else {
      doc.text(text, x, y, { align: 'left' });
    }
  };

  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 25, 'F');
  addText(schoolName, pageWidth / 2, 12, 16, true, 'center');
  addText('EXAMINATION RESULTS - NOTICE BOARD', pageWidth / 2, 20, 12, true, 'center');
  
  yPos = 30;

  // Exam and Class Info
  addText(`Exam: ${examName} | Class: ${className}`, pageWidth / 2, yPos, 10, true, 'center');
  yPos += 8;

  // Table Header - Adjusted column widths for better fit (total ~270mm for A4 landscape)
  const colWidths = [25, 70, 25, 25, 30, 20, 25, 20];
  const headers = ['Rank', 'Student Name', 'Total', 'Max', 'Percentage', 'Grade', 'Status', 'Result'];
  let xPos = margin;

  doc.setFillColor(59, 130, 246);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
  
  headers.forEach((header, index) => {
    const cellCenter = xPos + colWidths[index] / 2;
    addText(header, cellCenter, yPos + 7, 9, true, 'center');
    xPos += colWidths[index];
  });

  yPos += 10;

  // Table Rows
  results.forEach((result, index) => {
    if (yPos > pageHeight - 15) {
      doc.addPage();
      yPos = margin;
      // Redraw header
      doc.setFillColor(59, 130, 246);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
      xPos = margin;
      headers.forEach((header, idx) => {
        const cellCenter = xPos + colWidths[idx] / 2;
        addText(header, cellCenter, yPos + 7, 9, true, 'center');
        xPos += colWidths[idx];
      });
      yPos += 10;
    }

    const bgColor = index % 2 === 0 ? [249, 250, 251] : [255, 255, 255];
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'S');

    xPos = margin;
    const rowData = [
      result.rank?.toString() || 'N/A',
      result.studentName || 'N/A',
      result.totalMarksObtained?.toString() || '0',
      result.totalMaxMarks?.toString() || '0',
      `${result.percentage?.toFixed(1) || '0.0'}%`,
      result.grade || 'N/A',
      result.isPassed ? 'PASS' : 'FAIL',
      result.isPassed ? 'YES' : 'NO', // Result column: YES for pass, NO for fail
    ];

    rowData.forEach((data, idx) => {
      const cellCenter = xPos + colWidths[idx] / 2;
      // Truncate long student names to fit in cell
      let displayText = data;
      if (idx === 1 && data.length > 25) {
        displayText = data.substring(0, 22) + '...';
      }
      addText(displayText, cellCenter, yPos + 6, 8, false, 'center');
      xPos += colWidths[idx];
    });

    yPos += 8;
  });

  // Footer
  const footerY = pageHeight - 10;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  addText(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, footerY, 8, false, 'center');

  // Save PDF
  const fileName = `NoticeBoard_${examName.replace(/\s+/g, '_')}_${className.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}

/**
 * Generate Template 2 PDF (CBSE Style - Term 1 + Term 2)
 */
export function generateTemplate2PDF(data: any): void {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  let yPos = margin;

  // Helper function to add text
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

  // Header Box
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 25, 'S');
  
  addText(data.schoolName || 'School Exam Management System', pageWidth / 2, yPos + 8, 14, true, 'center');
  addText(data.schoolAddress || 'Address', pageWidth / 2, yPos + 14, 8, false, 'center');
  addText('REPORT CARD', pageWidth / 2, yPos + 21, 12, true, 'center');
  
  yPos += 30;

  // Student Information
  doc.rect(margin, yPos, pageWidth - 2 * margin, 20, 'S');
  
  const col1X = margin + 5;
  const col2X = pageWidth / 2 + 5;
  
  addText(`Student Name: ${data.student?.name || '-'}`, col1X, yPos + 6, 9, false);
  addText(`Class: ${data.student?.className || '-'} - ${data.student?.sectionName || '-'}`, col1X, yPos + 12, 9, false);
  addText(`Roll No: ${data.student?.rollNo || '-'}`, col1X, yPos + 18, 9, false);
  
  addText(`Academic Year: ${data.academicYear || '-'}`, col2X, yPos + 6, 9, false);
  addText(`DOB: ${data.student?.dateOfBirth || '-'}`, col2X, yPos + 12, 9, false);
  addText(`Father's Name: ${data.student?.fatherName || '-'}`, col2X, yPos + 18, 9, false);
  addText(`Mother's Name: ${data.student?.motherName || '-'}`, col2X, yPos + 24, 9, false);
  
  yPos += 25;

  // Part I: Scholastic Areas Header
  doc.setFillColor(200, 220, 255);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'S');
  addText('Part I: Scholastic Areas', pageWidth / 2, yPos + 6, 10, true, 'center');
  
  yPos += 10;

  // Table Headers
  const colWidths = [35, 8, 8, 8, 12, 12, 8, 8, 8, 12, 12, 15, 10];
  const headers = ['Subject', 'PT', 'NB', 'SE', 'HY', 'T1', 'PT', 'NB', 'SE', 'Ann', 'T2', 'Total', 'Gr'];
  
  // First header row
  let xPos = margin;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F');
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'S');
  
  // Draw column separators
  xPos = margin;
  colWidths.forEach((width, idx) => {
    doc.line(xPos, yPos, xPos, yPos + 6);
    addText(headers[idx], xPos + width / 2, yPos + 4.5, 6, true, 'center');
    xPos += width;
  });
  
  yPos += 7;

  // Subject rows
  const subjects = data.subjects || [];
  subjects.forEach((subject: any, idx: number) => {
    const rowHeight = 6;
    
    // Alternate row colors
    if (idx % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(250, 250, 250);
    }
    doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'F');
    doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'S');
    
    xPos = margin;
    const rowData = [
      subject.subjectName?.substring(0, 15) || '-',
      subject.term1?.periodicTest?.toFixed(0) || '0',
      subject.term1?.noteBook?.toFixed(0) || '0',
      subject.term1?.subEnrichment?.toFixed(0) || '0',
      subject.term1?.halfYearly?.toFixed(0) || '0',
      subject.term1?.total?.toFixed(0) || '0',
      subject.term2?.periodicTest?.toFixed(0) || '0',
      subject.term2?.noteBook?.toFixed(0) || '0',
      subject.term2?.subEnrichment?.toFixed(0) || '0',
      subject.term2?.annual?.toFixed(0) || '0',
      subject.term2?.total?.toFixed(0) || '0',
      subject.grandTotal?.toFixed(0) || '0',
      subject.finalGrade || '-',
    ];
    
    rowData.forEach((cellData, colIdx) => {
      doc.line(xPos, yPos, xPos, yPos + rowHeight);
      const cellX = colIdx === 0 ? xPos + 2 : xPos + colWidths[colIdx] / 2;
      const align = colIdx === 0 ? 'left' : 'center';
      addText(cellData, cellX, yPos + 4.5, 6, false, align as any);
      xPos += colWidths[colIdx];
    });
    
    yPos += rowHeight;
  });

  // Total row
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F');
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'S');
  
  xPos = margin;
  addText('TOTAL', xPos + 2, yPos + 4.5, 6, true);
  xPos += colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4];
  addText(data.term1Total?.toFixed(0) || '0', xPos + colWidths[5] / 2, yPos + 4.5, 6, true, 'center');
  xPos += colWidths[5] + colWidths[6] + colWidths[7] + colWidths[8] + colWidths[9];
  addText(data.term2Total?.toFixed(0) || '0', xPos + colWidths[10] / 2, yPos + 4.5, 6, true, 'center');
  xPos += colWidths[10];
  addText(data.grandTotal?.toFixed(0) || '0', xPos + colWidths[11] / 2, yPos + 4.5, 6, true, 'center');
  xPos += colWidths[11];
  addText(data.overallGrade || '-', xPos + colWidths[12] / 2, yPos + 4.5, 6, true, 'center');
  
  yPos += 10;

  // Part II: Co-Scholastic Areas
  doc.setFillColor(200, 255, 200);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'S');
  addText('Part II: Co-Scholastic Areas', pageWidth / 2, yPos + 6, 10, true, 'center');
  
  yPos += 10;

  // Co-Scholastic table
  const coScholasticAreas = data.coScholasticAreas || [];
  const csColWidths = [100, 35, 35];
  
  // Headers
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F');
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'S');
  
  xPos = margin;
  addText('Area', xPos + 5, yPos + 4.5, 7, true);
  xPos += csColWidths[0];
  addText('Term 1', xPos + csColWidths[1] / 2, yPos + 4.5, 7, true, 'center');
  xPos += csColWidths[1];
  addText('Term 2', xPos + csColWidths[2] / 2, yPos + 4.5, 7, true, 'center');
  
  yPos += 7;

  coScholasticAreas.forEach((area: any, idx: number) => {
    if (idx % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(250, 250, 250);
    }
    doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F');
    doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'S');
    
    xPos = margin;
    addText(area.area || '-', xPos + 5, yPos + 4.5, 7, false);
    xPos += csColWidths[0];
    addText(area.term1Grade || '-', xPos + csColWidths[1] / 2, yPos + 4.5, 7, false, 'center');
    xPos += csColWidths[1];
    addText(area.term2Grade || '-', xPos + csColWidths[2] / 2, yPos + 4.5, 7, false, 'center');
    
    yPos += 6;
  });

  yPos += 5;

  // Result Summary
  doc.setFillColor(255, 255, 200);
  doc.rect(margin, yPos, (pageWidth - 2 * margin) / 2 - 2, 30, 'F');
  doc.rect(margin, yPos, (pageWidth - 2 * margin) / 2 - 2, 30, 'S');
  
  addText('Summary', margin + 5, yPos + 6, 9, true);
  addText(`Term 1: ${data.term1Total?.toFixed(0) || '0'} (${data.term1Percentage?.toFixed(1) || '0'}%)`, margin + 5, yPos + 13, 8, false);
  addText(`Term 2: ${data.term2Total?.toFixed(0) || '0'} (${data.term2Percentage?.toFixed(1) || '0'}%)`, margin + 5, yPos + 19, 8, false);
  addText(`Grand Total: ${data.grandTotal?.toFixed(0) || '0'}`, margin + 5, yPos + 25, 8, false);

  // Result box
  const resultBoxX = margin + (pageWidth - 2 * margin) / 2 + 2;
  doc.setFillColor(200, 255, 200);
  doc.rect(resultBoxX, yPos, (pageWidth - 2 * margin) / 2 - 2, 30, 'F');
  doc.rect(resultBoxX, yPos, (pageWidth - 2 * margin) / 2 - 2, 30, 'S');
  
  addText('Result', resultBoxX + 5, yPos + 6, 9, true);
  addText(data.result || 'N/A', resultBoxX + 40, yPos + 16, 16, true, 'center');
  addText(`Grade: ${data.overallGrade || '-'}`, resultBoxX + 5, yPos + 25, 8, false);

  yPos += 35;

  // Grading Scale
  doc.setFontSize(7);
  addText('Grading Scale: A1(91-100) | A2(81-90) | B1(71-80) | B2(61-70) | C1(51-60) | C2(41-50) | D(33-40) | E(<33)', margin, yPos, 7, false);
  
  yPos += 10;

  // Signatures
  const sigWidth = (pageWidth - 2 * margin) / 3;
  
  doc.line(margin, yPos + 10, margin + sigWidth - 10, yPos + 10);
  addText('Class Teacher', margin + sigWidth / 2 - 15, yPos + 15, 8, false);
  
  doc.line(margin + sigWidth, yPos + 10, margin + 2 * sigWidth - 10, yPos + 10);
  addText('Principal', margin + 1.5 * sigWidth - 10, yPos + 15, 8, false);
  
  doc.line(margin + 2 * sigWidth, yPos + 10, pageWidth - margin, yPos + 10);
  addText("Parent's Signature", margin + 2.5 * sigWidth - 15, yPos + 15, 8, false);

  // Footer
  const footerY = pageHeight - 10;
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  addText(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, footerY, 7, false, 'center');

  // Save PDF
  const fileName = `ReportCard_Template2_${data.student?.name?.replace(/\s+/g, '_') || 'Student'}_${data.academicYear?.replace(/\s+/g, '_') || 'AY'}.pdf`;
  doc.save(fileName);
}

/**
 * Generate Template 3 PDF (Two Pages: Descriptive Marks + Signatures)
 */
export function generateTemplate3PDF(data: any): void {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  let yPos = margin;

  // Helper function to add text
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

  // ========== PAGE 1: Descriptive Marks ==========
  
  // School Header
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 25, 'S');
  
  addText(data.schoolName || 'School Exam Management System', pageWidth / 2, yPos + 8, 12, true, 'center');
  addText(data.schoolAddress || 'Address', pageWidth / 2, yPos + 13, 7, false, 'center');
  if (data.schoolPhone) addText(`Phone: ${data.schoolPhone}`, pageWidth / 2, yPos + 17, 6, false, 'center');
  if (data.schoolEmail) addText(`Email: ${data.schoolEmail}`, pageWidth / 2, yPos + 20, 6, false, 'center');
  
  doc.setFillColor(200, 200, 200);
  doc.rect(margin, yPos + 22, pageWidth - 2 * margin, 3, 'F');
  addText('PROGRESS REPORT', pageWidth / 2, yPos + 24, 10, true, 'center');
  addText(`SESSION: ${data.academicYear || '-'}`, pageWidth / 2, yPos + 28, 7, false, 'center');
  
  yPos += 32;

  // Student Details
  doc.rect(margin, yPos, pageWidth - 2 * margin, 18, 'S');
  const col1X = margin + 5;
  const col2X = pageWidth / 2 + 5;
  
  addText(`Name: ${data.student?.name || '-'}`, col1X, yPos + 5, 8, false);
  addText(`Std: ${data.student?.std || '-'}`, col1X, yPos + 10, 8, false);
  addText(`Class/Sec: ${data.student?.classSection || '-'}`, col1X, yPos + 15, 8, false);
  
  addText(`Roll No: ${data.student?.rollNo || '-'}`, col2X, yPos + 5, 8, false);
  addText(`DOB: ${data.student?.dateOfBirth || '-'}`, col2X, yPos + 10, 8, false);
  addText(`Father: ${data.student?.fatherName || '-'}`, col2X, yPos + 15, 8, false);
  addText(`Mother: ${data.student?.motherName || '-'}`, col2X, yPos + 20, 8, false);
  
  yPos += 22;

  // Main Academic Performance Table
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F');
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'S');
  addText('SCHOLASTIC AREAS', pageWidth / 2, yPos + 4.5, 9, true, 'center');
  yPos += 8;

  // Table headers
  const colWidths = [35, 12, 12, 12, 12, 12, 12, 12, 12, 10];
  const headerRow1 = ['Subject', 'Full Marks', '1st Term', 'Final Term', 'Final Aggregate', 'Highest %'];
  const headerRow2 = ['', '', 'Assessment (20)', 'Written (80)', '% (100)', 'Assessment (20)', 'Written (80)', '% (100)', 'Total', '%'];
  
  // First header row
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 5, 'F');
  doc.rect(margin, yPos, pageWidth - 2 * margin, 5, 'S');
  
  let xPos = margin;
  addText('Subject', xPos + 2, yPos + 3.5, 6, true);
  xPos += colWidths[0];
  addText('Full Marks', xPos + colWidths[1] / 2, yPos + 3.5, 6, true, 'center');
  xPos += colWidths[1];
  addText('1st Term', xPos + (colWidths[2] + colWidths[3] + colWidths[4]) / 2, yPos + 3.5, 6, true, 'center');
  xPos += colWidths[2] + colWidths[3] + colWidths[4];
  addText('Final Term', xPos + (colWidths[5] + colWidths[6] + colWidths[7]) / 2, yPos + 3.5, 6, true, 'center');
  xPos += colWidths[5] + colWidths[6] + colWidths[7];
  addText('Final Aggregate', xPos + (colWidths[8] + colWidths[9]) / 2, yPos + 3.5, 6, true, 'center');
  
  yPos += 6;

  // Second header row
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 5, 'F');
  doc.rect(margin, yPos, pageWidth - 2 * margin, 5, 'S');
  
  xPos = margin;
  addText('', xPos + 2, yPos + 3.5, 6, false);
  xPos += colWidths[0];
  addText('', xPos + colWidths[1] / 2, yPos + 3.5, 6, false, 'center');
  xPos += colWidths[1];
  addText('Assessment (20)', xPos + colWidths[2] / 2, yPos + 3.5, 5, false, 'center');
  xPos += colWidths[2];
  addText('Written (80)', xPos + colWidths[3] / 2, yPos + 3.5, 5, false, 'center');
  xPos += colWidths[3];
  addText('% (100)', xPos + colWidths[4] / 2, yPos + 3.5, 5, false, 'center');
  xPos += colWidths[4];
  addText('Assessment (20)', xPos + colWidths[5] / 2, yPos + 3.5, 5, false, 'center');
  xPos += colWidths[5];
  addText('Written (80)', xPos + colWidths[6] / 2, yPos + 3.5, 5, false, 'center');
  xPos += colWidths[6];
  addText('% (100)', xPos + colWidths[7] / 2, yPos + 3.5, 5, false, 'center');
  xPos += colWidths[7];
  addText('Total', xPos + colWidths[8] / 2, yPos + 3.5, 5, false, 'center');
  xPos += colWidths[8];
  addText('%', xPos + colWidths[9] / 2, yPos + 3.5, 5, false, 'center');
  
  yPos += 6;

  // Subject rows
  const subjects = data.subjects || [];
  subjects.forEach((subject: any, idx: number) => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }
    
    const rowHeight = 5;
    if (idx % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(250, 250, 250);
    }
    doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'F');
    doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'S');
    
    xPos = margin;
    addText(subject.subjectName?.substring(0, 12) || '-', xPos + 2, yPos + 3.5, 6, false);
    xPos += colWidths[0];
    addText('100', xPos + colWidths[1] / 2, yPos + 3.5, 6, false, 'center');
    xPos += colWidths[1];
    addText(subject.term1Assessment?.toFixed(1) || '0', xPos + colWidths[2] / 2, yPos + 3.5, 6, false, 'center');
    xPos += colWidths[2];
    addText(subject.term1Written?.toFixed(1) || '0', xPos + colWidths[3] / 2, yPos + 3.5, 6, false, 'center');
    xPos += colWidths[3];
    addText(subject.term1Percentage?.toFixed(1) || '0', xPos + colWidths[4] / 2, yPos + 3.5, 6, false, 'center');
    xPos += colWidths[4];
    addText(subject.term2Assessment?.toFixed(1) || '0', xPos + colWidths[5] / 2, yPos + 3.5, 6, false, 'center');
    xPos += colWidths[5];
    addText(subject.term2Written?.toFixed(1) || '0', xPos + colWidths[6] / 2, yPos + 3.5, 6, false, 'center');
    xPos += colWidths[6];
    addText(subject.term2Percentage?.toFixed(1) || '0', xPos + colWidths[7] / 2, yPos + 3.5, 6, false, 'center');
    xPos += colWidths[7];
    addText(subject.finalAggregateTotal?.toFixed(1) || '0', xPos + colWidths[8] / 2, yPos + 3.5, 6, true, 'center');
    xPos += colWidths[8];
    addText(subject.finalAggregatePercentage?.toFixed(1) || '0', xPos + colWidths[9] / 2, yPos + 3.5, 6, true, 'center');
    
    yPos += rowHeight;
  });

  // Total row
  if (yPos > pageHeight - 30) {
    doc.addPage();
    yPos = margin;
  }
  
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 5, 'F');
  doc.rect(margin, yPos, pageWidth - 2 * margin, 5, 'S');
  
  xPos = margin;
  addText('TOTAL', xPos + 2, yPos + 3.5, 6, true);
  xPos += colWidths[0];
  addText('700', xPos + colWidths[1] / 2, yPos + 3.5, 6, true, 'center');
  xPos += colWidths[1];
  addText(data.subjects?.reduce((sum: number, s: any) => sum + (s.term1Assessment || 0), 0).toFixed(1) || '0', xPos + colWidths[2] / 2, yPos + 3.5, 6, true, 'center');
  xPos += colWidths[2];
  addText(data.subjects?.reduce((sum: number, s: any) => sum + (s.term1Written || 0), 0).toFixed(1) || '0', xPos + colWidths[3] / 2, yPos + 3.5, 6, true, 'center');
  xPos += colWidths[3];
  addText(data.term1TotalPercentage?.toFixed(1) || '0', xPos + colWidths[4] / 2, yPos + 3.5, 6, true, 'center');
  xPos += colWidths[4];
  addText(data.subjects?.reduce((sum: number, s: any) => sum + (s.term2Assessment || 0), 0).toFixed(1) || '0', xPos + colWidths[5] / 2, yPos + 3.5, 6, true, 'center');
  xPos += colWidths[5];
  addText(data.subjects?.reduce((sum: number, s: any) => sum + (s.term2Written || 0), 0).toFixed(1) || '0', xPos + colWidths[6] / 2, yPos + 3.5, 6, true, 'center');
  xPos += colWidths[6];
  addText(data.term2TotalPercentage?.toFixed(1) || '0', xPos + colWidths[7] / 2, yPos + 3.5, 6, true, 'center');
  xPos += colWidths[7];
  addText(data.finalAggregateTotal?.toFixed(1) || '0', xPos + colWidths[8] / 2, yPos + 3.5, 6, true, 'center');
  xPos += colWidths[8];
  addText(data.finalAggregatePercentage?.toFixed(2) || '0', xPos + colWidths[9] / 2, yPos + 3.5, 6, true, 'center');
  
  yPos += 8;

  // Personal/Social/Work Habits
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = margin;
  }
  
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 5, 'F');
  doc.rect(margin, yPos, pageWidth - 2 * margin, 5, 'S');
  addText('Personal/Social/Work Habits', pageWidth / 2, yPos + 3.5, 8, true, 'center');
  yPos += 6;

  const habits = data.habits || [];
  const habitColWidths = [100, 40, 40];
  
  // Headers
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 4, 'F');
  doc.rect(margin, yPos, pageWidth - 2 * margin, 4, 'S');
  
  xPos = margin;
  addText('Activity', xPos + 2, yPos + 3, 6, true);
  xPos += habitColWidths[0];
  addText('1st Term', xPos + habitColWidths[1] / 2, yPos + 3, 6, true, 'center');
  xPos += habitColWidths[1];
  addText('Final Term', xPos + habitColWidths[2] / 2, yPos + 3, 6, true, 'center');
  
  yPos += 5;

  habits.forEach((habit: any, idx: number) => {
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = margin;
    }
    
    if (idx % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(250, 250, 250);
    }
    doc.rect(margin, yPos, pageWidth - 2 * margin, 4, 'F');
    doc.rect(margin, yPos, pageWidth - 2 * margin, 4, 'S');
    
    xPos = margin;
    addText(habit.habitName || '-', xPos + 2, yPos + 3, 6, false);
    xPos += habitColWidths[0];
    addText(habit.term1Grade || '-', xPos + habitColWidths[1] / 2, yPos + 3, 6, false, 'center');
    xPos += habitColWidths[1];
    addText(habit.term2Grade || '-', xPos + habitColWidths[2] / 2, yPos + 3, 6, false, 'center');
    
    yPos += 4;
  });

  yPos += 3;

  // Remarks
  if (yPos > pageHeight - 30) {
    doc.addPage();
    yPos = margin;
  }
  
  doc.rect(margin, yPos, (pageWidth - 2 * margin) / 2 - 2, 12, 'S');
  addText('1st Term:', margin + 3, yPos + 4, 7, true);
  addText(data.term1Remarks || 'No remarks', margin + 3, yPos + 8, 6, false);
  
  const remarks2X = margin + (pageWidth - 2 * margin) / 2 + 2;
  doc.rect(remarks2X, yPos, (pageWidth - 2 * margin) / 2 - 2, 12, 'S');
  addText('Annual:', remarks2X + 3, yPos + 4, 7, true);
  addText(data.term2Remarks || 'No remarks', remarks2X + 3, yPos + 8, 6, false);
  
  yPos += 15;

  // Attendance & Overall
  doc.rect(margin, yPos, (pageWidth - 2 * margin) / 2 - 2, 15, 'S');
  addText('Attendance (75% Min):', margin + 3, yPos + 4, 7, true);
  addText(`1st Term: ${data.term1Attendance?.present || 0}/${data.term1Attendance?.total || 0}`, margin + 3, yPos + 8, 6, false);
  addText(`Final Term: ${data.term2Attendance?.present || 0}/${data.term2Attendance?.total || 0}`, margin + 3, yPos + 12, 6, false);
  
  const overallX = margin + (pageWidth - 2 * margin) / 2 + 2;
  doc.rect(overallX, yPos, (pageWidth - 2 * margin) / 2 - 2, 15, 'S');
  addText('Overall Totals:', overallX + 3, yPos + 4, 7, true);
  addText(`1st Term: ${data.term1TotalMarks?.toFixed(1) || '0'} (${data.term1TotalPercentage?.toFixed(1) || '0'}%)`, overallX + 3, yPos + 8, 6, false);
  addText(`Final Term: ${data.term2TotalMarks?.toFixed(1) || '0'} (${data.term2TotalPercentage?.toFixed(1) || '0'}%)`, overallX + 3, yPos + 12, 6, false);
  
  yPos += 18;

  // Signatures (Page 1)
  const sigWidth = (pageWidth - 2 * margin) / 2;
  doc.line(margin, yPos + 8, margin + sigWidth - 5, yPos + 8);
  addText('Sign Teacher', margin + sigWidth / 2 - 10, yPos + 12, 7, false);
  
  doc.line(margin + sigWidth, yPos + 8, pageWidth - margin, yPos + 8);
  addText('Sign Parent/Guardian', margin + 1.5 * sigWidth - 15, yPos + 12, 7, false);

  // ========== PAGE 2: Promotion Status and Signatures ==========
  doc.addPage();
  yPos = margin;

  // School Header (Page 2)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 20, 'S');
  addText(data.schoolName || 'School Exam Management System', pageWidth / 2, yPos + 6, 10, true, 'center');
  addText(data.schoolAddress || 'Address', pageWidth / 2, yPos + 11, 7, false, 'center');
  if (data.schoolPhone) addText(`Phone: ${data.schoolPhone}`, pageWidth / 2, yPos + 15, 6, false, 'center');
  
  doc.setFillColor(200, 200, 200);
  doc.rect(margin, yPos + 17, pageWidth - 2 * margin, 3, 'F');
  addText('PROGRESS REPORT', pageWidth / 2, yPos + 19, 9, true, 'center');
  
  yPos += 24;

  // Student Details (Page 2)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 15, 'S');
  addText(`Name: ${data.student?.name || '-'}`, col1X, yPos + 4, 8, false);
  addText(`Std./Section: ${data.student?.classSection || '-'}`, col1X, yPos + 9, 8, false);
  addText(`Roll No.: ${data.student?.rollNo || '-'}`, col1X, yPos + 14, 8, false);
  
  addText(`Year: ${data.academicYear || '-'}`, col2X, yPos + 4, 8, false);
  addText(`Registration No: _______________`, col2X, yPos + 9, 8, false);
  
  yPos += 18;

  // Requirements for Promotions
  doc.rect(margin, yPos, pageWidth - 2 * margin, 35, 'S');
  addText('Requirements for Promotions:', margin + 3, yPos + 5, 8, true);
  
  const requirements = [
    "Individual promotion is based on the child's ability to cope with the next educational step.",
    'Average marks from examinations and regular assessments are the basis for promotion.',
    'Failing in English will disqualify a student\'s promotion.',
    '75% attendance is the minimum requirement.',
    'The school authorities\' decision regarding promotion is final.',
  ];
  
  requirements.forEach((req, idx) => {
    addText(`${idx + 1}. ${req}`, margin + 5, yPos + 10 + idx * 5, 6, false);
  });
  
  yPos += 38;

  // Promotion Status
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 25, 'FD');
  
  addText('Promotion Status:', margin + 3, yPos + 5, 8, true);
  
  const promotionStatus = data.promotion?.status || 'Promotion Not Granted';
  const statusOptions = ['Promotion Granted', 'Promotion Not Granted', 'On Trial'];
  
  statusOptions.forEach((option, idx) => {
    const checked = option === promotionStatus;
    doc.circle(margin + 8 + idx * 60, yPos + 9, 1.5, checked ? 'F' : 'S');
    addText(option, margin + 12 + idx * 60, yPos + 9, 6, false);
  });
  
  if (data.promotion?.retestRequired) {
    doc.setFillColor(255, 255, 200);
    doc.rect(margin + 3, yPos + 14, pageWidth - 2 * margin - 6, 8, 'FD');
    addText('Retest in:', margin + 5, yPos + 17, 6, true);
    addText('On .......... at ..........', margin + 5, yPos + 21, 6, false);
    if (data.promotion.retestSubjects && data.promotion.retestSubjects.length > 0) {
      addText(`Subjects: ${data.promotion.retestSubjects.join(', ')}`, margin + 5, yPos + 25, 5, false);
    }
  }
  
  const promotionDate = (data.promotion as any)?.date || '_______________';
  addText(`Date: ${promotionDate}`, margin + 3, yPos + 30, 6, false);
  
  yPos += 28;

  // Remarks
  doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'S');
  addText('Remarks:', margin + 3, yPos + 4, 7, true);
  addText(data.promotion?.remarks || 'No remarks', margin + 3, yPos + 8, 6, false);
  
  yPos += 13;

  // Signatures (Page 2)
  const sigWidth2 = (pageWidth - 2 * margin) / 2;
  doc.line(margin, yPos + 10, margin + sigWidth2 - 5, yPos + 10);
  addText('Class Teacher', margin + sigWidth2 / 2 - 12, yPos + 14, 7, false);
  
  doc.line(margin + sigWidth2, yPos + 10, pageWidth - margin, yPos + 10);
  addText('Principal/Vice Principal', margin + 1.5 * sigWidth2 - 20, yPos + 14, 7, false);
  
  yPos += 18;

  // Important Note
  doc.setFillColor(255, 255, 200);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'FD');
  addText('N.B Please Sign and return the Report Card', pageWidth / 2, yPos + 4, 6, true, 'center');

  // Save PDF
  const fileName = `ReportCard_Template3_${data.student?.name?.replace(/\s+/g, '_') || 'Student'}_${data.academicYear?.replace(/\s+/g, '_') || 'AY'}.pdf`;
  doc.save(fileName);
}
