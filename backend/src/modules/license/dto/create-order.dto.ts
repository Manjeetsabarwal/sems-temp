
export class CreateOrderDto {
  plan: string;

  amount: number;

  currency?: string;

  gateway?: 'razorpay' | 'payu';

  firstname?: string;

  email?: string;

  phone?: string;
}
