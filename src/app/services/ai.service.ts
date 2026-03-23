import { apiCall, API_BASE_URL } from '../config/api.config';

export interface AiQueryRequest {
  question: string;
  context?: any;
}

export interface AiQueryResponse {
  id: string;
  response: string;
  sqlQuery: string;
  responseTime: number;
  category: string;
  confidence: number;
}

export interface AiFeedbackRequest {
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
}

export interface AiInsight {
  type: string;
  title: string;
  description: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'stable';
  impact: 'high' | 'medium' | 'low';
  recommendations: string[];
  lastUpdated: string;
}

export interface AiInsightResponse {
  insights: AiInsight[];
  recommendations: string[];
}

export interface AutomationTask {
  task: string;
  parameters: any;
  schedule?: string;
}

export interface AutomationResponse {
  message: string;
  taskId: string;
}

class AiService {
  async query(request: AiQueryRequest): Promise<AiQueryResponse> {
    const response = await apiCall<AiQueryResponse>(`${API_BASE_URL}/api/ai/query`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response;
  }

  async submitFeedback(request: AiFeedbackRequest): Promise<void> {
    await apiCall(`${API_BASE_URL}/api/ai/feedback`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getInsights(type: string, timeframe?: string): Promise<AiInsightResponse> {
    const params = new URLSearchParams();
    if (timeframe) params.append('timeframe', timeframe);
    
    const response = await apiCall<AiInsightResponse>(`${API_BASE_URL}/api/ai/insights/${type}?${params}`);
    return response;
  }

  async automateTask(request: AutomationTask): Promise<AutomationResponse> {
    const response = await apiCall<AutomationResponse>(`${API_BASE_URL}/api/ai/automate`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response;
  }

  async getSuggestions(context?: string): Promise<string[]> {
    const params = new URLSearchParams();
    if (context) params.append('context', context);
    
    const response = await apiCall<{ suggestions: string[] }>(`${API_BASE_URL}/api/ai/suggestions?${params}`);
    return response.suggestions;
  }

  async getLearningMetrics(days: number = 30): Promise<any> {
    const response = await apiCall(`${API_BASE_URL}/api/ai/learning-metrics?days=${days}`);
    return response;
  }

  async getPromptTemplates(category?: string): Promise<any> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    
    const response = await apiCall(`${API_BASE_URL}/api/ai/templates?${params}`);
    return response;
  }

  async createTemplate(templateData: any): Promise<void> {
    await apiCall(`${API_BASE_URL}/api/ai/templates`, {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }

  async getPatterns(type?: string): Promise<any> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    
    const response = await apiCall(`${API_BASE_URL}/api/ai/patterns?${params}`);
    return response;
  }

  async getDashboard(): Promise<any> {
    const response = await apiCall(`${API_BASE_URL}/api/ai/dashboard`);
    return response;
  }

  async getPerformanceAnalysis(entityType: string, entityId?: string, timeframe?: string): Promise<any> {
    const params = new URLSearchParams();
    if (timeframe) params.append('timeframe', timeframe);
    const response = await apiCall(`${API_BASE_URL}/api/ai/insights/${entityType}?${params}`);
    return response;
  }

  // Helper methods for common queries
  async getStudentPerformance(studentId?: string, timeframe?: string): Promise<string> {
    const question = studentId 
      ? `Show me the performance of student ${studentId}${timeframe ? ` over the last ${timeframe}` : ''}`
      : `Show me student performance overview${timeframe ? ` for the last ${timeframe}` : ''}`;
    
    const response = await this.query({ question });
    return response.response;
  }

  async getFeeCollectionStatus(month?: string): Promise<string> {
    const question = month 
      ? `What is the fee collection status for ${month}?`
      : 'What is the current fee collection status?';
    
    const response = await this.query({ question });
    return response.response;
  }

  async getAttendanceAnalysis(classId?: string): Promise<string> {
    const question = classId 
      ? `Show me attendance analysis for class ${classId}`
      : 'Show me overall attendance analysis';
    
    const response = await this.query({ question });
    return response.response;
  }

  async predictExamPerformance(subject?: string): Promise<string> {
    const question = subject 
      ? `Predict exam performance for ${subject}`
      : 'Predict overall exam performance trends';
    
    const response = await this.query({ question });
    return response.response;
  }

  async generateReport(type: string, parameters: any): Promise<string> {
    const question = `Generate a ${type} report with the following parameters: ${JSON.stringify(parameters)}`;
    const response = await this.query({ question });
    return response.response;
  }

  async identifyAtRiskStudents(): Promise<string> {
    const response = await this.query({ 
      question: 'Identify students who are at risk of poor performance or dropping out' 
    });
    return response.response;
  }

  async getTeacherPerformance(teacherId?: string): Promise<string> {
    const question = teacherId 
      ? `Show me performance metrics for teacher ${teacherId}`
      : 'Show me overall teacher performance analysis';
    
    const response = await this.query({ question });
    return response.response;
  }

  async compareClassPerformance(class1: string, class2: string, subject?: string): Promise<string> {
    const question = subject 
      ? `Compare performance between class ${class1} and ${class2} in ${subject}`
      : `Compare overall performance between class ${class1} and ${class2}`;
    
    const response = await this.query({ question });
    return response.response;
  }

  async analyzeSubjectDifficulty(subject: string): Promise<string> {
    const response = await this.query({ 
      question: `Analyze the difficulty level and common mistakes in ${subject}` 
    });
    return response.response;
  }

  async getFinancialProjections(timeframe: string): Promise<string> {
    const response = await this.query({ 
      question: `Provide financial projections for the next ${timeframe}` 
    });
    return response.response;
  }

  async optimizeTimetable(classId?: string): Promise<string> {
    const question = classId 
      ? `Suggest an optimized timetable for class ${classId}`
      : 'Suggest optimizations for the overall school timetable';
    
    const response = await this.query({ question });
    return response.response;
  }

  async getRecommendations(entityType: string, entityId?: string): Promise<string> {
    const question = entityId 
      ? `Provide recommendations for ${entityType} ${entityId}`
      : `Provide general recommendations for ${entityType}`;
    
    const response = await this.query({ question });
    return response.response;
  }

  // Batch operations for multiple queries
  async batchQuery(questions: string[]): Promise<AiQueryResponse[]> {
    const promises = questions.map(question => this.query({ question }));
    return Promise.all(promises);
  }

  // Stream response for real-time updates
  async streamQuery(request: AiQueryRequest, onChunk: (chunk: string) => void): Promise<void> {
    // Implementation would use Server-Sent Events or WebSocket
    // For now, we'll use the regular query method
    const response = await this.query(request);
    onChunk(response.response);
  }
}

export default new AiService();
