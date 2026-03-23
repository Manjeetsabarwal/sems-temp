import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';

export interface PaymentReminder {
  id: number;
  enrollmentId: number;
  studentId: string;
  studentName: string;
  phoneNumber: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentLinkId: string | null;
  paymentLinkUrl: string | null;
  reminderType: string;
  channel: string;
  status: string;
  whatsappMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface ReminderStats {
  totalSent: number;
  totalPaid: number;
  totalPending: number;
  totalFailed: number;
  totalAmountDue: number;
  totalAmountCollected: number;
}

export class PaymentRemindersService {
  async getAll(filters?: {
    enrollmentId?: number;
    studentId?: string;
    status?: string;
    reminderType?: string;
  }): Promise<PaymentReminder[]> {
    const qs = buildQueryString(filters || {});
    return apiCall<PaymentReminder[]>(`${API_ENDPOINTS.paymentReminders}${qs}`);
  }

  async getStats(): Promise<ReminderStats> {
    return apiCall<ReminderStats>(API_ENDPOINTS.paymentReminderStats);
  }

  async sendReminder(
    enrollmentId: number,
    reminderType: string = 'first_reminder',
    channel: string = 'whatsapp',
  ): Promise<PaymentReminder> {
    return apiCall<PaymentReminder>(API_ENDPOINTS.paymentReminderSend, {
      method: 'POST',
      body: JSON.stringify({ enrollmentId, reminderType, channel }),
    });
  }

  async sendBulkReminders(
    filters?: { paymentStatus?: string; batchId?: number; courseId?: number },
    reminderType: string = 'first_reminder',
  ): Promise<{ sent: number; failed: number; skipped: number }> {
    return apiCall(API_ENDPOINTS.paymentReminderSendBulk, {
      method: 'POST',
      body: JSON.stringify({ filters, reminderType }),
    });
  }

  async checkPaymentStatus(reminderId: number): Promise<PaymentReminder> {
    return apiCall<PaymentReminder>(API_ENDPOINTS.paymentReminderCheckPayment(reminderId), {
      method: 'POST',
    });
  }
}

export const paymentRemindersService = new PaymentRemindersService();
