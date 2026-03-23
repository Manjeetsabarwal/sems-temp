import { Repository, DataSource } from 'typeorm';

import { OpenAI } from 'openai';
import { AiInteraction } from './entities/ai-interaction.entity';
import { AiFeedback } from './entities/ai-feedback.entity';
import { AiPattern } from './entities/ai-pattern.entity';
import { AiPromptTemplate } from './entities/ai-prompt-template.entity';
import { AiQueryVector } from './entities/ai-query-vector.entity';
import { AiContextMemory } from './entities/ai-context-memory.entity';
import { LearningEngine } from './learning/learning.engine';
import { PromptManager } from './learning/prompt.manager';
import { PatternRecognizer } from './learning/pattern.recognizer';
import { VectorStore } from './learning/vector.store';
import { AnalyticsAgent } from './agents/analytics.agent';

export class AiService {
  private openai: OpenAI;
  private openaiAvailable = false;
  private interactionRepository: Repository<AiInteraction>;
  private feedbackRepository: Repository<AiFeedback>;
  private patternRepository: Repository<AiPattern>;
  private templateRepository: Repository<AiPromptTemplate>;
  private vectorRepository: Repository<AiQueryVector>;
  private contextRepository: Repository<AiContextMemory>;

  constructor(
    private dataSource: DataSource,
    private learningEngine: LearningEngine,
    private promptManager: PromptManager,
    private patternRecognizer: PatternRecognizer,
    private vectorStore: VectorStore,
    private analyticsAgent: AnalyticsAgent,
  ) {
    this.interactionRepository = dataSource.getRepository(AiInteraction);
    this.feedbackRepository = dataSource.getRepository(AiFeedback);
    this.patternRepository = dataSource.getRepository(AiPattern);
    this.templateRepository = dataSource.getRepository(AiPromptTemplate);
    this.vectorRepository = dataSource.getRepository(AiQueryVector);
    this.contextRepository = dataSource.getRepository(AiContextMemory);
    const apiKey = process.env.OPENAI_API_KEY;
    this.openaiAvailable = !!apiKey && apiKey !== '' && apiKey !== 'your_openai_api_key_here';
    this.openai = new OpenAI({ apiKey: apiKey || 'sk-placeholder' });
    if (!this.openaiAvailable) {
      console.warn('OpenAI API key not configured — using local DB-driven AI responses');
    }
  }

  async processQuery(queryDto: {
    question: string;
    userId: string;
    userRole: string;
    sessionId?: string;
    context?: any;
  }) {
    const startTime = Date.now();
    
    try {
      // 1. Save interaction
      const interaction = await this.saveInteraction({
        ...queryDto,
        sqlQuery: null,
        response: null,
        responseTimeMs: null,
      });

      // 2. Recognize patterns and intent
      const recognizedPattern = await this.patternRecognizer.recognizePattern(queryDto.question);

      let generatedQuery = '';
      let response = '';

      if (this.openaiAvailable) {
        // --- OpenAI path ---
        try {
          const contextMemory = await this.getContextMemory(queryDto.userId, queryDto.sessionId);
          const template = await this.promptManager.getBestTemplate(
            recognizedPattern.category,
            recognizedPattern.intent
          );
          generatedQuery = await this.generateQueryWithOpenAI(queryDto.question, template, contextMemory);
          const results = await this.executeQuery(generatedQuery);
          response = await this.generateResponseWithOpenAI(queryDto.question, results, recognizedPattern);
        } catch (openaiError) {
          console.warn('OpenAI call failed, falling back to local processing:', openaiError.message);
          const localResult = await this.processQueryLocally(queryDto.question, recognizedPattern);
          generatedQuery = localResult.sqlQuery;
          response = localResult.response;
        }
      } else {
        // --- Local DB-driven path ---
        const localResult = await this.processQueryLocally(queryDto.question, recognizedPattern);
        generatedQuery = localResult.sqlQuery;
        response = localResult.response;
      }

      // Update interaction with response
      const responseTime = Date.now() - startTime;
      await this.updateInteraction(interaction.id, generatedQuery, response, responseTime);
      
      // Store vector (skip if no OpenAI)
      if (this.openaiAvailable) {
        this.storeQueryVector(interaction.id, queryDto.question, recognizedPattern).catch(err => {
          console.warn('Vector storage skipped:', err.message);
        });
      }
      
      // Update context memory
      this.updateContextMemory(queryDto.userId, queryDto.sessionId || 'default', {
        lastQuery: queryDto.question,
        lastResponse: response,
        category: recognizedPattern.category,
      }).catch(err => console.warn('Context memory update failed:', err.message));

      // Trigger async learning
      this.learningEngine.processInteraction(interaction.id).catch(err => {
        console.error('Learning engine error:', err);
      });

      return {
        id: interaction.id,
        response,
        sqlQuery: generatedQuery,
        responseTime,
        category: recognizedPattern.category,
        confidence: recognizedPattern.confidence,
      };

    } catch (error) {
      console.error('Error processing query:', error);
      throw error;
    }
  }

