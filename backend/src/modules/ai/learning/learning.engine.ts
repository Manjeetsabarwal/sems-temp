import { Repository, Between, LessThan, MoreThan, DataSource } from 'typeorm';
import { AiInteraction } from '../entities/ai-interaction.entity';
import { AiFeedback } from '../entities/ai-feedback.entity';
import { AiPattern } from '../entities/ai-pattern.entity';
import { AiPromptTemplate } from '../entities/ai-prompt-template.entity';
import { AiLearningMetric } from '../entities/ai-learning-metric.entity';
import { PatternRecognizer } from './pattern.recognizer';
import { PromptManager } from './prompt.manager';
import { FeedbackAnalyzer } from './feedback.analyzer';

export class LearningEngine {
  

  private interactionRepository: Repository<AiInteraction>;
  private feedbackRepository: Repository<AiFeedback>;
  private patternRepository: Repository<AiPattern>;
  private templateRepository: Repository<AiPromptTemplate>;
  private metricsRepository: Repository<AiLearningMetric>;

  constructor(
    dataSource: DataSource,
    private patternRecognizer: PatternRecognizer,
    private promptManager: PromptManager,
    private feedbackAnalyzer: FeedbackAnalyzer,
  ) {
    this.interactionRepository = dataSource.getRepository(AiInteraction);
    this.feedbackRepository = dataSource.getRepository(AiFeedback);
    this.patternRepository = dataSource.getRepository(AiPattern);
    this.templateRepository = dataSource.getRepository(AiPromptTemplate);
    this.metricsRepository = dataSource.getRepository(AiLearningMetric);
  }

  async processInteraction(interactionId: number): Promise<void> {
    try {
      const interaction = await this.interactionRepository.findOne({
        where: { id: interactionId },
        relations: ['feedback'],
      });

      if (!interaction) return;

      // 1. Extract and learn patterns
      await this.extractPatterns(interaction);

      // 2. Update template performance
      await this.updateTemplatePerformance(interaction);

      // 3. Check for new query types
      await this.identifyNewQueryTypes(interaction);

    } catch (error) {
      console.error(`Error processing interaction ${interactionId}:`, error);
    }
  }

  async processFeedback(feedbackId: number): Promise<void> {
    try {
      const feedback = await this.feedbackRepository.findOne({
        where: { id: feedbackId },
        relations: ['interaction'],
      });

      if (!feedback) return;

      // 1. Analyze feedback patterns
      await this.feedbackAnalyzer.analyze(feedback);

      // 2. Adjust confidence scores
      await this.adjustConfidenceScores(feedback);

      // 3. Generate improvement suggestions
      await this.generateImprovementSuggestions(feedback);

    } catch (error) {
      console.error(`Error processing feedback ${feedbackId}:`, error);
    }
  }

  async updatePatternFrequencies(): Promise<void> {
    console.log('Updating pattern frequencies...');
    
    const patterns = await this.patternRepository.find();
    
    for (const pattern of patterns) {
      const stats = await this.getPatternStats(pattern.pattern);
      await this.patternRepository.update(pattern.id, {
        frequency: stats.frequency,
        successRate: stats.successRate,
        lastUsed: stats.lastUsed,
        lastSuccess: stats.lastSuccess,
      });
    }
  }

