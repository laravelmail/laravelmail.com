import { generateWithProviderFallback } from "../../lib/ai-client";

export interface AIResponse {
  text: string;
  model: string;
  provider: string;
  reasoning?: string;
  reasoningDetails?: unknown;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
  finishReason?: string;
}

export async function GET(event: any) {
  const { searchParams } = new URL(event.request.url);
  const prompt = searchParams.get("prompt");

  if (!prompt || typeof prompt !== "string") {
    return new Response(
      JSON.stringify({ error: "Prompt is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const result = await generateWithProviderFallback(prompt);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("AI generation error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "AI generation failed. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(event: any) {
  try {
    const body = await event.request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await generateWithProviderFallback(prompt);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("AI generation error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "AI generation failed. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}