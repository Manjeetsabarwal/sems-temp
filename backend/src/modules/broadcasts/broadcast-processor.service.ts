import { Repository, DataSource, In } from 'typeorm';
import { Broadcast } from './broadcast.entity';
import { BroadcastMessage } from './broadcast-message.entity';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

export class BroadcastProcessorService {
  private readonly broadcastRepository: Repository<Broadcast>;
  private readonly messageRepository: Repository<BroadcastMessage>;
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 20;
  private readonly POLL_INTERVAL = 10000; // 10 seconds

  constructor(
    private readonly dataSource: DataSource,
    private readonly whatsAppService: WhatsAppService,
  ) {
    this.broadcastRepository = dataSource.getRepository(Broadcast);
    this.messageRepository = dataSource.getRepository(BroadcastMessage);
  }

  /**
   * Start the background processor
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🚀 Broadcast Processor started');
    
    this.interval = setInterval(() => {
      this.processBroadcasts().catch((err) => {
        console.error('❌ Error in Broadcast Processor:', err);
      });
    }, this.POLL_INTERVAL);
  }

  /**
   * Stop the background processor
   */
  stop() {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    console.log('🛑 Broadcast Processor stopped');
  }

  /**
   * Process all pending or processing broadcasts
   */
  private async processBroadcasts() {
    const activeBroadcasts = await this.broadcastRepository.find({
      where: [
        { status: 'pending' },
        { status: 'processing' },
        { status: 'partial' }
      ],
      order: { createdAt: 'ASC' }
    });

    for (const broadcast of activeBroadcasts) {
      await this.processSingleBroadcast(broadcast);
    }
  }

  /**
   * Process a single broadcast by sending a batch of messages
   */
  private async processSingleBroadcast(broadcast: Broadcast) {
    // Mark as processing if pending
    if (broadcast.status === 'pending') {
      broadcast.status = 'processing';
      await this.broadcastRepository.save(broadcast);
    }

    // Get next batch of pending messages
    const messages = await this.messageRepository.find({
      where: {
        broadcastId: broadcast.id,
        status: In(['pending', 'sending'])
      },
      take: this.BATCH_SIZE,
      order: { id: 'ASC' }
    });

    if (messages.length === 0) {
      // Check if all messages are done
      const remainingCount = await this.messageRepository.count({
        where: {
          broadcastId: broadcast.id,
          status: In(['pending', 'sending', 'processing'])
        }
      });

      if (remainingCount === 0) {
        await this.finalizeBroadcast(broadcast);
      }
      return;
    }

    console.log(`📡 Processing ${messages.length} messages for Broadcast [${broadcast.id}] ${broadcast.name}`);

    for (const msg of messages) {
      try {
        // Mark as sending to avoid double processing
        msg.status = 'sending';
        await this.messageRepository.save(msg);

        // Map template params to WhatsApp component format
        const bodyParams = msg.templateParams?.body?.map((text: string) => ({
          type: 'text' as const,
          text
        })) || [];

        const result = await this.whatsAppService.sendTemplateMessage(
          msg.phoneNumber,
          msg.templateName,
          msg.templateLanguage,
          bodyParams
        );

        if (result.success) {
          msg.status = 'sent';
          msg.providerMessageId = result.messageId || null;
          msg.sentAt = new Date();
          msg.errorMessage = null;
        } else {
          msg.retryCount++;
          if (msg.retryCount >= msg.max_retries) {
            msg.status = 'failed';
            msg.failedAt = new Date();
          } else {
            msg.status = 'pending'; // Retry in next interval
          }
          msg.errorMessage = result.error || 'Unknown error';
        }
      } catch (err: any) {
        msg.status = 'failed';
        msg.errorMessage = err.message;
        msg.failedAt = new Date();
        console.error(`❌ Failed to send message ${msg.id}:`, err.message);
      }

      await this.messageRepository.save(msg);
      
      // Small stagger to respect rate limits even within a batch
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  /**
   * Finalize broadcast status once all messages are processed
   */
  private async finalizeBroadcast(broadcast: Broadcast) {
    const stats = await this.messageRepository
      .createQueryBuilder('m')
      .select('m.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('m.broadcastId = :id', { id: broadcast.id })
      .groupBy('m.status')
      .getRawMany();

    const counts = stats.reduce((acc, curr) => {
      acc[curr.status] = parseInt(curr.count);
      return acc;
    }, {} as Record<string, number>);

    const failed = counts['failed'] || 0;
    const sent = (counts['sent'] || 0) + (counts['delivered'] || 0) + (counts['read'] || 0);

    if (failed > 0) {
      broadcast.status = 'completed_with_errors';
    } else {
      broadcast.status = 'completed';
    }

    broadcast.completedAt = new Date();
    await this.broadcastRepository.save(broadcast);
    console.log(`✅ Broadcast [${broadcast.id}] ${broadcast.name} finished. Sent: ${sent}, Failed: ${failed}`);
  }
}
