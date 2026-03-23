

export interface ResultNotificationData {
  studentName: string;
  examName: string;
  examType: string;
  className: string;
  percentage: number;
  grade: string;
  rank?: number;
  isPassed: boolean;
  totalMarksObtained: number;
  totalMaxMarks: number;
  subjects: Array<{
    subjectName: string;
    marksObtained: number;
    maxMarks: number;
    grade: string;
    isPassed: boolean;
  }>;
}

export class EmailTemplatesService {
  generateStudentResultEmail(data: ResultNotificationData): string {
    const statusBadge = data.isPassed 
      ? '<span style="background-color: #10b981; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold;">PASSED</span>'
      : '<span style="background-color: #ef4444; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold;">FAILED</span>';

    const subjectsHtml = data.subjects.map(sub => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${sub.subjectName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${sub.marksObtained}/${sub.maxMarks}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${sub.grade}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${sub.isPassed ? '✓' : '✗'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .result-box { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #e5e7eb; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat-item { text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .stat-label { font-size: 12px; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background-color: #f3f4f6; padding: 10px; text-align: left; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Exam Results Published</h1>
          </div>
          <div class="content">
            <p>Dear ${data.studentName},</p>
            <p>Your exam results for <strong>${data.examName}</strong> (${data.examType}) have been published.</p>
            
            <div class="result-box">
              <h2 style="margin-top: 0;">Your Results</h2>
              <div class="stats">
                <div class="stat-item">
                  <div class="stat-value">${data.percentage.toFixed(2)}%</div>
                  <div class="stat-label">Percentage</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${data.grade}</div>
                  <div class="stat-label">Grade</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${statusBadge}</div>
                  <div class="stat-label">Status</div>
                </div>
                ${data.rank ? `
                <div class="stat-item">
                  <div class="stat-value">#${data.rank}</div>
                  <div class="stat-label">Rank</div>
                </div>
                ` : ''}
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th style="text-align: center;">Marks</th>
                    <th style="text-align: center;">Grade</th>
                    <th style="text-align: center;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${subjectsHtml}
                </tbody>
              </table>
              
              <p style="margin-top: 20px;">
                <strong>Total Marks:</strong> ${data.totalMarksObtained} / ${data.totalMaxMarks}
              </p>
            </div>
            
            <p>You can view your detailed report card by logging into the School Exam Management System.</p>
            <p>Best regards,<br>School Administration</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateParentResultEmail(data: ResultNotificationData, childName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .result-box { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Your Child's Exam Results</h1>
          </div>
          <div class="content">
            <p>Dear Parent/Guardian,</p>
            <p>We are pleased to inform you that your child <strong>${childName}</strong>'s exam results for <strong>${data.examName}</strong> have been published.</p>
            
            <div class="result-box">
              <h3>Result Summary</h3>
              <p><strong>Class:</strong> ${data.className}</p>
              <p><strong>Exam:</strong> ${data.examName} (${data.examType})</p>
              <p><strong>Percentage:</strong> ${data.percentage.toFixed(2)}%</p>
              <p><strong>Grade:</strong> ${data.grade}</p>
              <p><strong>Status:</strong> ${data.isPassed ? 'PASSED ✓' : 'FAILED ✗'}</p>
              ${data.rank ? `<p><strong>Rank:</strong> #${data.rank}</p>` : ''}
              <p><strong>Total Marks:</strong> ${data.totalMarksObtained} / ${data.totalMaxMarks}</p>
            </div>
            
            <p>Please log in to the School Exam Management System to view the detailed report card and subject-wise performance.</p>
            <p>Best regards,<br>School Administration</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateTeacherClassResultEmail(examName: string, className: string, totalStudents: number, publishedCount: number): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Class Results Published</h1>
          </div>
          <div class="content">
            <p>Dear Teacher,</p>
            <p>The exam results for <strong>${examName}</strong> in <strong>${className}</strong> have been published.</p>
            <p><strong>Total Students:</strong> ${totalStudents}</p>
            <p><strong>Results Published:</strong> ${publishedCount}</p>
            <p>Students and parents have been notified via email. You can view the complete class results by logging into the School Exam Management System.</p>
            <p>Best regards,<br>School Administration</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
