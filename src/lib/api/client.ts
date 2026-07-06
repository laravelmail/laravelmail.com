import type { Template, TemplatesListResponse, TemplateMeta, ListTemplatesParams, TemplatesApiError } from './types';

const DEFAULT_TEMPLATES_API_BASE_URL = "https://templates.laravelmail.com";
const PUBLIC_TEMPLATES_API_BASE_URL = import.meta.env.PUBLIC_TEMPLATES_API_BASE_URL?.trim();

function getTemplatesApiBaseUrl(): string {
  if (PUBLIC_TEMPLATES_API_BASE_URL) {
    return PUBLIC_TEMPLATES_API_BASE_URL.replace(/\/$/, "");
  }

  if (import.meta.env.SSR) {
    return DEFAULT_TEMPLATES_API_BASE_URL;
  }

  if (import.meta.env.DEV) {
    return "";
  }

  return DEFAULT_TEMPLATES_API_BASE_URL;
}

export const TEMPLATES_API_BASE_URL = getTemplatesApiBaseUrl();

function templatesApiUrl(path: string): string {
  return `${TEMPLATES_API_BASE_URL}${path}`;
}

class TemplatesApiErrorImpl extends Error implements TemplatesApiError {
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

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let issues: Array<{ loc: (string | number)[]; msg: string; type: string }> = [];
    try {
      const errorBody = await response.json();
      if (errorBody.detail) {
        issues = errorBody.detail;
      }
    } catch {}
    throw new TemplatesApiErrorImpl(
      `API request failed with status ${response.status}`,
      response.status,
      issues,
    );
  }
  return response.json() as Promise<T>;
}

export async function listTemplates(
  params: ListTemplatesParams = {},
): Promise<TemplatesListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.page_size !== undefined) searchParams.set("page_size", String(params.page_size));
  if (params.search) searchParams.set("search", params.search);
  if (params.industry) searchParams.set("industry", params.industry);
  if (params.message_type) searchParams.set("message_type", params.message_type);
  if (params.tag) searchParams.set("tag", params.tag);

  const url = templatesApiUrl(`/api/templates${searchParams.toString() ? "?" + searchParams.toString() : ""}`);
  const response = await fetch(url);
  return handleResponse<TemplatesListResponse>(response);
}

export async function getTemplate(identifier: string): Promise<Template> {
  const response = await fetch(templatesApiUrl(`/api/templates/${encodeURIComponent(identifier)}`));
  return handleResponse<Template>(response);
}

export async function getTemplateMeta(slug: string): Promise<TemplateMeta> {
  const response = await fetch(templatesApiUrl(`/api/templates/${encodeURIComponent(slug)}/meta`));
  return handleResponse<TemplateMeta>(response);
}

export async function getTemplateContent(slug: string): Promise<string> {
  const response = await fetch(templatesApiUrl(`/api/templates/${encodeURIComponent(slug)}/content`));
  if (!response.ok) {
    throw new TemplatesApiErrorImpl(
      `Failed to fetch template content: ${response.status}`,
      response.status,
    );
  }
  return response.text();
}

export async function getIndustries(): Promise<string[]> {
  const response = await fetch(templatesApiUrl("/api/industries"));
  return handleResponse<string[]>(response);
}

export async function getMessageTypes(): Promise<string[]> {
  const response = await fetch(templatesApiUrl("/api/message-types"));
  return handleResponse<string[]>(response);
}

export async function getTags(): Promise<string[]> {
  const response = await fetch(templatesApiUrl("/api/tags"));
  return handleResponse<string[]>(response);
}

export function getThumbnailUrl(slug: string): string {
  return templatesApiUrl(`/static/thumbnails/${encodeURIComponent(slug)}.png`);
}

export { TemplatesApiErrorImpl as TemplatesApiError };
