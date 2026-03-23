import { BadRequestException } from '../../common/app-error';

import { Repository, DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { License } from './license.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

export class LicenseService {
  private readonly razorpayKeyId: string;
  private readonly razorpayKeySecret: string;
  private readonly payuKey: string;
  private readonly payuSalt: string;
  private readonly payuMode: string;
  private readonly appUrl: string;
  private readonly frontendUrl: string;

  private readonly licenseRepository: Repository<License>;

  constructor(dataSource: DataSource) {
    this.licenseRepository = dataSource.getRepository(License);
    this.razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
    this.razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
    this.payuKey = process.env.PAYU_KEY || '';
    this.payuSalt = process.env.PAYU_SALT || '';
    this.payuMode = process.env.PAYU_MODE || 'test';
    this.appUrl = process.env.APP_URL || 'http://localhost:3000';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  isRazorpayConfigured(): boolean {
    return Boolean(this.razorpayKeyId && this.razorpayKeySecret);
  }

  isPayUConfigured(): boolean {
    return Boolean(this.payuKey && this.payuSalt);
  }

  getPayUActionUrl(): string {
    return this.payuMode === 'live'
      ? 'https://secure.payu.in/_payment'
      : 'https://test.payu.in/_payment';
  }

  async createOrder(
    dto: CreateOrderDto,
  ): Promise<
    | { gateway: 'razorpay'; orderId: string; amount: number; currency: string; keyId: string }
    | { gateway: 'payu'; action: string; key: string; txnid: string; amount: string; productinfo: string; firstname: string; email: string; phone: string; surl: string; furl: string; hash: string }
  > {
    const gateway = dto.gateway || 'razorpay';
    if (gateway === 'payu') {
      return this.createPayUOrder(dto);
    }
    return this.createRazorpayOrder(dto);
  }

  private async createRazorpayOrder(dto: CreateOrderDto): Promise<{
    gateway: 'razorpay';
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  }> {
    if (!this.isRazorpayConfigured()) {
      throw new BadRequestException('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    }
    const Razorpay = require('razorpay');
    const instance = new Razorpay({
      key_id: this.razorpayKeyId,
      key_secret: this.razorpayKeySecret,
    });
    const currency = dto.currency || 'INR';
    const amountInSubunits = Math.round(dto.amount * 100);
    const order = await instance.orders.create({
      amount: amountInSubunits,
      currency,
      receipt: `license_${dto.plan}_${Date.now()}`,
      notes: { plan: dto.plan },
    });
    return {
      gateway: 'razorpay',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: this.razorpayKeyId,
    };
  }

  private createPayUOrder(dto: CreateOrderDto): {
    gateway: 'payu';
    action: string;
    key: string;
    txnid: string;
    amount: string;
    productinfo: string;
    firstname: string;
    email: string;
    phone: string;
    surl: string;
    furl: string;
    hash: string;
  } {
    if (!this.isPayUConfigured()) {
      throw new BadRequestException('PayU is not configured. Set PAYU_KEY and PAYU_SALT.');
    }
    const txnid = `LIC${Date.now()}`;
    const amount = String(Number(dto.amount).toFixed(2));
    const productinfo = dto.plan || 'School License';
    const firstname = dto.firstname || 'Customer';
    const email = dto.email || 'customer@school.edu';
    const phone = dto.phone || '9999999999';
    const surl = `${this.appUrl}/api/license/payu/callback`;
    const furl = `${this.appUrl}/api/license/payu/callback`;
    const udf1 = '';
    const udf2 = '';
    const udf3 = '';
    const udf4 = '';
    const udf5 = '';
    const hashString = `${this.payuKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${this.payuSalt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();
    return {
      gateway: 'payu',
      action: this.getPayUActionUrl(),
      key: this.payuKey,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      surl,
      furl,
      hash,
    };
  }

  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    const body = `${orderId}|${paymentId}`;
    const expected = crypto
      .createHmac('sha256', this.razorpayKeySecret)
      .update(body)
      .digest('hex');
    return expected === signature;
  }

  verifyPayUResponse(params: Record<string, string>): boolean {
    const hash = params.hash;
    if (!hash) return false;
    // PayU response hash: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const reverseString = `${this.payuSalt}|${params.status}||||||${params.udf5 || ''}|${params.udf4 || ''}|${params.udf3 || ''}|${params.udf2 || ''}|${params.udf1 || ''}|${params.email || ''}|${params.firstname || ''}|${params.productinfo || ''}|${params.amount || ''}|${params.txnid || ''}|${this.payuKey}`;
    const expected = crypto.createHash('sha512').update(reverseString).digest('hex').toLowerCase();
    return expected === hash.toLowerCase();
  }

  async verifyPayment(dto: VerifyPaymentDto): Promise<License> {
    if (!this.isRazorpayConfigured()) {
      throw new BadRequestException('Razorpay is not configured.');
    }
    const valid = this.verifySignature(dto.orderId, dto.paymentId, dto.signature);
    if (!valid) {
      throw new BadRequestException('Invalid payment signature.');
    }
    return this.saveLicense({
      plan: dto.plan || 'School License',
      amount: dto.amount ?? 0,
      currency: dto.currency || 'INR',
      gateway: 'razorpay',
      razorpayOrderId: dto.orderId,
      razorpayPaymentId: dto.paymentId,
      razorpaySignature: dto.signature,
    });
  }

  async handlePayUCallback(params: Record<string, string>): Promise<{ success: boolean; redirectUrl: string }> {
    if (!this.isPayUConfigured()) {
      return { success: false, redirectUrl: `${this.frontendUrl}/#settings?tab=license&payu=error` };
    }
    const valid = this.verifyPayUResponse(params);
    if (!valid) {
      return { success: false, redirectUrl: `${this.frontendUrl}/#settings?tab=license&payu=invalid` };
    }
    const status = (params.status || '').toLowerCase();
    if (status !== 'success') {
      return { success: false, redirectUrl: `${this.frontendUrl}/#settings?tab=license&payu=failed` };
    }
    const plan = params.productinfo || 'School License';
    const amount = parseInt(params.amount || '0', 10);
    await this.saveLicense({
      plan,
      amount,
      currency: 'INR',
      gateway: 'payu',
      payuTxnid: params.txnid,
    });
    return { success: true, redirectUrl: `${this.frontendUrl}/#settings?tab=license&payu=success` };
  }

  private async saveLicense(data: {
    plan: string;
    amount: number;
    currency: string;
    gateway: 'razorpay' | 'payu';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    payuTxnid?: string;
  }): Promise<License> {
    const now = new Date();
    const validFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const validTo = new Date(validFrom);
    validTo.setFullYear(validTo.getFullYear() + 1);

    const license = this.licenseRepository.create({
      plan: data.plan,
      amount: data.amount,
      currency: data.currency,
      validFrom,
      validTo,
      status: 'active',
      paymentGateway: data.gateway,
      razorpayOrderId: data.razorpayOrderId ?? null,
      razorpayPaymentId: data.razorpayPaymentId ?? null,
      razorpaySignature: data.razorpaySignature ?? null,
      payuTxnid: data.payuTxnid ?? null,
    });
    return this.licenseRepository.save(license);
  }

  async getCurrent(): Promise<License | null> {
    const today = new Date().toISOString().slice(0, 10);
    const license = await this.licenseRepository
      .createQueryBuilder('l')
      .where('l.status = :status', { status: 'active' })
      .andWhere('l.valid_to >= :today', { today })
      .orderBy('l.valid_to', 'DESC')
      .getOne();
    return license ?? null;
  }

  async getPlans(): Promise<Array<{ plan: string; amount: number; currency: string; duration: string }>> {
    return [
      { plan: 'School License (1 Year)', amount: 9999, currency: 'INR', duration: '1 year' },
      { plan: 'School License (6 Months)', amount: 5999, currency: 'INR', duration: '6 months' },
    ];
  }
}
