import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('licenses')
export class License {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'plan', type: 'varchar', length: 100 })
  plan: string;

  @Column({ name: 'amount', type: 'int' })
  amount: number;

  @Column({ name: 'currency', type: 'varchar', length: 10, default: 'INR' })
  currency: string;

  @Column({ name: 'valid_from', type: 'date' })
  validFrom: Date;

  @Column({ name: 'valid_to', type: 'date' })
  validTo: Date;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'active' })
  status: string;

  @Column({ name: 'razorpay_order_id', type: 'varchar', length: 255, nullable: true })
  razorpayOrderId: string | null;

  @Column({ name: 'razorpay_payment_id', type: 'varchar', length: 255, nullable: true })
  razorpayPaymentId: string | null;

  @Column({ name: 'razorpay_signature', type: 'varchar', length: 255, nullable: true })
  razorpaySignature: string | null;

  @Column({ name: 'payment_gateway', type: 'varchar', length: 50, nullable: true })
  paymentGateway: string | null;

  @Column({ name: 'payu_txnid', type: 'varchar', length: 255, nullable: true })
  payuTxnid: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
