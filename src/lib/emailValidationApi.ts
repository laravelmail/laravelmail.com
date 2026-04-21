export const DEFAULT_VALIDATION_API_BASE_URL =
  import.meta.env.PUBLIC_VALIDATION_API_BASE_URL?.trim() ||
  "https://validation.laravelmail.com";

export type ValidationVerdict =
  | "safe"
  | "risky"
  | "invalid"
  | "unknown"
  | string;

export interface ValidationIssue {
  loc?: Array<string | number>;
  msg: string;
  type?: string;
}

export class ValidationApiError extends Error {
  status: number;
  issues: ValidationIssue[];

  constructor(message: string, status: number, issues: ValidationIssue[] = []) {
    super(message);
    this.name = "ValidationApiError";
    this.status = status;
    this.issues = issues;
  }
}

export interface FilterEmailResponse {
  email: string;
  domain: string;
  disposable: boolean;
  blacklisted: boolean;
  whitelisted: boolean;
  mx_exists: boolean;
  mx_records: string[];
  gibberish: boolean;
  smtp_valid: boolean;
  new_domain: boolean;
  domain_age_in_days: number | null;
  spam_keywords: boolean;
  reputation_penalty: number;
  score: number;
  verdict: ValidationVerdict;
}

export interface FeedbackInput {
  email: string;
}

export interface ListResponse {
  list: string;
  items: string[];
}

export interface AllListsResponse {
  whitelist: string[];
  blacklist: string[];
  disposable: string[];
  spam_keywords: string[];
  [key: string]: string[];
}

export interface ScoresResponse {
  scores: Record<string, number>;
  note: string;
}

export interface UpdateScoresResponse {
  message: string;
  new_scores?: Record<string, number> | null;
}

export interface DefaultScoresResponse {
  message: string;
  default_scores: Record<string, number>;
}

export interface HealthResponse {
  status?: string;
  [key: string]: unknown;
}

export interface RootResponse {
  message?: string;
  [key: string]: unknown;
}

export type ManagedListName = "whitelist" | "blacklist";
export type ReadOnlyListName = "disposable" | "spam_keywords";
export type ListName = ManagedListName | ReadOnlyListName | string;

const defaultHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

function buildUrl(path: string, query?: Record<string, string | number | boolean>) {
  const url = new URL(path, DEFAULT_VALIDATION_API_BASE_URL);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

async function parseError(response: Response): Promise<never> {
  let payload: any = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const issues = Array.isArray(payload?.detail) ? payload.detail : [];
  const message =
    issues[0]?.msg ||
    payload?.message ||
    `Request failed with status ${response.status}`;

  throw new ValidationApiError(message, response.status, issues);
}

async function request<T>(
  path: string,
  init?: RequestInit,
  query?: Record<string, string | number | boolean>,
): Promise<T> {
  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers: {
      ...defaultHeaders,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    return parseError(response);
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const emailValidationApi = {
  baseUrl: DEFAULT_VALIDATION_API_BASE_URL,

  root() {
    return request<RootResponse>("/");
  },

  health() {
    return request<HealthResponse>("/health");
  },

  filterEmail(email: string) {
    return request<FilterEmailResponse>("/v1/filter-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  reportSpam(input: FeedbackInput) {
    return request<Record<string, never>>("/v1/feedback/spam", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  getLists() {
    return request<AllListsResponse>("/v1/lists");
  },

  getList(listName: ListName) {
    return request<ListResponse>(`/v1/lists/${listName}`);
  },

  addToList(listName: ManagedListName, domain: string) {
    return request<Record<string, never>>(`/v1/lists/${listName}`, { method: "POST" }, { domain });
  },

  removeFromList(listName: ManagedListName, domain: string) {
    return request<Record<string, never>>(`/v1/lists/${listName}`, { method: "DELETE" }, { domain });
  },

  clearList(listName: ListName) {
    return request<Record<string, never>>(`/v1/lists/${listName}`, { method: "DELETE" });
  },

  getScores() {
    return request<ScoresResponse>("/v1/scores");
  },

  updateScores(scores: Record<string, number>) {
    return request<UpdateScoresResponse>("/v1/scores", {
      method: "POST",
      body: JSON.stringify(scores),
    });
  },

  resetScores() {
    return request<DefaultScoresResponse>("/v1/scores/default", {
      method: "POST",
    });
  },
};

export function getErrorMessage(error: unknown) {
  if (error instanceof ValidationApiError) {
    if (error.issues.length > 0) {
      return error.issues
        .map((issue) =>
          issue.loc?.length ? `${issue.loc.join(".")}: ${issue.msg}` : issue.msg,
        )
        .join(" ");
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while talking to the validation API.";
}

export function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidDomain(value: string) {
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(
    normalizeDomain(value),
  );
}
