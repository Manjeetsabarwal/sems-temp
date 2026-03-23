import { NotFoundException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { PaymentReminder } from './payment-reminder.entity';
import { StudentEnrollment } from '../enrollments/student-enrollment.entity';
import { Student } from '../students/student.entity';
import { PaidStudentFee } from '../paid-student-fees/paid-student-fee.entity';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { PaymentLinksService } from '../payment-links/payment-links.service';

export class PaymentRemindersService {
  private readonly reminderRepository: Repository<PaymentReminder>;
  private readonly enrollmentRepository: Repository<StudentEnrollment>;
  private readonly studentRepository: Repository<Student>;
  private readonly feeRepository: Repository<PaidStudentFee>;

  constructor(
    dataSource: DataSource,
    private readonly whatsAppService: WhatsAppService,
    private readonly paymentLinksService: PaymentLinksService,
  ) {
    this.reminderRepository = dataSource.getRepository(PaymentReminder);
    this.enrollmentRepository = dataSource.getRepository(StudentEnrollment);
    this.studentRepository = dataSource.getRepository(Student);
    this.feeRepository = dataSource.getRepository(PaidStudentFee);
  }

  async findAll(filters?: {
    enrollmentId?: number;
    studentId?: string;
    status?: string;
    reminderType?: string;
  }): Promise<PaymentReminder[]> {
    const qb = this.reminderRepository.createQueryBuilder('r');
    if (filters?.enrollmentId) qb.andWhere('r.enrollmentId = :enrollmentId', { enrollmentId: filters.enrollmentId });
    if (filters?.studentId) qb.andWhere('r.studentId = :studentId', { studentId: filters.studentId });
    if (filters?.status) qb.andWhere('r.status = :status', { status: filters.status });
    if (filters?.reminderType) qb.andWhere('r.reminderType = :reminderType', { reminderType: filters.reminderType });
    return qb.orderBy('r.createdAt', 'DESC').getMany();
  }

  async findOne(id: number): Promise<PaymentReminder> {
    const reminder = await this.reminderRepository.findOne({ where: { id } });
    if (!reminder) throw new NotFoundException(`Payment reminder ${id} not found`);
    return reminder;
  }

  /**
   * Send a payment reminder for a specific enrollment
   */
  async sendReminder(
    enrollmentId: number,
    reminderType: string = 'first_reminder',
    channel: string = 'whatsapp',
  ): Promise<PaymentReminder> {
    // Load enrollment with payments
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId },
      relations: ['payments'],
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    // Load student
    const student = await this.studentRepository.findOne({
      where: { studentId: enrollment.studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const phoneNumber = student.parentPhone || student.phone;
    if (!phoneNumber) {
      throw new Error(`No phone number found for student ${student.name} (${student.studentId})`);
    }

    // Calculate amounts
    const totalAmount = Number(enrollment.totalAmount) || 0;
    const paidAmount = (enrollment.payments || []).reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const dueAmount = totalAmount - paidAmount;

    if (dueAmount <= 0) {
      throw new Error('No outstanding balance for this enrollment');
    }

    // Create Razorpay payment link
    let paymentLinkId: string | null = null;
    let paymentLinkUrl: string | null = null;

    if (this.paymentLinksService.isEnabled()) {
      const linkResult = await this.paymentLinksService.createPaymentLink(
        dueAmount,
        student.name,
        student.studentId,
        `Fee payment - Due: ₹${dueAmount.toFixed(2)}`,
        phoneNumber,
        student.parentEmail || student.email,
        enrollmentId,
      );

      if (linkResult.success) {
        paymentLinkId = linkResult.paymentLinkId || null;
        paymentLinkUrl = linkResult.shortUrl || null;
      } else {
        console.warn(`Payment link creation failed: ${linkResult.error}. Sending reminder without link.`);
      }
    }

    // Create reminder record
    const reminder = new PaymentReminder();
    reminder.enrollmentId = enrollmentId;
    reminder.studentId = student.studentId;
    reminder.studentName = student.name;
    reminder.phoneNumber = phoneNumber;
    reminder.totalAmount = totalAmount;
    reminder.paidAmount = paidAmount;
    reminder.dueAmount = dueAmount;
    reminder.paymentLinkId = paymentLinkId;
    reminder.paymentLinkUrl = paymentLinkUrl;
    reminder.reminderType = reminderType;
    reminder.channel = channel;
    reminder.status = 'pending';

    const saved = await this.reminderRepository.save(reminder);

    // Send WhatsApp message
    if (channel === 'whatsapp' || channel === 'both') {
      await this.sendWhatsAppReminder(saved);
    }

    return this.findOne(saved.id);
  }

  /**
   * Send WhatsApp reminder message
   */
  private async sendWhatsAppReminder(reminder: PaymentReminder): Promise<void> {
    if (!this.whatsAppService.isEnabled()) {
      reminder.status = 'failed';
      reminder.errorMessage = 'WhatsApp API not configured';
      await this.reminderRepository.save(reminder);
      return;
    }

    // Build template params for fee_reminder template
    const bodyParams = [
      { type: 'text' as const, text: reminder.studentName },
      { type: 'text' as const, text: `₹${Number(reminder.dueAmount).toFixed(2)}` },
    ];

    // Add payment link as param if available
    if (reminder.paymentLinkUrl) {
      bodyParams.push({ type: 'text' as const, text: reminder.paymentLinkUrl });
    }

    const result = await this.whatsAppService.sendTemplateMessage(
      reminder.phoneNumber,
      'fee_reminder',
      'en',
      bodyParams,
    );

    if (result.success) {
      reminder.status = 'sent';
      reminder.whatsappMessageId = result.messageId || null;
      reminder.sentAt = new Date();
      console.log(`Payment reminder sent to ${reminder.phoneNumber} for ${reminder.studentName}`);
    } else {
      reminder.status = 'failed';
      reminder.errorMessage = result.error || 'WhatsApp send failed';
      console.error(`Failed to send reminder to ${reminder.phoneNumber}: ${result.error}`);
    }

    await this.reminderRepository.save(reminder);
  }

  /**
   * Send bulk reminders to all students with pending/partial payments
   */
  async sendBulkReminders(
    filters?: { paymentStatus?: string; batchId?: number; courseId?: number },
    reminderType: string = 'first_reminder',
  ): Promise<{ sent: number; failed: number; skipped: number }> {
    const qb = this.enrollmentRepository.createQueryBuilder('e');
    qb.leftJoinAndSelect('e.payments', 'payments');

    if (filters?.paymentStatus) {
      qb.andWhere('e.paymentStatus = :ps', { ps: filters.paymentStatus });
    } else {
      qb.andWhere('e.paymentStatus IN (:...statuses)', { statuses: ['Pending', 'Partial'] });
    }
    if (filters?.batchId) qb.andWhere('e.batchId = :batchId', { batchId: filters.batchId });
    if (filters?.courseId) qb.andWhere('e.courseId = :courseId', { courseId: filters.courseId });

    const enrollments = await qb.getMany();

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const enrollment of enrollments) {
      try {
        await this.sendReminder(enrollment.id, reminderType);
        sent++;
      } catch (err: any) {
        if (err.message?.includes('No phone number') || err.message?.includes('No outstanding')) {
          skipped++;
        } else {
          failed++;
        }
        console.warn(`Skipped enrollment ${enrollment.id}: ${err.message}`);
      }

      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log(`Bulk reminders: ${sent} sent, ${failed} failed, ${skipped} skipped`);
    return { sent, failed, skipped };
  }

  /**
   * Check and update payment status for a reminder
   */
  async checkPaymentStatus(reminderId: number): Promise<PaymentReminder> {
    const reminder = await this.findOne(reminderId);

    if (reminder.paymentLinkId && this.paymentLinksService.isEnabled()) {
      const status = await this.paymentLinksService.getPaymentLinkStatus(reminder.paymentLinkId);
      if (status && status.status === 'paid') {
        reminder.status = 'paid';
        reminder.paidAt = new Date();
        await this.reminderRepository.save(reminder);
      }
    }

    return reminder;
  }

  /**
   * Get summary statistics
   */
  async getStats(): Promise<{
    totalSent: number;
    totalPaid: number;
    totalPending: number;
    totalFailed: number;
    totalAmountDue: number;
    totalAmountCollected: number;
  }> {
    const reminders = await this.reminderRepository.find();
    const totalSent = reminders.filter((r) => ['sent', 'delivered', 'paid'].includes(r.status)).length;
    const totalPaid = reminders.filter((r) => r.status === 'paid').length;
    const totalPending = reminders.filter((r) => r.status === 'pending').length;
    const totalFailed = reminders.filter((r) => r.status === 'failed').length;
    const totalAmountDue = reminders.reduce((sum, r) => sum + Number(r.dueAmount), 0);
    const totalAmountCollected = reminders
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + Number(r.dueAmount), 0);

    return { totalSent, totalPaid, totalPending, totalFailed, totalAmountDue, totalAmountCollected };
  }
}
