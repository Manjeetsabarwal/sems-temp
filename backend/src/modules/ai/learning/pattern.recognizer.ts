import { Repository, DataSource } from 'typeorm';
import { AiInteraction } from '../entities/ai-interaction.entity';
import { AiPattern } from '../entities/ai-pattern.entity';

interface RecognizedPattern {
  category: string;
  subcategory?: string;
  intent: string;
  confidence: number;
  entities: Record<string, string>;
  keywords: string[];
}

export class PatternRecognizer {
  

  // Pre-defined patterns with keywords
  private readonly patterns = {
    academic_performance: {
      keywords: ['performance', 'performing', 'score', 'marks', 'grade', 'result', 'exam', 'test', 'poorly', 'topper', 'fail', 'pass', 'rank', 'average', 'percentage'],
      subcategories: {
        individual: ['student', 'individual', 'personal'],
        class: ['class', 'section', 'batch'],
        comparative: ['compare', 'comparison', 'versus', 'vs'],
        subject: ['subject', 'topic', 'chapter'],
        trend: ['trend', 'progress', 'improvement', 'decline'],
      }
    },
    financial_management: {
      keywords: ['fee', 'payment', 'revenue', 'income', 'cost', 'expense', 'payout'],
      subcategories: {
        fee_analysis: ['fee', 'payment', 'collection'],
        revenue_analysis: ['revenue', 'income', 'earnings'],
        expense_tracking: ['expense', 'cost', 'payout', 'salary'],
      }
    },
    operational_insights: {
      keywords: ['attendance', 'timetable', 'schedule', 'resource', 'capacity', 'workload', 'present', 'absent'],
      subcategories: {
        attendance_analysis: ['attendance', 'present', 'absent'],
        resource_utilization: ['resource', 'capacity', 'workload', 'allocation'],
        timetable_optimization: ['timetable', 'schedule', 'slot', 'period'],
      }
    },
    predictive_analytics: {
      keywords: ['predict', 'forecast', 'risk', 'probability', 'likelihood', 'future'],
      subcategories: {
        risk_assessment: ['risk', 'danger', 'threat', 'at-risk'],
        performance_prediction: ['predict', 'forecast', 'expect', 'likely'],
        resource_planning: ['plan', 'requirement', 'need', 'future'],
      }
    },
    administration: {
      keywords: ['report', 'generate', 'create', 'send', 'notify', 'compliance'],
      subcategories: {
        reporting: ['report', 'summary', 'overview'],
        compliance: ['compliance', 'regulation', 'requirement'],
        communication: ['send', 'notify', 'announce', 'communicate'],
      }
    }
  };

  // Entity extraction patterns
  private readonly entityPatterns = {
    student_name: /\b(student|pupil|boy|girl)\s+([A-Za-z\s]+)\b/gi,
    class_name: /\b(class|section)\s+([0-9A-Z]+)\b/gi,
    subject: /\b(subject|topic)\s+([A-Za-z\s]+)\b/gi,
    teacher_name: /\b(teacher|professor|sir|ma'am)\s+([A-Za-z\s]+)\b/gi,
    month: /\b(january|february|march|april|may|june|july|august|september|october|november|december|this month|last month|next month)\b/gi,
    timeframe: /\b(today|yesterday|this week|last week|this month|last month|this year|last year)\b/gi,
    metric: /\b(score|marks|grade|percentage|average|rank)\b/gi,
  };

  private patternRepository: Repository<AiPattern>;

  constructor(dataSource: DataSource) {
    this.patternRepository = dataSource.getRepository(AiPattern);
  }

  async recognizePattern(query: string): Promise<RecognizedPattern> {
    const normalizedQuery = query.toLowerCase().trim();
    
    // 1. Identify category
    const category = this.identifyCategory(normalizedQuery);
    
    // 2. Identify subcategory
    const subcategory = this.identifySubcategory(normalizedQuery, category);
    
    // 3. Identify intent
    const intent = this.identifyIntent(normalizedQuery, category, subcategory);
    
    // 4. Extract entities
    const entities = this.extractEntities(query);
    
    // 5. Extract keywords
    const keywords = this.extractKeywords(normalizedQuery);
    
    // 6. Calculate confidence
    const confidence = this.calculateConfidence(normalizedQuery, category, subcategory, keywords);
    
    return {
      category,
      subcategory,
      intent,
      confidence,
      entities,
      keywords,
    };
  }

  async extractFromInteraction(interaction: AiInteraction): Promise<Partial<AiPattern>[]> {
    const patterns: Partial<AiPattern>[] = [];
    const query = interaction.question.toLowerCase();
    
    // Extract new patterns from the query
    for (const [category, config] of Object.entries(this.patterns)) {
      if (config.keywords.some(keyword => query.includes(keyword))) {
        // Check if this is a new pattern
        const existing = await this.patternRepository.findOne({
          where: {
            patternType: 'query_pattern',
            category,
            pattern: interaction.question,
          },
        });

        if (!existing) {
          patterns.push({
            patternType: 'query_pattern',
            pattern: interaction.question,
            category,
            subcategory: this.identifySubcategory(query, category),
            keywords: this.extractKeywords(query),
            confidenceScore: 0.7,
            autoGenerated: true,
            isActive: true,
          });
        }
      }
    }

    return patterns;
  }

  private identifyCategory(query: string): string {
    const scores = {};
    
    for (const [category, config] of Object.entries(this.patterns)) {
      let score = 0;
      
      // Count keyword matches
      for (const keyword of config.keywords) {
        if (query.includes(keyword)) {
          score += 1;
        }
      }
      
      scores[category] = score;
    }

    // Return category with highest score
    const bestCategory = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];

    return scores[bestCategory] > 0 ? bestCategory : 'unknown';
  }

