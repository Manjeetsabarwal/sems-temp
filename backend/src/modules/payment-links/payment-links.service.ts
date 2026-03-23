

export interface PaymentLinkResult {
  success: boolean;
  paymentLinkId?: string;
  shortUrl?: string;
  error?: string;
}

export interface PaymentLinkStatus {
  id: string;
  status: string; // created, partially_paid, expired, cancelled, paid
  amountPaid: number;
  amountDue: number;
}

// Use require() for optional razorpay dependency
function tryLoadRazorpay(): any | null {
  try {
    return require('razorpay');
  } catch {
    return null;
  }
}

export class PaymentLinksService {
  private razorpayInstance: any = null;
  private readonly enabled: boolean;
  private readonly keyId: string;
  private readonly keySecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    this.enabled = !!(this.keyId && this.keySecret && this.keyId !== 'your_razorpay_key_id');

    if (this.enabled) {
      const Razorpay = tryLoadRazorpay();
      if (Razorpay) {
        this.razorpayInstance = new Razorpay({
          key_id: this.keyId,
          key_secret: this.keySecret,
        });
        console.log('Razorpay payment links service initialized');
      } else {
        console.warn('razorpay package not installed. Run: npm install razorpay');
        (this as any).enabled = false;
      }
    } else {
      console.warn('Razorpay credentials not configured. Payment links disabled.');
    }
  }

  isEnabled(): boolean {
    return this.enabled && !!this.razorpayInstance;
  }

  /**
   * Create a Razorpay Payment Link
   */
  async createPaymentLink(
    amount: number,
    studentName: string,
    studentId: string,
    description: string,
    customerPhone?: string,
    customerEmail?: string,
    enrollmentId?: number,
  ): Promise<PaymentLinkResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Razorpay not configured or razorpay package not installed' };
    }

    try {
      const linkOptions: any = {
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency: 'INR',
        description: description || `Fee payment for ${studentName}`,
        customer: {
          name: studentName,
        },
        notify: {
          sms: !!customerPhone,
          email: !!customerEmail,
        },
        reminder_enable: true,
        notes: {
          student_id: studentId,
          enrollment_id: enrollmentId ? String(enrollmentId) : '',
          source: 'sems_payment_reminder',
        },
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success`,
        callback_method: 'get',
      };

      if (customerPhone) {
        linkOptions.customer.contact = customerPhone.startsWith('+') ? customerPhone : `+91${customerPhone}`;
      }
      if (customerEmail) {
        linkOptions.customer.email = customerEmail;
      }

      const paymentLink = await this.razorpayInstance.paymentLink.create(linkOptions);

      console.log(`Payment link created: ${paymentLink.id} -> ${paymentLink.short_url}`);

      return {
        success: true,
        paymentLinkId: paymentLink.id,
        shortUrl: paymentLink.short_url,
      };
    } catch (err: any) {
      const errorMsg = err?.error?.description || err.message || 'Failed to create payment link';
      console.error(`Payment link creation failed: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Get status of a payment link
   */
  async getPaymentLinkStatus(paymentLinkId: string): Promise<PaymentLinkStatus | null> {
    if (!this.isEnabled()) return null;

    try {
      const link = await this.razorpayInstance.paymentLink.fetch(paymentLinkId);
      return {
        id: link.id,
        status: link.status,
        amountPaid: (link.amount_paid || 0) / 100,
        amountDue: ((link.amount || 0) - (link.amount_paid || 0)) / 100,
      };
    } catch (err: any) {
      console.error(`Failed to fetch payment link status: ${err.message}`);
      return null;
    }
  }

  /**
   * Cancel a payment link
   */
  async cancelPaymentLink(paymentLinkId: string): Promise<boolean> {
    if (!this.isEnabled()) return false;

    try {
      await this.razorpayInstance.paymentLink.cancel(paymentLinkId);
      console.log(`Payment link cancelled: ${paymentLinkId}`);
      return true;
    } catch (err: any) {
      console.error(`Failed to cancel payment link: ${err.message}`);
      return false;
    }
  }
}
