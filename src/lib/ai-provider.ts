export interface AIProviderInterface {
  generate(
    messages: Array<{ role: string; content: string }>,
    options?: {
      temperature?: number;
      stream?: boolean;
      onChunk?: (chunk: string) => void;
    },
  ): Promise<{
    text: string;
    reasoning?: string;
    reasoningDetails?: unknown;
    usage?: {
      promptTokens: number;
      completionTokens: number;
    };
    model: string;
    provider: string;
    finishReason?: string;
  }>;
  getModel(): string;
  getProvider(): string;
  isAvailable(): Promise<boolean>;
}

export class LocalProvider implements AIProviderInterface {
  private endpoint: string;
  private model: string;

  constructor(endpoint: string, model: string) {
    this.endpoint = endpoint;
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }

  getProvider(): string {
    return "local";
  }

  async isAvailable(): Promise<boolean> {
    try {
      const abort = new AbortController();
      const timeout = setTimeout(() => abort.abort(), 5000);

      const res = await fetch(`${this.endpoint}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: "ping" }],
          stream: false,
        }),
        signal: abort.signal,
      });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }

  async generate(
    messages: Array<{ role: string; content: string }>,
    options?: {
      temperature?: number;
      stream?: boolean;
      onChunk?: (chunk: string) => void;
    },
  ): Promise<{
    text: string;
    reasoning?: string;
    reasoningDetails?: unknown;
    usage?: {
      promptTokens: number;
      completionTokens: number;
    };
    model: string;
    provider: string;
    finishReason?: string;
  }> {
    const { stream = false, temperature } = options || {};

    const abortController = new AbortController();
    const timeoutMs = 60000;
    const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      const body = {
        model: this.model,
        messages,
        stream,
        ...(temperature !== undefined && { temperature }),
      };

      const res = await fetch(`${this.endpoint}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const json = await res.json();
      const text = json.choices?.[0]?.message?.content || "";

      return {
        text,
        reasoning: json.model_usage?.reasoning,
        reasoningDetails: json.reasoning_details,
        usage: json.usage
          ? {
              promptTokens: json.usage.prompt_tokens,
              completionTokens: json.usage.completion_tokens,
            }
          : undefined,
        model: this.model,
        provider: "local",
        finishReason: json.choices?.[0]?.finish_reason,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

export class OpenRouterProvider implements AIProviderInterface {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(apiKey: string, model: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  getModel(): string {
    return this.model;
  }

  getProvider(): string {
    return "openrouter";
  }

  async isAvailable(): Promise<boolean> {
    try {
      const abort = new AbortController();
      const timeout = setTimeout(() => abort.abort(), 8000);

      const res = await fetch(`${this.baseUrl}/models/${this.model}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        signal: abort.signal,
      });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }

  async generate(
    messages: Array<{ role: string; content: string }>,
    options?: {
      temperature?: number;
      stream?: boolean;
      onChunk?: (chunk: string) => void;
    },
  ): Promise<{
    text: string;
    reasoning?: string;
    reasoningDetails?: unknown;
    usage?: {
      promptTokens: number;
      completionTokens: number;
    };
    model: string;
    provider: string;
    finishReason?: string;
  }> {
    const { stream = false, temperature } = options || {};
    const onChunk = options?.onChunk;

    const abortController = new AbortController();
    const timeoutMs = 60000;
    const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      const body: any = {
        model: this.model,
        messages,
        ...(temperature !== undefined && { temperature }),
      };

      if (stream) {
        body.stream = true;
        body.reasoning = {
          effort: "medium",
        };
      }

      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://laravelmail.com",
          "X-Title": "Laravel Mail",
        },
        body: JSON.stringify(body),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`OpenRouter HTTP ${res.status}: ${errorText}`);
      }

      const json = await res.json();

      const text = json.choices?.[0]?.message?.content || "";
      const deltaReasoning = json.choices?.[0]?.delta?.reasoning;
      const reasoningDetails = json.model_usage?.reasoning_details;

      onChunk?.(text);

      return {
        text,
        reasoning: deltaReasoning ? String(deltaReasoning) : undefined,
        reasoningDetails,
        usage: json.usage
          ? {
              promptTokens: json.usage.prompt_tokens,
              completionTokens: json.usage.completion_tokens,
            }
          : undefined,
        model: this.model,
        provider: "openrouter",
        finishReason: json.choices?.[0]?.finish_reason,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}