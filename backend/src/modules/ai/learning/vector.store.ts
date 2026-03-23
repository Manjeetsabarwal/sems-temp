import { Repository, DataSource } from 'typeorm';
import { AiQueryVector } from '../entities/ai-query-vector.entity';
import { AiInteraction } from '../entities/ai-interaction.entity';

export class VectorStore {
  

  private vectorRepository: Repository<AiQueryVector>;
  private interactionRepository: Repository<AiInteraction>;

  constructor(dataSource: DataSource) {
    this.vectorRepository = dataSource.getRepository(AiQueryVector);
    this.interactionRepository = dataSource.getRepository(AiInteraction);
  }

  async storeVector(
    interactionId: number,
    vector: number[],
    metadata: {
      category?: string;
      intent?: string;
      confidence?: number;
    }
  ): Promise<void> {
    await this.vectorRepository.save({
      interactionId,
      queryVector: vector,
      category: metadata.category,
      intent: metadata.intent,
      similarityScore: metadata.confidence,
    });
  }

  async findSimilarQueries(
    queryVector: number[],
    limit: number = 5,
    threshold: number = 0.7
  ): Promise<Array<{
    interaction: AiInteraction;
    similarity: number;
    category: string;
    intent: string;
  }>> {
    // Use PostgreSQL's pgvector extension for similarity search
    const results = await this.vectorRepository
      .createQueryBuilder('vector')
      .leftJoinAndSelect('vector.interaction', 'interaction')
      .select([
        'vector.similarityScore',
        'interaction.id',
        'interaction.question',
        'interaction.response',
        'interaction.createdAt',
      ])
      .where('vector.queryVector <=> :queryVector < :threshold', {
        queryVector,
        threshold: 1 - threshold, // pgvector uses distance, so we convert
      })
      .orderBy('vector.queryVector <=> :queryVector', 'ASC')
      .limit(limit)
      .getRawMany();

    return results.map(result => ({
      interaction: {
        id: result.interaction_id,
        question: result.interaction_question,
        response: result.interaction_response,
        createdAt: result.interaction_createdAt,
      } as AiInteraction,
      similarity: 1 - result.vector_similarityScore, // Convert back to similarity
      category: result.vector_category,
      intent: result.vector_intent,
    }));
  }

  async findSimilarByCategory(
    queryVector: number[],
    category: string,
    limit: number = 5
  ): Promise<AiInteraction[]> {
    const results = await this.vectorRepository
      .createQueryBuilder('vector')
      .leftJoinAndSelect('vector.interaction', 'interaction')
      .where('vector.category = :category', { category })
      .andWhere('vector.queryVector <=> :queryVector < 0.5', { queryVector })
      .orderBy('vector.queryVector <=> :queryVector', 'ASC')
      .limit(limit)
      .getMany();

    return results.map(r => r.interaction).filter(Boolean);
  }

  async getCategoryVectors(category: string): Promise<number[][]> {
    const vectors = await this.vectorRepository.find({
      where: { category },
      select: ['queryVector'],
    });

    return vectors.map(v => v.queryVector);
  }

  async clusterQueries(
    category?: string,
    minClusterSize: number = 3
  ): Promise<Array<{
    clusterId: string;
    queries: AiInteraction[];
    centroid: number[];
  }>> {
    // This is a simplified clustering implementation
    // In production, you'd use a proper clustering algorithm like K-means

    const whereClause = category ? { category } : {};
    const vectors = await this.vectorRepository.find({
      where: whereClause,
      relations: ['interaction'],
    });

    if (vectors.length < minClusterSize) {
      return [];
    }

    // Simple clustering based on similarity threshold
    const clusters = new Map<string, any[]>();
    const processed = new Set<number>();

    for (const vector of vectors) {
      if (processed.has(vector.id)) continue;

      const cluster = [vector];
      processed.add(vector.id);

      // Find similar vectors
      for (const other of vectors) {
        if (processed.has(other.id)) continue;

        const similarity = this.cosineSimilarity(vector.queryVector, other.queryVector);
        if (similarity > 0.8) {
          cluster.push(other);
          processed.add(other.id);
        }
      }

      if (cluster.length >= minClusterSize) {
        const clusterId = `cluster_${clusters.size + 1}`;
        clusters.set(clusterId, cluster);
      }
    }

    // Calculate centroids
    const result: Array<{ clusterId: string; queries: AiInteraction[]; centroid: number[] }> = [];
    for (const [clusterId, clusterVectors] of clusters) {
      const centroid = this.calculateCentroid(clusterVectors.map(v => v.queryVector));
      result.push({
        clusterId,
        queries: clusterVectors.map(v => v.interaction).filter(Boolean) as AiInteraction[],
        centroid,
      });
    }

    return result;
  }

  async updateVector(
    interactionId: number,
    newVector: number[]
  ): Promise<void> {
    await this.vectorRepository.update(
      { interactionId },
      { queryVector: newVector }
    );
  }

  async deleteVector(interactionId: number): Promise<void> {
    await this.vectorRepository.delete({ interactionId });
  }

  async getVectorStats(): Promise<{
    totalVectors: number;
    categories: Record<string, number>;
    averageSimilarity: number;
  }> {
    const totalVectors = await this.vectorRepository.count();
    
    const categoryStats = await this.vectorRepository
      .createQueryBuilder('vector')
      .select('vector.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('vector.category')
      .getRawMany();

    const categories = categoryStats.reduce((acc, stat) => {
      acc[stat.category || 'unknown'] = parseInt(stat.count);
      return acc;
    }, {});

    // Calculate average similarity (simplified)
    const averageSimilarity = 0.75; // Placeholder - would need actual calculation

    return {
      totalVectors,
      categories,
      averageSimilarity,
    };
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
  }

  private calculateCentroid(vectors: number[][]): number[] {
    if (vectors.length === 0) return [];

    const dimension = vectors[0].length;
    const centroid = new Array(dimension).fill(0);

    for (const vector of vectors) {
      for (let i = 0; i < dimension; i++) {
        centroid[i] += vector[i];
      }
    }

    for (let i = 0; i < dimension; i++) {
      centroid[i] /= vectors.length;
    }

    return centroid;
  }

  // Method to find outliers - queries that don't match any pattern
  async findOutliers(threshold: number = 0.5): Promise<AiInteraction[]> {
    const vectors = await this.vectorRepository.find({
      relations: ['interaction'],
    });

    const outliers: AiInteraction[] = [];

    for (const vector of vectors) {
      const similar = await this.findSimilarQueries(
        vector.queryVector,
        5, // Look for 5 similar queries
        threshold
      );

      // If no similar queries found, it's an outlier
      if (similar.length === 0) {
        outliers.push(vector.interaction);
      }
    }

    return outliers;
  }

  // Method to get recommendations based on vector similarity
  async getRecommendations(
    queryVector: number[],
    userRole: string,
    limit: number = 5
  ): Promise<Array<{
    query: string;
    response: string;
    similarity: number;
    category: string;
  }>> {
    const similar = await this.findSimilarQueries(queryVector, limit);

    // Filter by user role if needed
    const filtered = similar.filter(s => {
      // Add role-based filtering logic here
      return true; // For now, return all
    });

    return filtered.map(s => ({
      query: s.interaction.question,
      response: s.interaction.response,
      similarity: s.similarity,
      category: s.category,
    }));
  }
}
