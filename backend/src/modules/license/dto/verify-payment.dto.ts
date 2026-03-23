
export class VerifyPaymentDto {
  orderId: string;

  paymentId: string;

  signature: string;

  plan?: string;

  amount?: number;

  currency?: string;
}