  async submitFeedback(feedbackDto: {
    interactionId: number;
    feedbackType: 'thumbs_up' | 'thumbs_down' | 'star_rating' | 'detailed';
    rating?: number;
    accuracyRating?: number;
    usefulnessRating?: number;
    clarityRating?: number;
    feedbackComment?: string;
    whatWasGood?: string;
    whatCouldBeBetter?: string;
    additionalContext?: string;
    didUserFollowUp?: boolean;
    didUserModifyQuery?: boolean;
    timeSpentOnResponse?: number;
  }) {
    const feedback = await this.feedbackRepository.save(feedbackDto);
    
    // Trigger learning based on feedback
    this.learningEngine.processFeedback(feedback.id).catch(err => {
      console.error('Feedback processing error:', err);
    });

    return feedback;
  }

  async getInsights(insightType: string, userId: string, userRole: string) {
    switch (insightType) {
      case 'performance':
        return this.getPerformanceInsights(userId, userRole);
      case 'financial':
        return this.getFinancialInsights(userId, userRole);
      case 'attendance':
        return this.getAttendanceInsights(userId, userRole);
      case 'predictions':
        return this.getPredictiveInsights(userId, userRole);
      default:
        throw new Error(`Unknown insight type: ${insightType}`);
    }
  }

  async automateTask(taskDto: {
    task: string;
    parameters: any;
    userId: string;
    schedule?: string;
  }) {
    // Implementation for automation tasks
    // This would integrate with the automation agent
    return { message: 'Task automation initiated', taskId: 'task_' + Date.now() };
  }

  private async saveInteraction(data: any): Promise<AiInteraction> {
    return this.interactionRepository.save(data);
  }

  private async updateInteraction(id: number, sqlQuery: string, response: string, responseTime: number) {
    await this.interactionRepository.update(id, { sqlQuery, response, responseTimeMs: responseTime });
  }

  private async getContextMemory(userId: string, sessionId?: string): Promise<any> {
    const memories = await this.contextRepository.find({
      where: { userId, sessionId },
      order: { createdAt: 'DESC' },
      take: 5,
    });
    
    return memories.reduce((acc, memory) => ({
      ...acc,
      [memory.contextType]: memory.contextData,
    }), {});
  }

  // ========== LOCAL DB-DRIVEN QUERY PROCESSING ==========

  private async processQueryLocally(
    question: string,
    pattern: { category: string; subcategory?: string; intent: string; confidence: number; entities: Record<string, string>; keywords: string[] },
  ): Promise<{ sqlQuery: string; response: string }> {
    const q = question.toLowerCase();

    try {
      // If category is unknown, try general queries first, then infer category
      let category = pattern.category;
      if (category === 'unknown') {
        // Check for simple counting/listing questions first
        const generalResult = await this.handleGeneralQuery(q, pattern);
        if (!generalResult.response.includes('Administrative Summary')) {
          return generalResult;
        }
        // If general didn't match, infer category from keywords
        if (/perform|score|marks?\b|grade|exam|result|poor|top|fail|pass|rank|topper/i.test(q)) {
          category = 'academic_performance';
        } else if (/fee|payment|revenue|income|cost|expense/i.test(q)) {
          category = 'financial_management';
        } else if (/attendance|present|absent|timetable|schedule/i.test(q)) {
          category = 'operational_insights';
        } else if (/predict|forecast|risk|at.risk|future/i.test(q)) {
          category = 'predictive_analytics';
        } else if (/report|summary|overview|generate/i.test(q)) {
          category = 'administration';
        }
      }

      // Route to the appropriate local handler based on category
      switch (category) {
        case 'academic_performance':
          return this.handleAcademicQuery(q, pattern);
        case 'financial_management':
          return this.handleFinancialQuery(q, pattern);
        case 'operational_insights':
          return this.handleOperationalQuery(q, pattern);
        case 'predictive_analytics':
          return this.handlePredictiveQuery(q, pattern);
        case 'administration':
          return this.handleAdminQuery(q, pattern);
        default:
          return this.handleGeneralQuery(q, pattern);
      }
    } catch (error) {
      console.error('Local query processing error:', error);
      return {
        sqlQuery: '',
        response: 'I was unable to process that query against the database. Could you try rephrasing your question?',
      };
    }
  }

