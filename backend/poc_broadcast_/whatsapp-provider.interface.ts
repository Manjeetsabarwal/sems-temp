// ============================================
// WHATSAPP PROVIDER INTERFACE
// Clean abstraction for switching providers
// ============================================

export interface SendTemplateParams {
    to: string;
    templateId: string;
    templateName: string;
    language: string;
    params: Record<string, string>;
}

export interface SendResult {
    success: boolean;
    messageId: string;
    error?: string;
}

export interface WhatsAppTemplate {
    id: string;
    name: string;
    language: string;
    status: string;
    category: string;
    components: any;
}

export interface IWhatsAppProvider {
    sendTemplateMessage(params: SendTemplateParams): Promise<SendResult>;
    getTemplates(): Promise<WhatsAppTemplate[]>;
    validateTemplate(templateId: string): Promise<boolean>;
}
