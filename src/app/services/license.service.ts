import { API_ENDPOINTS, apiCall } from '../config/api.config';

export interface LicenseConfig {
  razorpayConfigured: boolean;
  payuConfigured: boolean;
}

export interface License {
  id: number;
  plan: string;
  amount: number;
  currency: string;
  validFrom: string;
  validTo: string;
  status: string;
  createdAt: string;
}

export interface LicensePlan {
  plan: string;
  amount: number;
  currency: string;
  duration: string;
}

export interface CreateOrderRazorpayResponse {
  gateway: 'razorpay';
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface CreateOrderPayUResponse {
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
}

export type CreateOrderResponse = CreateOrderRazorpayResponse | CreateOrderPayUResponse;

class LicenseService {
  async getConfig(): Promise<LicenseConfig> {
    return apiCall<LicenseConfig>(API_ENDPOINTS.licenseConfig);
  }

  async getCurrent(): Promise<License | null> {
    return apiCall<License | null>(API_ENDPOINTS.licenseCurrent);
  }

  async getPlans(): Promise<LicensePlan[]> {
    return apiCall<LicensePlan[]>(API_ENDPOINTS.licensePlans);
  }

  async createOrder(
    plan: string,
    amount: number,
    options?: { currency?: string; gateway?: 'razorpay' | 'payu'; firstname?: string; email?: string; phone?: string },
  ): Promise<CreateOrderResponse> {
    return apiCall<CreateOrderResponse>(API_ENDPOINTS.licenseOrder, {
      method: 'POST',
      body: JSON.stringify({
        plan,
        amount,
        currency: options?.currency ?? 'INR',
        gateway: options?.gateway,
        firstname: options?.firstname,
        email: options?.email,
        phone: options?.phone,
      }),
    });
  }

  async verifyPayment(orderId: string, paymentId: string, signature: string, plan?: string, amount?: number, currency?: string): Promise<License> {
    return apiCall<License>(API_ENDPOINTS.licenseVerify, {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        paymentId,
        signature,
        plan,
        amount,
        currency,
      }),
    });
  }
}

export const licenseService = new LicenseService();