  private async handleAcademicQuery(q: string, pattern: any): Promise<{ sqlQuery: string; response: string }> {
    // Detect specific academic sub-queries
    const wantsPoorPerformers = /poor|fail|low|weak|struggling|at.?risk|below|bad|worst/i.test(q);
    const wantsTopPerformers = /top|best|highest|excellent|topper|rank/i.test(q);
    const wantsSubjectAnalysis = /subject/i.test(q);
    const wantsClassAnalysis = /class/i.test(q) && !wantsSubjectAnalysis;

    if (wantsSubjectAnalysis) {
      const sqlQuery = `SELECT sub.subject_name, ROUND(AVG(m.percentage)::numeric, 2) as avg_score,
        COUNT(DISTINCT m.student_id) as student_count,
        ROUND(AVG(CASE WHEN m.percentage >= 40 THEN 1 ELSE 0 END)::numeric * 100, 1) as pass_rate
        FROM marks m JOIN subjects sub ON sub.subject_id = m.subject_id
        WHERE m.status = 'Published' AND m.percentage IS NOT NULL
        GROUP BY sub.subject_name ORDER BY avg_score DESC`;
      const data = await this.dataSource.query(sqlQuery);
      if (data.length === 0) return { sqlQuery, response: 'No subject performance data is available yet.' };
      const lines = data.map((s: any) => `• **${s.subject_name}**: avg ${s.avg_score}%, pass rate ${s.pass_rate}%, ${s.student_count} students`);
      return { sqlQuery, response: `📚 **Subject-wise Performance**\n\n${lines.join('\n')}` };
    }

    if (wantsClassAnalysis) {
      const sqlQuery = `SELECT s.class_id, ROUND(AVG(m.percentage)::numeric, 2) as avg_score,
        COUNT(DISTINCT m.student_id) as student_count,
        ROUND(AVG(CASE WHEN m.percentage >= 40 THEN 1 ELSE 0 END)::numeric * 100, 1) as pass_rate
        FROM marks m JOIN students s ON s.student_id = m.student_id
        WHERE m.status = 'Published' AND m.percentage IS NOT NULL
        GROUP BY s.class_id ORDER BY avg_score DESC`;
      const data = await this.dataSource.query(sqlQuery);
      if (data.length === 0) return { sqlQuery, response: 'No class performance data is available yet.' };
      const lines = data.map((c: any) => `• **${c.class_id}**: avg ${c.avg_score}%, pass rate ${c.pass_rate}%, ${c.student_count} students`);
      return { sqlQuery, response: `🏫 **Class-wise Performance**\n\n${lines.join('\n')}` };
    }

    if (wantsPoorPerformers) {
      const sqlQuery = `SELECT s.name, s.student_id, s.class_id,
        ROUND(AVG(m.percentage)::numeric, 2) as avg_score,
        COUNT(m.mark_id) as exams_taken
        FROM marks m JOIN students s ON s.student_id = m.student_id
        WHERE m.status = 'Published' AND m.percentage IS NOT NULL
        GROUP BY s.name, s.student_id, s.class_id
        HAVING AVG(m.percentage) < 40
        ORDER BY avg_score ASC LIMIT 15`;
      const data = await this.dataSource.query(sqlQuery);
      if (data.length === 0) return { sqlQuery, response: 'Great news! No students are currently performing below 40%. All students are above the passing threshold.' };
      const lines = data.map((s: any) => `• **${s.name}** (${s.student_id}, ${s.class_id}): avg ${s.avg_score}% across ${s.exams_taken} exams`);
      return { sqlQuery, response: `⚠️ **Students Performing Poorly (below 40%)**\n\n${lines.join('\n')}\n\n💡 *Recommendation*: These students need immediate academic intervention and support.` };
    }

    if (wantsTopPerformers) {
      const sqlQuery = `SELECT s.name, s.student_id, s.class_id,
        ROUND(AVG(m.percentage)::numeric, 2) as avg_score,
        COUNT(m.mark_id) as exams_taken
        FROM marks m JOIN students s ON s.student_id = m.student_id
        WHERE m.status = 'Published' AND m.percentage IS NOT NULL
        GROUP BY s.name, s.student_id, s.class_id
        ORDER BY avg_score DESC LIMIT 10`;
      const data = await this.dataSource.query(sqlQuery);
      if (data.length === 0) return { sqlQuery, response: 'No student performance data is available yet.' };
      const lines = data.map((s: any, i: number) => `${i + 1}. **${s.name}** (${s.class_id}): ${s.avg_score}% avg across ${s.exams_taken} exams`);
      return { sqlQuery, response: `🏆 **Top Performing Students**\n\n${lines.join('\n')}` };
    }

    // General performance overview
    const sqlQuery = `SELECT
      ROUND(AVG(m.percentage)::numeric, 2) as avg_score,
      COUNT(DISTINCT m.student_id) as total_students,
      ROUND(AVG(CASE WHEN m.percentage >= 40 THEN 1 ELSE 0 END)::numeric * 100, 1) as pass_rate,
      MAX(m.percentage) as highest, MIN(m.percentage) as lowest
      FROM marks m WHERE m.status = 'Published' AND m.percentage IS NOT NULL`;
    const data = await this.dataSource.query(sqlQuery);
    const d = data[0];
    if (!d?.avg_score) return { sqlQuery, response: 'No performance data is available yet. Marks may not have been published.' };

    return {
      sqlQuery,
      response: `📊 **Overall Performance Summary**\n\n• Average Score: **${d.avg_score}%**\n• Total Students: **${d.total_students}**\n• Pass Rate: **${d.pass_rate}%**\n• Highest Score: **${d.highest}%**\n• Lowest Score: **${d.lowest}%**`,
    };
  }

