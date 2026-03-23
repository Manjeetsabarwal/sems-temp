


export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface TemplateParam {
  type: 'text' | 'currency' | 'date_time';
  text?: string;
  currency?: { fallback_value: string; code: string; amount_1000: number };
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string;
  components: any[];
}

export class WhatsAppService {
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly businessAccountId: string;
  private readonly apiVersion = 'v22.0';
  private readonly baseUrl: string;
  private readonly enabled: boolean;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '';
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || process.env.META_BUSINESS_ACCOUNT_ID || '';

    this.enabled = !!(this.phoneNumberId && this.accessToken);
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

    if (this.enabled) {
      console.log(`WhatsApp API enabled (Phone Number ID: ${this.phoneNumberId})`);
    } else {
      console.warn(
        'WhatsApp API credentials not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env',
      );
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Send a template message via WhatsApp Cloud API
   */
  async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    language: string = 'en',
    bodyParams?: TemplateParam[],
    headerParams?: TemplateParam[],
  ): Promise<WhatsAppSendResult> {
    if (!this.enabled) {
      return { success: false, error: 'WhatsApp API not configured' };
    }

    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      return { success: false, error: `Invalid phone number: ${phoneNumber}` };
    }

    // Build template components
    const components: any[] = [];

    if (headerParams && headerParams.length > 0) {
      components.push({
        type: 'header',
        parameters: headerParams.map((p) => ({
          type: p.type,
          ...(p.type === 'text' ? { text: p.text } : {}),
          ...(p.type === 'currency' ? { currency: p.currency } : {}),
        })),
      });
    }

    if (bodyParams && bodyParams.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyParams.map((p) => ({
          type: 'text',
          text: p.text || '',
        })),
      });
    }

    const payload: any = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
      },
    };

    if (components.length > 0) {
      payload.template.components = components;
    }

    return this.sendRequest(payload);
  }

  /**
   * Get all approved message templates for the business account
   */
  async getTemplates(): Promise<WhatsAppTemplate[]> {
    if (!this.enabled || !this.businessAccountId) return [];

    try {
      const url = `${this.baseUrl}/${this.businessAccountId}/message_templates?limit=100`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(`Failed to fetch WhatsApp templates: ${JSON.stringify(error)}`);
        return [];
      }

      const data = await response.json();
      return data.data.map((t: any) => ({
        id: t.id,
        name: t.name,
        language: t.language,
        status: t.status,
        category: t.category,
        components: t.components,
      }));
    } catch (err) {
      console.error(`Error fetching WhatsApp templates: ${err}`);
      return [];
    }
  }

  /**
   * Validate if a template exists and is approved
   */
  async validateTemplate(templateName: string): Promise<boolean> {
    const templates = await this.getTemplates();
    return templates.some((t) => t.name === templateName && t.status === 'APPROVED');
  }

  /**
   * Send a plain text message
   */
  async sendTextMessage(phoneNumber: string, text: string): Promise<WhatsAppSendResult> {
    if (!this.enabled) {
      return { success: false, error: 'WhatsApp API not configured' };
    }

    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      return { success: false, error: `Invalid phone number: ${phoneNumber}` };
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: { body: text },
    };

    return this.sendRequest(payload);
  }

  /**
   * Core HTTP request to Meta WhatsApp Cloud API
   */
  private async sendRequest(payload: any): Promise<WhatsAppSendResult> {
    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `HTTP ${response.status}`;
        console.error(`WhatsApp API error: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }

      const messageId = data?.messages?.[0]?.id;
      return { success: true, messageId };
    } catch (err: any) {
      console.error(`WhatsApp request failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * Format phone number to E.164
   */
  private formatPhoneNumber(phone: string): string | null {
    if (!phone) return null;
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
    if (cleaned.startsWith('0')) cleaned = '91' + cleaned.substring(1);
    if (cleaned.length === 10 && /^\d+$/.test(cleaned)) cleaned = '91' + cleaned;
    if (!/^\d{10,15}$/.test(cleaned)) return null;
    return cleaned;
  }
}
