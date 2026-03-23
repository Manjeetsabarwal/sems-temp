import axios from 'axios';
import { IWhatsAppProvider, SendTemplateParams, SendResult, WhatsAppTemplate } from './whatsapp-provider.interface';
import { config } from '../../config/env';

export class MetaCloudProvider implements IWhatsAppProvider {
    private readonly apiUrl = 'https://graph.facebook.com/v22.0';
    private readonly phoneNumberId: string;
    private readonly accessToken: string;

    constructor() {
        this.phoneNumberId = process.env.META_PHONE_NUMBER_ID || '';
        this.accessToken = process.env.META_ACCESS_TOKEN || '';

        if (!this.phoneNumberId || !this.accessToken) {
            console.warn('[MetaCloudProvider] Missing META_PHONE_NUMBER_ID or META_ACCESS_TOKEN in environment');
        }
    }

    async sendTemplateMessage(params: SendTemplateParams): Promise<SendResult> {
        const payload = {
            messaging_product: 'whatsapp',
            to: params.to,
            type: 'template',
            template: {
                name: params.templateName,
                language: { code: params.language },
                components: this.buildComponents(params.params)
            }
        };

        try {
            const response = await axios.post(
                `${this.apiUrl}/${this.phoneNumberId}/messages`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            return {
                success: true,
                messageId: response.data.messages[0].id
            };
        } catch (error: any) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            console.error('[MetaCloudProvider] Send error:', errorMessage);

            throw new Error(`WhatsApp API Error: ${errorMessage}`);
        }
    }

    async getTemplates(): Promise<WhatsAppTemplate[]> {
        try {
            const response = await axios.get(
                `${this.apiUrl}/${process.env.META_BUSINESS_ACCOUNT_ID}/message_templates`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    },
                    params: {
                        limit: 100
                    }
                }
            );

            return response.data.data.map((template: any) => ({
                id: template.id,
                name: template.name,
                language: template.language,
                status: template.status,
                category: template.category,
                components: template.components
            }));
        } catch (error: any) {
            console.error('[MetaCloudProvider] Get templates error:', error.message);
            return [];
        }
    }

    async validateTemplate(templateId: string): Promise<boolean> {
        const templates = await this.getTemplates();
        return templates.some(t => t.id === templateId && t.status === 'APPROVED');
    }

    private buildComponents(params: Record<string, string>): any[] {
        if (Object.keys(params).length === 0) {
            return [];
        }

        // Convert params to Meta's component format
        return [{
            type: 'body',
            parameters: Object.values(params).map(value => ({
                type: 'text',
                text: value
            }))
        }];
    }
}