  private async handleFinancialQuery(q: string, pattern: any): Promise<{ sqlQuery: string; response: string }> {
    const sqlQuery = `SELECT
      COALESCE(SUM(amount), 0) as total_collected,
      COUNT(*) as payment_count,
      COUNT(DISTINCT enrollment_id) as unique_enrollments
      FROM paid_student_fees`;
    
    try {
      const data = await this.dataSource.query(sqlQuery);
      const d = data[0];
      return {
        sqlQuery,
        response: `💰 **Fee Collection Summary**\n\n• Total Collected: **₹${parseFloat(d.total_collected || 0).toLocaleString()}**\n• Number of Payments: **${d.payment_count}**\n• Unique Enrollments: **${d.unique_enrollments}**`,
      };
    } catch {
      return { sqlQuery: '', response: 'Fee collection data is not available. The fee tables may not be set up yet.' };
    }
  }

  private async handleOperationalQuery(q: string, pattern: any): Promise<{ sqlQuery: string; response: string }> {
    const wantsAttendance = /attendance|present|absent/i.test(q);

    if (wantsAttendance) {
      const sqlQuery = `SELECT
        ROUND(AVG(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::numeric * 100, 1) as attendance_rate,
        COUNT(*) as total_records,
        COUNT(DISTINCT a.student_id) as tracked_students,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as total_absences
        FROM attendance a`;
      try {
        const data = await this.dataSource.query(sqlQuery);
        const d = data[0];
        if (!d?.attendance_rate) return { sqlQuery, response: 'No attendance data is available yet.' };
        return {
          sqlQuery,
          response: `📋 **Attendance Summary**\n\n• Attendance Rate: **${d.attendance_rate}%**\n• Total Records: **${d.total_records}**\n• Students Tracked: **${d.tracked_students}**\n• Total Absences: **${d.total_absences}**`,
        };
      } catch {
        return { sqlQuery: '', response: 'Attendance data is not available. The attendance module may not be set up yet.' };
      }
    }

    // General operational stats
    const sqlQuery = `SELECT
      (SELECT COUNT(*) FROM students WHERE status = 'Active') as active_students,
      (SELECT COUNT(*) FROM teachers WHERE status = 'Active') as active_teachers,
      (SELECT COUNT(*) FROM subjects WHERE status = 'Active') as active_subjects,
      (SELECT COUNT(*) FROM exams) as total_exams`;
    const data = await this.dataSource.query(sqlQuery);
    const d = data[0];
    return {
      sqlQuery,
      response: `🏫 **School Overview**\n\n• Active Students: **${d.active_students}**\n• Active Teachers: **${d.active_teachers}**\n• Active Subjects: **${d.active_subjects}**\n• Total Exams: **${d.total_exams}**`,
    };
  }

