import { Repository, DataSource } from 'typeorm';
import { AiFeedback } from '../entities/ai-feedback.entity';
import { AiInteraction } from '../entities/ai-interaction.entity';
import { AiPattern } from '../entities/ai-pattern.entity';

interface FeedbackInsight {
  type: string;
  frequency: number;
  averageRating: number;
  commonIssues: string[];
  suggestions: string[];
}

export class FeedbackAnalyzer {
  

  private feedbackRepository: Repository<AiFeedback>;
  private patternRepository: Repository<AiPattern>;

  constructor(dataSource: DataSource) {
    this.feedbackRepository = dataSource.getRepository(AiFeedback);
    this.patternRepository = dataSource.getRepository(AiPattern);
  }

  async analyze(feedback: AiFeedback): Promise<void> {
    // 1. Categorize feedback
    const category = this.categorizeFeedback(feedback);
    
    // 2. Extract key insights
    const insights = await this.extractInsights(feedback);
    
    // 3. Update related patterns
    await this.updateRelatedPatterns(feedback, insights);
    
    // 4. Generate improvement suggestions
    const suggestions = await this.generateSuggestions(feedback, insights);
    
    // Store insights for future learning
    await this.storeInsights(feedback.id, category, insights, suggestions);
  }

  async getFeedbackSummary(timeframe: number = 30): Promise<any> {
    const date = new Date();
    date.setDate(date.getDate() - timeframe);

    const feedbacks = await this.feedbackRepository
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.interaction', 'i')
      .where('f."createdAt" >= :date', { date })
      .getMany();

    const summary = {
      total: feedbacks.length,
      averageRating: 0,
      thumbsUp: 0,
      thumbsDown: 0,
      commonIssues: [] as string[],
      improvementAreas: [] as string[],
      satisfactionTrend: [] as any[],
    };

    if (feedbacks.length === 0) return summary;

    // Calculate ratings
    const ratings = feedbacks.filter(f => f.rating).map(f => f.rating);
    summary.averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

    // Count thumbs
    summary.thumbsUp = feedbacks.filter(f => f.feedbackType === 'thumbs_up').length;
    summary.thumbsDown = feedbacks.filter(f => f.feedbackType === 'thumbs_down').length;

    // Extract common issues
    summary.commonIssues = await this.extractCommonIssues(feedbacks);

    // Identify improvement areas
    summary.improvementAreas = await this.identifyImprovementAreas(feedbacks);

    return summary;
  }

  private categorizeFeedback(feedback: AiFeedback): string {
    const comment = (feedback.feedbackComment || '').toLowerCase();
    
    if (feedback.rating <= 2) {
      return 'negative';
    } else if (feedback.rating >= 4) {
      return 'positive';
    } else {
      return 'neutral';
    }
  }

  private async extractInsights(feedback: AiFeedback): Promise<any> {
    const insights = {
      accuracy: feedback.accuracyRating || 0,
      usefulness: feedback.usefulnessRating || 0,
      clarity: feedback.clarityRating || 0,
      issues: [] as string[],
      strengths: [] as string[],
    };

    // Analyze feedback comment for issues and strengths
    if (feedback.feedbackComment) {
      const issueKeywords = ['wrong', 'incorrect', 'inaccurate', 'confusing', 'unclear', 'useless', 'irrelevant'];
      const strengthKeywords = ['accurate', 'helpful', 'clear', 'useful', 'relevant', 'perfect', 'excellent'];

      const comment = feedback.feedbackComment.toLowerCase();
      
      insights.issues = issueKeywords.filter(keyword => comment.includes(keyword));
      insights.strengths = strengthKeywords.filter(keyword => comment.includes(keyword));
    }

    return insights;
  }