  private identifySubcategory(query: string, category: string): string | undefined {
    if (category === 'unknown' || !this.patterns[category]) {
      return undefined;
    }

    const subcategories = this.patterns[category].subcategories;
    
    for (const [subcategory, keywords] of Object.entries(subcategories)) {
      if ((keywords as string[]).some(keyword => query.includes(keyword))) {
        return subcategory;
      }
    }

    return undefined;
  }

  private identifyIntent(query: string, category: string, subcategory?: string): string {
    // Intent patterns based on question words and verbs
    const intentPatterns = {
      show: ['show', 'display', 'list', 'get', 'give me', 'what is', 'tell me'],
      compare: ['compare', 'difference', 'versus', 'vs', 'better', 'worse'],
      analyze: ['analyze', 'analysis', 'breakdown', 'break down'],
      predict: ['predict', 'forecast', 'expect', 'likely', 'probability'],
      identify: ['identify', 'find', 'which', 'who', 'where'],
      generate: ['generate', 'create', 'make', 'produce'],
      check: ['check', 'verify', 'validate', 'confirm'],
    };

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(pattern => query.includes(pattern))) {
        return intent;
      }
    }

    return 'show'; // Default intent
  }

  private extractEntities(query: string): Record<string, string> {
    const entities = {};
    
    for (const [entityType, pattern] of Object.entries(this.entityPatterns)) {
      const matches = [...query.matchAll(pattern)];
      if (matches.length > 0) {
        entities[entityType] = matches.map(m => m[2] || m[1] || m[0]);
      }
    }

    return entities;
  }

  private extractKeywords(query: string): string[] {
    // Remove common words and extract meaningful keywords
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'me', 'my', 'i', 'you', 'your', 'we', 'our', 'they', 'their', 'them',
    ]);

    const words = query.split(/\s+/).filter(word => 
      word.length > 2 && !stopWords.has(word.toLowerCase())
    );

    return [...new Set(words)]; // Remove duplicates
  }

  private calculateConfidence(
    query: string, 
    category: string, 
    subcategory: string | undefined, 
    keywords: string[]
  ): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on category keyword matches
    if (category !== 'unknown' && this.patterns[category]) {
      const categoryMatches = this.patterns[category].keywords.filter(k => 
        query.includes(k)
      ).length;
      confidence += Math.min(categoryMatches * 0.1, 0.3);
    }

    // Boost confidence if subcategory is identified
    if (subcategory) {
      confidence += 0.1;
    }

    // Boost confidence based on extracted entities
    const entityCount = Object.keys(this.extractEntities(query)).length;
    confidence += Math.min(entityCount * 0.05, 0.1);

    // Ensure confidence is between 0 and 1
    return Math.min(Math.max(confidence, 0), 1);
  }

  // Method to learn new patterns from interactions
  async learnFromInteractions(interactions: AiInteraction[]): Promise<void> {
    const queryGroups = this.groupSimilarQueries(interactions);
    
    for (const [queryPattern, similarQueries] of queryGroups) {
      if (similarQueries.length >= 3) { // Only learn from patterns with 3+ examples
        await this.createLearnedPattern(queryPattern, similarQueries);
      }
    }
  }

  private groupSimilarQueries(interactions: AiInteraction[]): Map<string, AiInteraction[]> {
    const groups = new Map<string, AiInteraction[]>();
    
    for (const interaction of interactions) {
      const normalized = this.normalizeQuery(interaction.question);
      let grouped = false;
      
      // Try to match with existing groups
      for (const [pattern, queries] of groups) {
        if (this.areQueriesSimilar(normalized, pattern)) {
          queries.push(interaction);
          grouped = true;
          break;
        }
      }
      
      // Create new group if not matched
      if (!grouped) {
        groups.set(normalized, [interaction]);
      }
    }
    
    return groups;
  }

  private normalizeQuery(query: string): string {
    // Remove specific values and keep structure
    return query
      .toLowerCase()
      .replace(/\b\d+\b/g, '{number}')
      .replace(/\b[A-Z][a-z]+\b/g, '{name}')
      .replace(/\b(class|section)\s+\w+/g, '$1 {class}')
      .replace(/\b(subject)\s+\w+/g, '$1 {subject}');
  }

  private areQueriesSimilar(query1: string, query2: string): boolean {
    // Calculate similarity based on common words
    const words1 = new Set(query1.split(' '));
    const words2 = new Set(query2.split(' '));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size > 0.6; // 60% similarity threshold
  }

  private async createLearnedPattern(
    pattern: string, 
    examples: AiInteraction[]
  ): Promise<void> {
    // Calculate success rate from examples
    const withFeedback = examples.filter(e => e.feedback && e.feedback.length > 0);
    const successful = withFeedback.filter(e => 
      e.feedback[0].rating >= 4 || e.feedback[0].feedbackType === 'thumbs_up'
    );
    
    const successRate = withFeedback.length > 0 
      ? successful.length / withFeedback.length 
      : 0;

    // Identify category from examples
    const category = this.identifyCategory(pattern);
    const subcategory = this.identifySubcategory(pattern, category);

    await this.patternRepository.save({
      patternType: 'query_pattern',
      pattern,
      category,
      subcategory,
      keywords: this.extractKeywords(pattern),
      frequency: examples.length,
      successRate,
      confidenceScore: Math.min(0.5 + (examples.length * 0.1), 0.9),
      autoGenerated: true,
      isActive: true,
      templateExample: examples[0].question,
    });
  }
}