  async analyzeDailyInteractions(): Promise<void> {
    console.log('Analyzing daily interactions...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get yesterday's interactions
    const interactions = await this.interactionRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.feedback', 'f')
      .where('i."createdAt" >= :yesterday AND i."createdAt" < :today', { yesterday, today })
      .getMany();

    // Analyze and extract new patterns
    const newPatterns = await this.discoverNewPatterns(interactions);
    
    // Generate new templates if needed
    const newTemplates = await this.generateNewTemplates(interactions);
    
    // Calculate metrics
    const metrics = this.calculateDailyMetrics(interactions);
    
    // Save metrics
    await this.metricsRepository.save({
      metricDate: yesterday,
      ...metrics,
      newPatternsDiscovered: newPatterns.length,
      templatesGenerated: newTemplates.length,
    });

    console.log(`Discovered ${newPatterns.length} new patterns and generated ${newTemplates.length} templates`);
  }

  async optimizePromptTemplates(): Promise<void> {
    console.log('Optimizing prompt templates...');
    
    // Get underperforming templates using query builder
    const underperforming = await this.templateRepository
      .createQueryBuilder('t')
      .where('t."successRate" < :rate AND t."usageCount" > :count', { rate: 0.7, count: 10 })
      .getMany();

    // Generate variations
    for (const template of underperforming) {
      const variations = await this.generateTemplateVariations(template);
      
      for (const variation of variations) {
        await this.testTemplateVariation(variation);
      }
    }
  }

  private async extractPatterns(interaction: AiInteraction): Promise<void> {
    const patterns = await this.patternRecognizer.extractFromInteraction(interaction);
    
    for (const pattern of patterns) {
      await this.patternRepository.save({
        ...pattern,
        autoGenerated: true,
      });
    }
  }

  private async updateTemplatePerformance(interaction: AiInteraction): Promise<void> {
    if (!interaction.feedback || interaction.feedback.length === 0) return;

    const feedback = interaction.feedback[0];
    const hasPositiveFeedback = feedback.rating >= 4 || feedback.feedbackType === 'thumbs_up';

    const templates = await this.findUsedTemplates(interaction);
    
    for (const template of templates) {
      await this.templateRepository.increment({ id: template.id }, 'usageCount', 1);
      
      if (hasPositiveFeedback) {
        await this.templateRepository.increment({ id: template.id }, 'successCount', 1);
      }
      
      await this.updateTemplateSuccessRate(template.id);
    }
  }

  private async identifyNewQueryTypes(interaction: AiInteraction): Promise<void> {
    const knownPatterns = await this.patternRepository.find({
      where: { isActive: true },
    });

    const isKnown = knownPatterns.some(pattern => 
      this.matchesPattern(interaction.question, pattern.pattern)
    );

    if (!isKnown) {
      await this.patternRepository.save({
        patternType: 'query_pattern' as const,
        pattern: interaction.question,
        category: 'unknown',
        frequency: 1,
        successRate: 0,
        autoGenerated: true,
        isActive: true,
      });
    }
  }

  private discoverNewPatterns(interactions: AiInteraction[]): AiPattern[] {
    const patterns: AiPattern[] = [];
    
    const clusters = this.clusterSimilarQueries(interactions);
    
    for (const cluster of clusters) {
      if (cluster.length >= 3) {
        const pattern = this.extractPatternFromCluster(cluster);
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  private async generateNewTemplates(interactions: AiInteraction[]): Promise<Partial<AiPromptTemplate>[]> {
    const templates: Partial<AiPromptTemplate>[] = [];
    
    // Filter successful interactions synchronously first
    const successfulInteractions = interactions.filter(i => 
      i.feedback && i.feedback.length > 0 && i.feedback[0].rating >= 4
    );

    // Then check templates asynchronously
    for (const interaction of successfulInteractions) {
      const hasExisting = await this.hasTemplate(interaction.question);
      if (!hasExisting) {
        const template = this.createTemplateFromInteraction(interaction);
        if (template) {
          templates.push(template);
        }
      }
    }
    
    return templates;
  }

  private calculateDailyMetrics(interactions: AiInteraction[]): any {
    const total = interactions.length;
    const withFeedback = interactions.filter(i => i.feedback && i.feedback.length > 0);
    const successful = withFeedback.filter(i => 
      i.feedback[0].rating >= 4 || i.feedback[0].feedbackType === 'thumbs_up'
    );

    const averageFeedbackScore = withFeedback.length > 0 
      ? withFeedback.reduce((sum, i) => sum + (i.feedback[0].rating || 0), 0) / withFeedback.length
      : 0;

    const uniqueQueries = new Set(interactions.map(i => i.question.toLowerCase().trim())).size;
    const repeatQueries = total - uniqueQueries;

    return {
      totalInteractions: total,
      successfulInteractions: successful.length,
      averageFeedbackScore,
      uniqueQueries,
      repeatQueries,
    };
  }

  private async getPatternStats(pattern: string): Promise<any> {
    const interactions = await this.interactionRepository
      .createQueryBuilder('i')
      .where('i.question ILIKE :pattern', { pattern: `%${pattern}%` })
      .leftJoinAndSelect('i.feedback', 'f')
      .getMany();

    const frequency = interactions.length;
    const withFeedback = interactions.filter(i => i.feedback && i.feedback.length > 0);
    const successful = withFeedback.filter(i => 
      i.feedback[0].rating >= 4 || i.feedback[0].feedbackType === 'thumbs_up'
    );

    const successRate = withFeedback.length > 0 ? successful.length / withFeedback.length : 0;
    const lastUsed = interactions.length > 0 ? interactions[interactions.length - 1].createdAt : null;
    const lastSuccess = successful.length > 0 ? successful[successful.length - 1].createdAt : null;

    return { frequency, successRate, lastUsed, lastSuccess };
  }

  private matchesPattern(question: string, pattern: string): boolean {
    return question.toLowerCase().includes(pattern.toLowerCase()) ||
           pattern.toLowerCase().includes(question.toLowerCase());
  }

  private clusterSimilarQueries(interactions: AiInteraction[]): AiInteraction[][] {
    const clusters: AiInteraction[][] = [];
    const processed = new Set<number>();

    for (const interaction of interactions) {
      if (processed.has(interaction.id)) continue;

      const cluster = [interaction];
      processed.add(interaction.id);

      for (const other of interactions) {
        if (processed.has(other.id)) continue;
        
        if (this.areQueriesSimilar(interaction.question, other.question)) {
          cluster.push(other);
          processed.add(other.id);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  private areQueriesSimilar(query1: string, query2: string): boolean {
    const words1 = new Set(query1.toLowerCase().split(' '));
    const words2 = new Set(query2.toLowerCase().split(' '));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size > 0.6;
  }

  private extractPatternFromCluster(cluster: AiInteraction[]): AiPattern {
    const words = cluster.map(c => c.question.toLowerCase().split(' '));
    const commonWords = words[0].filter(word => 
      words.every(w => w.includes(word))
    );

    const pattern = new AiPattern();
    pattern.patternType = 'query_pattern';
    pattern.pattern = commonWords.join(' ');
    pattern.category = 'auto_discovered';
    pattern.frequency = cluster.length;
    pattern.successRate = 0;
    pattern.confidenceScore = 0.8;
    pattern.autoGenerated = true;
    pattern.isActive = true;
    return pattern;
  }

  private createTemplateFromInteraction(interaction: AiInteraction): Partial<AiPromptTemplate> | null {
    if (!interaction.feedback || interaction.feedback.length === 0 || interaction.feedback[0].rating < 4) return null;

    return {
      templateName: `Auto-generated ${Date.now()}`,
      category: 'auto_generated',
      templatePattern: interaction.question,
      variables: [],
      description: 'Auto-generated from successful interaction',
      successCount: 1,
      usageCount: 0,
      successRate: 1.0,
      autoGenerated: true,
      isActive: true,
      version: 1,
    };
  }

  private async findUsedTemplates(interaction: AiInteraction): Promise<AiPromptTemplate[]> {
    return [];
  }

  private async updateTemplateSuccessRate(templateId: number): Promise<void> {
    const template = await this.templateRepository.findOne({ where: { id: templateId } });
    if (!template) return;

    const successRate = template.usageCount > 0 
      ? template.successCount / template.usageCount 
      : 0;

    await this.templateRepository.update(templateId, { successRate });
  }

  private async hasTemplate(question: string): Promise<boolean> {
    const templates = await this.templateRepository.find({
      where: { isActive: true },
    });

    return templates.some(t => this.matchesPattern(question, t.templatePattern));
  }

  private async generateTemplateVariations(template: AiPromptTemplate): Promise<AiPromptTemplate[]> {
    return [];
  }

  private async testTemplateVariation(template: AiPromptTemplate): Promise<void> {
    // A/B testing placeholder
  }

  private async adjustConfidenceScores(feedback: AiFeedback): Promise<void> {
    // Placeholder for confidence score adjustment
  }

  private async generateImprovementSuggestions(feedback: AiFeedback): Promise<void> {
    // Placeholder for improvement suggestion generation
  }
}