  private async handlePredictiveQuery(q: string, pattern: any): Promise<{ sqlQuery: string; response: string }> {
    // Use analytics agent for at-risk student detection
    const sqlQuery = `SELECT s.name, s.student_id, s.class_id,
      ROUND(AVG(m.percentage)::numeric, 2) as avg_score,
      COUNT(m.mark_id) as exams_taken,
      ROUND(STDDEV(m.percentage)::numeric, 2) as score_variance
      FROM marks m JOIN students s ON s.student_id = m.student_id
      WHERE m.status = 'Published' AND m.percentage IS NOT NULL
      GROUP BY s.name, s.student_id, s.class_id
      HAVING AVG(m.percentage) < 50 OR STDDEV(m.percentage) > 20
      ORDER BY avg_score ASC LIMIT 10`;
    const data = await this.dataSource.query(sqlQuery);
    if (data.length === 0) return { sqlQuery, response: 'No at-risk students detected based on current performance data.' };
    const lines = data.map((s: any) => {
      const risk = parseFloat(s.avg_score) < 35 ? '🔴 High Risk' : parseFloat(s.avg_score) < 50 ? '🟡 Medium Risk' : '🟠 Fluctuating';
      return `• **${s.name}** (${s.class_id}): ${s.avg_score}% avg, variance ${s.score_variance || 'N/A'} — ${risk}`;
    });
    return {
      sqlQuery,
      response: `🔮 **At-Risk Student Analysis**\n\n${lines.join('\n')}\n\n💡 *Students with avg below 50% or high score variance may need intervention.*`,
    };
  }

  private async handleAdminQuery(q: string, pattern: any): Promise<{ sqlQuery: string; response: string }> {
    // Generate a summary report
    const insights = await this.analyticsAgent.generateInsights({}, {});
    const parts: string[] = ['📋 **Administrative Summary**\n'];
    if (insights.insights.length > 0) {
      parts.push('**Key Insights:**');
      insights.insights.forEach((i: string) => parts.push(`• ${i}`));
    }
    if (insights.recommendations.length > 0) {
      parts.push('\n**Recommendations:**');
      insights.recommendations.forEach((r: string) => parts.push(`• ${r}`));
    }
    if (insights.anomalies.length > 0) {
      parts.push('\n**⚠️ Anomalies Detected:**');
      insights.anomalies.forEach((a: any) => parts.push(`• ${a.message || a.type}: ${a.action || ''}`));
    }
    return { sqlQuery: '(multiple queries via analytics agent)', response: parts.join('\n') };
  }

