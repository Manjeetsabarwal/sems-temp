
export class CreateReportCardTemplateDto {
  code: string;

  displayName: string;

  description?: string;

  isActive?: boolean;

  configJson?: Record<string, any>;
}
