
export class CreateWhatsAppTemplateDto {
  templateId: string;

  name: string;

  language?: string;

  status?: string;

  category?: string;

  components?: Record<string, any>;
}
