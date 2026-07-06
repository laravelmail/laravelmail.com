export interface Template {
  id: number;
  name: string;
  slug: string;
  path: string;
  status: string;
  summary: string | null;
  error: string;
  size_bytes: number;
  design_updated_at: string | null;
  last_processed_at: string | null;
  created_at: string;
  industries: string[];
  message_types: string[];
  tags: string[];
  has_thumbnail: boolean;
}

export interface TemplatesListResponse {
  total: number;
  page: number;
  page_size: number;
  templates: Template[];
}

export interface TemplateMeta {
  name: string;
  slug: string;
  description: string;
  industries: string[];
  message_types: string[];
  tags: string[];
  is_variant: boolean;
}

export interface ListTemplatesParams {
  page?: number;
  page_size?: number;
  search?: string | null;
  industry?: string | null;
  message_type?: string | null;
  tag?: string | null;
}

export class TemplatesApiError extends Error {
  status: number;
  issues: Array<{ loc: (string | number)[]; msg: string; type: string }>;

  constructor(
    message: string,
    status: number,
    issues: Array<{ loc: (string | number)[]; msg: string; type: string }> = [],
  ) {
    super(message);
    this.name = "TemplatesApiError";
    this.status = status;
    this.issues = issues;
  }
}
