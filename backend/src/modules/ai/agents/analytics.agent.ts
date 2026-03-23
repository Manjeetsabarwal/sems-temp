import { DataSource } from 'typeorm';

export class AnalyticsAgent {
  

  constructor(private readonly dataSource: DataSource) {}

  async analyzePerformance(params: {
    entityType: 'student' | 'class' | 'teacher' | 'subject';
    entityId?: string;
    timeframe?: string;
    metrics?: string[];
  }): Promise<any> {
    const { entityType, entityId, timeframe = 'last_30_days', metrics } = params;

    switch (entityType) {
      case 'student':
        return this.analyzeStudentPerformance(entityId, timeframe, metrics);
      case 'class':
        return this.analyzeClassPerformance(entityId, timeframe, metrics);
      case 'teacher':
        return this.analyzeTeacherPerformance(entityId, timeframe, metrics);
      case 'subject':
        return this.analyzeSubjectPerformance(entityId, timeframe, metrics);
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  async generateInsights(data: any, context: any): Promise<{
    insights: string[];
    recommendations: string[];
    trends: any[];
    anomalies: any[];
  }> {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const trends: any[] = [];
    const anomalies: any[] = [];

    // Get real summary stats from DB
    try {
      const studentCount = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM students WHERE status = 'Active'`
      );
      const totalStudents = parseInt(studentCount[0]?.count || '0');

      if (totalStudents > 0) {
        // Overall performance analysis
        const perfData = await this.dataSource.query(`
          SELECT 
            ROUND(AVG(m.percentage)::numeric, 2) as avg_percentage,
            COUNT(DISTINCT m.student_id) as students_with_marks,
            COUNT(DISTINCT m.subject_id) as subjects_covered,
            ROUND(AVG(CASE WHEN m.percentage >= 40 THEN 1 ELSE 0 END)::numeric * 100, 1) as pass_rate
          FROM marks m
          WHERE m.status = 'Published' AND m.percentage IS NOT NULL
        `);

        if (perfData[0]?.avg_percentage) {
          const avgPct = parseFloat(perfData[0].avg_percentage);
          insights.push(`Overall average score: ${avgPct}% across ${perfData[0].subjects_covered} subjects`);
          insights.push(`Pass rate: ${perfData[0].pass_rate}% of students pass`);

          if (avgPct < 60) {
            recommendations.push('Overall average is below 60% — review curriculum difficulty and teaching methods');
          }
          if (parseFloat(perfData[0].pass_rate) < 80) {
            recommendations.push('Pass rate is below 80% — consider remedial programs for struggling students');
          }
        }

        // Subject-wise performance for strengths/weaknesses
        const subjectPerf = await this.dataSource.query(`
          SELECT 
            s.subject_name as subject_name,
            ROUND(AVG(m.percentage)::numeric, 2) as avg_score,
            COUNT(DISTINCT m.student_id) as student_count
          FROM marks m
          JOIN subjects s ON s.subject_id = m.subject_id
          WHERE m.status = 'Published' AND m.percentage IS NOT NULL
          GROUP BY s.subject_name
          HAVING COUNT(DISTINCT m.student_id) >= 3
          ORDER BY avg_score DESC
        `);

        if (subjectPerf.length > 0) {
          const top = subjectPerf.slice(0, 3).map((s: any) => `${s.subject_name} (${s.avg_score}%)`);
          const bottom = subjectPerf.slice(-3).map((s: any) => `${s.subject_name} (${s.avg_score}%)`);
          insights.push(`Top subjects: ${top.join(', ')}`);
          if (subjectPerf.length > 3) {
            insights.push(`Needs improvement: ${bottom.join(', ')}`);
            recommendations.push(`Focus on improving: ${bottom.join(', ')}`);
          }
        }

        // Attendance insights
        const attendanceData = await this.dataSource.query(`
          SELECT 
            ROUND(AVG(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::numeric * 100, 1) as attendance_rate,
            COUNT(DISTINCT a.student_id) as tracked_students
          FROM attendance a
        `);

        if (attendanceData[0]?.attendance_rate) {
          const rate = parseFloat(attendanceData[0].attendance_rate);
          insights.push(`Overall attendance rate: ${rate}%`);
          if (rate < 75) {
            recommendations.push('Attendance below 75% — implement attendance improvement programs');
            anomalies.push({ type: 'low_attendance', value: rate, threshold: 75 });
          }
        }

        // Fee collection insights
        const feeData = await this.dataSource.query(`
          SELECT 
            COALESCE(SUM(amount), 0) as total_collected,
            COUNT(*) as payment_count,
            COUNT(DISTINCT enrollment_id) as unique_enrollments
          FROM paid_student_fees
        `);

        if (feeData[0]?.total_collected) {
          insights.push(`Total fees collected: ₹${parseFloat(feeData[0].total_collected).toLocaleString()}`);
        }

        // Detect anomalies: students with very low scores
        const lowScorers = await this.dataSource.query(`
          SELECT COUNT(DISTINCT student_id) as count
          FROM marks
          WHERE status = 'Published' AND percentage IS NOT NULL AND percentage < 30
        `);

        if (parseInt(lowScorers[0]?.count || '0') > 0) {
          anomalies.push({
            type: 'critical_low_scores',
            message: `${lowScorers[0].count} students scoring below 30%`,
            action: 'Urgent academic intervention required',
          });
        }
      } else {
        insights.push('No active students found — system is freshly set up');
      }
    } catch (error) {
      console.error('Error generating insights from DB:', error);
      insights.push('Unable to fetch live data — using cached analysis');
    }

    return { insights, recommendations, trends, anomalies };
  }

  private async analyzeStudentPerformance(
    studentId: string | undefined,
    timeframe: string,
    metrics?: string[]
  ): Promise<any> {
    try {
      if (!studentId) {
        // Return aggregate student performance
        const result = await this.dataSource.query(`
          SELECT 
            ROUND(AVG(m.percentage)::numeric, 2) as avg_score,
            COUNT(DISTINCT m.student_id) as total_students,
            ROUND(AVG(CASE WHEN m.percentage >= 40 THEN 1 ELSE 0 END)::numeric * 100, 1) as pass_rate,
            MAX(m.percentage) as highest_score,
            MIN(m.percentage) as lowest_score
          FROM marks m
          WHERE m.status = 'Published' AND m.percentage IS NOT NULL
        `);

        const topStudents = await this.dataSource.query(`
          SELECT s.name, s.student_id, ROUND(AVG(m.percentage)::numeric, 2) as avg_score
          FROM marks m JOIN students s ON s.student_id = m.student_id
          WHERE m.status = 'Published' AND m.percentage IS NOT NULL
          GROUP BY s.name, s.student_id
          ORDER BY avg_score DESC LIMIT 5
        `);

        const lowStudents = await this.dataSource.query(`
          SELECT s.name, s.student_id, ROUND(AVG(m.percentage)::numeric, 2) as avg_score
          FROM marks m JOIN students s ON s.student_id = m.student_id
          WHERE m.status = 'Published' AND m.percentage IS NOT NULL
          GROUP BY s.name, s.student_id
          ORDER BY avg_score ASC LIMIT 5
        `);

        return {
          timeframe,
          averageScore: parseFloat(result[0]?.avg_score || '0'),
          totalStudents: parseInt(result[0]?.total_students || '0'),
          passRate: parseFloat(result[0]?.pass_rate || '0'),
          highestScore: parseFloat(result[0]?.highest_score || '0'),
          lowestScore: parseFloat(result[0]?.lowest_score || '0'),
          topPerformers: topStudents.map((s: any) => ({ name: s.name, id: s.student_id, score: parseFloat(s.avg_score) })),
          needsAttention: lowStudents.map((s: any) => ({ name: s.name, id: s.student_id, score: parseFloat(s.avg_score) })),
          recommendations: this.generateStudentRecommendations(result[0]),
        };
      }

      // Single student analysis
      const studentMarks = await this.dataSource.query(`
        SELECT 
          s.name as student_name, s.class_id,
          sub.subject_name as subject_name,
          m.marks_obtained, m.total_marks, m.percentage, m.grade,
          e.exam_name as exam_name
        FROM marks m
        JOIN students s ON s.student_id = m.student_id
        JOIN subjects sub ON sub.subject_id = m.subject_id
        JOIN exams e ON e.exam_id = m.exam_id
        WHERE m.student_id = $1 AND m.status = 'Published'
        ORDER BY e.exam_name, sub.subject_name
      `, [studentId]);

      if (studentMarks.length === 0) {
        return { studentId, message: 'No published marks found for this student' };
      }

      const avgScore = studentMarks.reduce((sum: number, m: any) => sum + parseFloat(m.percentage || 0), 0) / studentMarks.length;
      const subjects = [...new Set(studentMarks.map((m: any) => m.subject_name))];
      const subjectAvgs = subjects.map((sub: any) => {
        const subMarks = studentMarks.filter((m: any) => m.subject_name === sub);
        const avg = subMarks.reduce((s: number, m: any) => s + parseFloat(m.percentage || 0), 0) / subMarks.length;
        return { subject: sub, average: Math.round(avg * 100) / 100 };
      }).sort((a: any, b: any) => b.average - a.average);

      const strengths = subjectAvgs.filter((s: any) => s.average >= 70).map((s: any) => s.subject);
      const weaknesses = subjectAvgs.filter((s: any) => s.average < 50).map((s: any) => s.subject);

      return {
        studentId,
        studentName: studentMarks[0].student_name,
        classId: studentMarks[0].class_id,
        timeframe,
        averageScore: Math.round(avgScore * 100) / 100,
        subjectBreakdown: subjectAvgs,
        strengths,
        weaknesses,
        totalExams: [...new Set(studentMarks.map((m: any) => m.exam_name))].length,
        recommendations: [
          ...(weaknesses.length > 0 ? [`Focus on: ${weaknesses.join(', ')}`] : []),
          ...(avgScore < 60 ? ['Consider extra tutoring sessions'] : []),
          ...(avgScore >= 80 ? ['Excellent performance — encourage advanced studies'] : []),
        ],
      };
    } catch (error) {
      console.error('Error analyzing student performance:', error);
      return { studentId, error: 'Unable to fetch performance data' };
    }
  }

  private async analyzeClassPerformance(
    classId: string | undefined,
    timeframe: string,
    metrics?: string[]
  ): Promise<any> {
    try {
      const query = classId
        ? `SELECT s.class_id, ROUND(AVG(m.percentage)::numeric, 2) as avg_score,
             COUNT(DISTINCT m.student_id) as student_count,
             ROUND(AVG(CASE WHEN m.percentage >= 40 THEN 1 ELSE 0 END)::numeric * 100, 1) as pass_rate
           FROM marks m JOIN students s ON s.student_id = m.student_id
           WHERE m.status = 'Published' AND m.percentage IS NOT NULL AND s.class_id = $1
           GROUP BY s.class_id`
        : `SELECT s.class_id, ROUND(AVG(m.percentage)::numeric, 2) as avg_score,
             COUNT(DISTINCT m.student_id) as student_count,
             ROUND(AVG(CASE WHEN m.percentage >= 40 THEN 1 ELSE 0 END)::numeric * 100, 1) as pass_rate
           FROM marks m JOIN students s ON s.student_id = m.student_id
           WHERE m.status = 'Published' AND m.percentage IS NOT NULL
           GROUP BY s.class_id ORDER BY avg_score DESC`;

      const classData = await this.dataSource.query(query, classId ? [classId] : []);

      if (classData.length === 0) {
        return { classId, message: 'No performance data found' };
      }

      const topClass = classData[0];
      const bottomClass = classData[classData.length - 1];

      return {
        classId,
        timeframe,
        classes: classData.map((c: any) => ({
          classId: c.class_id,
          averageScore: parseFloat(c.avg_score),
          studentCount: parseInt(c.student_count),
          passRate: parseFloat(c.pass_rate),
        })),
        bestPerforming: { classId: topClass.class_id, score: parseFloat(topClass.avg_score) },
        lowestPerforming: { classId: bottomClass.class_id, score: parseFloat(bottomClass.avg_score) },
        recommendations: this.generateClassRecommendations(classData),
      };
    } catch (error) {
      console.error('Error analyzing class performance:', error);
      return { classId, error: 'Unable to fetch class data' };
    }
  }

  private async analyzeTeacherPerformance(
    teacherId: string | undefined,
    timeframe: string,
    metrics?: string[]
  ): Promise<any> {
    try {
      const query = teacherId
        ? `SELECT t.name as teacher_name, t.teacher_id, sub.subject_name as subject_name,
             ROUND(AVG(m.percentage)::numeric, 2) as avg_student_score,
             COUNT(DISTINCT m.student_id) as student_count,
             ROUND(AVG(CASE WHEN m.percentage >= 40 THEN 1 ELSE 0 END)::numeric * 100, 1) as pass_rate
           FROM marks m
           JOIN subjects sub ON sub.subject_id = m.subject_id
           JOIN subject_teachers st ON st.subject_id = sub.subject_id
           JOIN teachers t ON t.teacher_id = st.teacher_id
           WHERE m.status = 'Published' AND t.teacher_id = $1
           GROUP BY t.name, t.teacher_id, sub.subject_name`
        : `SELECT t.name as teacher_name, t.teacher_id,
             ROUND(AVG(m.percentage)::numeric, 2) as avg_student_score,
             COUNT(DISTINCT m.student_id) as student_count,
             ROUND(AVG(CASE WHEN m.percentage >= 40 THEN 1 ELSE 0 END)::numeric * 100, 1) as pass_rate
           FROM marks m
           JOIN subjects sub ON sub.subject_id = m.subject_id
           JOIN subject_teachers st ON st.subject_id = sub.subject_id
           JOIN teachers t ON t.teacher_id = st.teacher_id
           WHERE m.status = 'Published'
           GROUP BY t.name, t.teacher_id ORDER BY avg_student_score DESC`;

      const teacherData = await this.dataSource.query(query, teacherId ? [teacherId] : []);

      if (teacherData.length === 0) {
        return { teacherId, message: 'No teacher performance data found' };
      }

      return {
        teacherId,
        timeframe,
        teachers: teacherData.map((t: any) => ({
          teacherId: t.teacher_id,
          name: t.teacher_name,
          subjectName: t.subject_name,
          avgStudentScore: parseFloat(t.avg_student_score),
          studentCount: parseInt(t.student_count),
          passRate: parseFloat(t.pass_rate),
        })),
        recommendations: teacherData
          .filter((t: any) => parseFloat(t.pass_rate) < 70)
          .map((t: any) => `${t.teacher_name}: Pass rate ${t.pass_rate}% — consider curriculum review`),
      };
    } catch (error) {
      console.error('Error analyzing teacher performance:', error);
      return { teacherId, error: 'Unable to fetch teacher data' };
    }
  }

  private async analyzeSubjectPerformance(
    subjectId: string | undefined,
    timeframe: string,
    metrics?: string[]
  ): Promise<any> {
    try {
      const query = subjectId
        ? `SELECT sub.subject_name as subject_name, sub.subject_id,
             ROUND(AVG(m.percentage)::numeric, 2) as avg_score,
             COUNT(DISTINCT m.student_id) as student_count,
             ROUND(AVG(CASE WHEN m.percentage >= 40 THEN 1 ELSE 0 END)::numeric * 100, 1) as pass_rate,
             MAX(m.percentage) as highest, MIN(m.percentage) as lowest
           FROM marks m JOIN subjects sub ON sub.subject_id = m.subject_id
           WHERE m.status = 'Published' AND m.percentage IS NOT NULL AND sub.subject_id = $1
           GROUP BY sub.subject_name, sub.subject_id`
        : `SELECT sub.subject_name as subject_name, sub.subject_id,
             ROUND(AVG(m.percentage)::numeric, 2) as avg_score,
             COUNT(DISTINCT m.student_id) as student_count,
             ROUND(AVG(CASE WHEN m.percentage >= 40 THEN 1 ELSE 0 END)::numeric * 100, 1) as pass_rate,
             MAX(m.percentage) as highest, MIN(m.percentage) as lowest
           FROM marks m JOIN subjects sub ON sub.subject_id = m.subject_id
           WHERE m.status = 'Published' AND m.percentage IS NOT NULL
           GROUP BY sub.subject_name, sub.subject_id ORDER BY avg_score DESC`;

      const subjectData = await this.dataSource.query(query, subjectId ? [subjectId] : []);

      if (subjectData.length === 0) {
        return { subjectId, message: 'No subject performance data found' };
      }

      return {
        subjectId,
        timeframe,
        subjects: subjectData.map((s: any) => ({
          subjectId: s.subject_id,
          name: s.subject_name,
          averageScore: parseFloat(s.avg_score),
          studentCount: parseInt(s.student_count),
          passRate: parseFloat(s.pass_rate),
          highest: parseFloat(s.highest),
          lowest: parseFloat(s.lowest),
          difficulty: parseFloat(s.avg_score) < 50 ? 'hard' : parseFloat(s.avg_score) < 70 ? 'medium' : 'easy',
        })),
        recommendations: subjectData
          .filter((s: any) => parseFloat(s.pass_rate) < 70)
          .map((s: any) => `${s.subject_name}: ${s.pass_rate}% pass rate — consider additional practice and review sessions`),
      };
    } catch (error) {
      console.error('Error analyzing subject performance:', error);
      return { subjectId, error: 'Unable to fetch subject data' };
    }
  }

  private generateStudentRecommendations(data: any): string[] {
    const recs: string[] = [];
    if (!data) return recs;
    const avg = parseFloat(data.avg_score || '0');
    const passRate = parseFloat(data.pass_rate || '0');
    if (avg < 50) recs.push('Average score below 50% — urgent academic intervention needed');
    else if (avg < 70) recs.push('Average score below 70% — implement improvement programs');
    if (passRate < 80) recs.push(`Pass rate ${passRate}% — identify and support at-risk students`);
    if (passRate >= 95) recs.push('Excellent pass rate — maintain current standards');
    return recs;
  }

  private generateClassRecommendations(classData: any[]): string[] {
    const recs: string[] = [];
    const lowClasses = classData.filter((c: any) => parseFloat(c.pass_rate) < 70);
    if (lowClasses.length > 0) {
      recs.push(`${lowClasses.length} class(es) below 70% pass rate — review teaching methods`);
    }
    const scores = classData.map((c: any) => parseFloat(c.avg_score));
    const range = Math.max(...scores) - Math.min(...scores);
    if (range > 20) {
      recs.push(`Score range of ${range}% between classes — investigate disparities`);
    }
    return recs;
  }

  calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumX2 += x[i] * x[i];
      sumY2 += y[i] * y[i];
    }

    const correlation = (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return isNaN(correlation) ? 0 : correlation;
  }
}
