
export class CreateBroadcastDto {
  name: string;
  templateId: string;
  templateName: string;
  templateLanguage?: string;
  templateParams?: Record<string, any>;
  targetType?: string;
  targetId?: string | null;
  totalRecipients?: number;
  status?: string;
  createdBy?: number;
}

export class CreateBroadcastMessageDto {
  broadcastId: number;

  studentId: string;

  phoneNumber: string;

  templateId: string;

  templateName: string;

  templateLanguage?: string;

  templateParams?: Record<string, any>;
}