  private async updateRelatedPatterns(
    feedback: AiFeedback, 
    insights: any
  ): Promise<void> {
    // Get the interaction to find related patterns
    const interaction = await this.feedbackRepository.manager.findOne(AiInteraction, {
      where: { id: feedback.interactionId },
    });

    if (!interaction) return;

    // Find patterns that match this interaction
    const patterns = await this.patternRepository.find({
      where: {
        category: 'query_pattern',
        isActive: true,
      },
    });

    const matchingPatterns = patterns.filter(p => 
      interaction.question.toLowerCase().includes(p.pattern.toLowerCase()) ||
      p.pattern.toLowerCase().includes(interaction.question.toLowerCase())
    );

    // Update pattern success rates based on feedback
    for (const pattern of matchingPatterns) {
      const currentSuccessRate = pattern.successRate || 0;
      const feedbackScore = feedback.rating || (feedback.feedbackType === 'thumbs_up' ? 5 : 1);
      
      // Weighted average update
      const newSuccessRate = (currentSuccessRate * 0.8) + (feedbackScore / 5 * 0.2);
      
      await this.patternRepository.update(pattern.id, {
        successRate: newSuccessRate,
        lastSuccess: feedback.rating >= 4 ? new Date() : pattern.lastSuccess,
      });
    }
  }

  private async generateSuggestions(feedback: AiFeedback, insights: any): Promise<string[]> {
    const suggestions: string[] = [];

    // Based on accuracy issues
    if (insights.accuracy <= 2) {
      suggestions.push('Improve data accuracy in responses');
      suggestions.push('Add data validation checks');
    }

    // Based on usefulness issues
    if (insights.usefulness <= 2) {
      suggestions.push('Provide more relevant and actionable insights');
      suggestions.push('Include recommendations in responses');
    }

    // Based on clarity issues
    if (insights.clarity <= 2) {
      suggestions.push('Use simpler language in responses');
      suggestions.push('Structure responses with bullet points');
    }

    // Based on specific feedback
    if (feedback.whatCouldBeBetter) {
      suggestions.push(`Address: ${feedback.whatCouldBeBetter}`);
    }

    return suggestions;
  }

  private async storeInsights(
    feedbackId: number,
    category: string,
    insights: any,
    suggestions: string[]
  ): Promise<void> {
    // Store insights in a separate table or as JSON
    // For now, we'll log them
    console.log(`Feedback ${feedbackId} insights:`, {
      category,
      insights,
      suggestions,
    });
  }

  private async extractCommonIssues(feedbacks: AiFeedback[]): Promise<string[]> {
    const issues = new Map<string, number>();

    for (const feedback of feedbacks) {
      if (feedback.whatCouldBeBetter) {
        const words = feedback.whatCouldBeBetter.toLowerCase().split(' ');
        for (const word of words) {
          if (word.length > 4) { // Only consider meaningful words
            issues.set(word, (issues.get(word) || 0) + 1);
          }
        }
      }
    }

    // Return top 5 most common issues
    return Array.from(issues.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue]) => issue);
  }

  private async identifyImprovementAreas(feedbacks: AiFeedback[]): Promise<string[]> {
    const areas = {
      accuracy: 0,
      usefulness: 0,
      clarity: 0,
      speed: 0,
    };

    let total = 0;

    for (const feedback of feedbacks) {
      if (feedback.accuracyRating !== undefined) {
        areas.accuracy += feedback.accuracyRating;
      }
      if (feedback.usefulnessRating !== undefined) {
        areas.usefulness += feedback.usefulnessRating;
      }
      if (feedback.clarityRating !== undefined) {
        areas.clarity += feedback.clarityRating;
      }
      total++;
    }

    // Calculate averages and identify areas below threshold
    const threshold = 3.5;
    const improvementAreas: string[] = [];

    if (total > 0) {
      if (areas.accuracy / total < threshold) {
        improvementAreas.push('Data Accuracy');
      }
      if (areas.usefulness / total < threshold) {
        improvementAreas.push('Response Relevance');
      }
      if (areas.clarity / total < threshold) {
        improvementAreas.push('Response Clarity');
      }
    }

    return improvementAreas;
  }
}