  private async handleGeneralQuery(q: string, pattern: any): Promise<{ sqlQuery: string; response: string }> {
    // Try to match common questions
    if (/how many student/i.test(q)) {
      const sqlQuery = `SELECT COUNT(*) as count, status FROM students GROUP BY status`;
      const data = await this.dataSource.query(sqlQuery);
      const lines = data.map((d: any) => `• ${d.status}: **${d.count}**`);
      return { sqlQuery, response: `👨‍🎓 **Student Count**\n\n${lines.join('\n')}` };
    }
    if (/how many teacher/i.test(q)) {
      const sqlQuery = `SELECT COUNT(*) as count, status FROM teachers GROUP BY status`;
      const data = await this.dataSource.query(sqlQuery);
      const lines = data.map((d: any) => `• ${d.status}: **${d.count}**`);
      return { sqlQuery, response: `👩‍🏫 **Teacher Count**\n\n${lines.join('\n')}` };
    }
    if (/how many (subject|course)/i.test(q)) {
      const sqlQuery = `SELECT COUNT(*) as count FROM subjects WHERE status = 'Active'`;
      const data = await this.dataSource.query(sqlQuery);
      return { sqlQuery, response: `📚 There are **${data[0].count}** active subjects.` };
    }
    if (/how many exam/i.test(q)) {
      const sqlQuery = `SELECT COUNT(*) as count FROM exams`;
      const data = await this.dataSource.query(sqlQuery);
      return { sqlQuery, response: `📝 There are **${data[0].count}** exams in the system.` };
    }

    // Fallback: provide a general overview using the analytics agent
    return this.handleAdminQuery(q, pattern);
  }

  // ========== OPENAI METHODS (used when API key is available) ==========

  private async generateQueryWithOpenAI(question: string, template: any, context: any): Promise<string> {
    const prompt = `
      Given the question: "${question}"
      And the context: ${JSON.stringify(context)}
      Generate an SQL query to answer this question.
      
      Database schema includes:
      - students (student_id, name, class_id, section_id, roll_no, status)
      - teachers (teacher_id, name, email, phone, status)
      - classes (class_id, class_name)
      - sections (section_id, section_name, class_id)
      - subjects (subject_id, subject_name, subject_code)
      - exams (exam_id, exam_name, exam_type, class_id)
      - marks (mark_id, student_id, exam_id, subject_id, marks_obtained, total_marks, percentage, grade, status)
      - attendance (id, lecture_id, student_id, status, date)
      
      Return only the SQL query without explanation.
    `;

    const completion = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    return completion.choices[0].message.content?.trim() || '';
  }

  private async executeQuery(sqlQuery: string): Promise<any> {
    if (!sqlQuery || sqlQuery.trim() === '') return { data: [], columns: [] };
    try {
      const data = await this.dataSource.query(sqlQuery);
      return { data, columns: data.length > 0 ? Object.keys(data[0]) : [] };
    } catch (error) {
      console.warn('Query execution failed:', error.message);
      return { data: [], columns: [], error: error.message };
    }
  }

  private async generateResponseWithOpenAI(question: string, results: any, pattern: any): Promise<string> {
    const prompt = `
      Given the question: "${question}"
      And the query results: ${JSON.stringify(results)}
      Generate a natural language response that answers the question clearly and concisely.
      
      If no data was found, say so politely.
      If the data shows interesting patterns, highlight them.
      Use bullet points for multiple data points.
    `;

    const completion = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    return completion.choices[0].message.content?.trim() || '';
  }

  private async storeQueryVector(interactionId: number, query: string, pattern: any): Promise<void> {
    const response = await this.openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
      input: query,
    });

    const vector = response.data[0].embedding;

    await this.vectorRepository.save({
      interactionId,
      queryVector: vector,
      category: pattern.category,
      intent: pattern.intent,
      similarityScore: pattern.confidence,
    });
  }

  private async updateContextMemory(userId: string, sessionId: string, data: any): Promise<void> {
    // Clean old context
    await this.contextRepository
      .createQueryBuilder()
      .delete()
      .where('"userId" = :userId AND "expiresAt" < :now', { userId, now: new Date() })
      .execute();

    // Add new context
    await this.contextRepository.save({
      userId,
      sessionId,
      contextType: 'last_interaction',
      contextData: data,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
  }

  private async getPerformanceInsights(userId: string, userRole: string): Promise<any> {
    return this.analyticsAgent.analyzePerformance({ entityType: 'student' });
  }

  private async getFinancialInsights(userId: string, userRole: string): Promise<any> {
    return this.handleFinancialQuery('', {});
  }

  private async getAttendanceInsights(userId: string, userRole: string): Promise<any> {
    return this.handleOperationalQuery('attendance', {});
  }

  private async getPredictiveInsights(userId: string, userRole: string): Promise<any> {
    return this.handlePredictiveQuery('', {});
  }
}
