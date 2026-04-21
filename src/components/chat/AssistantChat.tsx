"use client";

import { useState, useEffect } from "react";
import { DefaultChatTransport } from "ai";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  ThreadPrimitive,
  MessagePrimitive,
  AuiIf,
} from "@assistant-ui/react";
import { ArrowUpIcon, ChevronDown, Loader2 } from "lucide-react";

interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

interface OllamaTagsResponse {
  models: OllamaModel[];
}

const OLLAMA_BASE_URL = "https://ai.izdrail.com";

const ThreadWelcome = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <h2 className="text-2xl font-semibold mb-2">Hello there!</h2>
      <p className="text-muted-foreground text-lg mb-6">
        How can I help you today?
      </p>
    </div>
  );
};

const ThreadMessages = () => {
  return (
    <ThreadPrimitive.Messages>
      {({ message }) => {
        if (message.role === "user") {
          return (
            <MessagePrimitive.Root
              className="flex flex-col items-end gap-2 px-4 py-3"
              data-role="user"
            >
              <div className="rounded-2xl bg-muted px-4 py-2.5 max-w-[80%]">
                <MessagePrimitive.Parts />
              </div>
            </MessagePrimitive.Root>
          );
        }
        return (
          <MessagePrimitive.Root
            className="flex flex-col items-start gap-2 px-4 py-3"
            data-role="assistant"
          >
            <div className="rounded-2xl px-4 py-2.5 max-w-[80%]">
              <MessagePrimitive.Parts />
            </div>
          </MessagePrimitive.Root>
        );
      }}
    </ThreadPrimitive.Messages>
  );
};

const Composer = () => {
  return (
    <ComposerPrimitive.Root className="flex w-full flex-col rounded-2xl border border-input bg-background px-1 pt-2 outline-none focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
      <ComposerPrimitive.Input
        placeholder="Send a message..."
        className="mb-1 max-h-32 min-h-14 w-full resize-none bg-transparent px-4 pt-2 pb-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
        rows={1}
        autoFocus
      />
      <div className="flex items-center justify-end mx-2 mb-2">
        <ComposerPrimitive.Send asChild>
          <button
            type="submit"
            className="size-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors"
          >
            <ArrowUpIcon className="size-4" />
          </button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
};

const Thread = () => {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col">
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto">
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <ThreadWelcome />
        </AuiIf>
        <ThreadMessages />
      </ThreadPrimitive.Viewport>
      <div className="p-4">
        <Composer />
      </div>
    </ThreadPrimitive.Root>
  );
};

export default function AssistantChat() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        const data: OllamaTagsResponse = await response.json();
        setModels(data.models);
        if (data.models.length > 0) {
          setSelectedModel(data.models[0].name);
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, []);

  const runtime = useChatRuntime({
    transport: new DefaultChatTransport({
      api: `${OLLAMA_BASE_URL}/api/chat`,
      prepareSendMessagesRequest: ({ body }) => ({
        body: {
          ...(body ?? {}),
          model: selectedModel,
        },
      }),
    }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h1 className="text-lg font-semibold">AI Chat</h1>
          <div className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              disabled={isLoadingModels}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-muted rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              {isLoadingModels ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <span className="max-w-[150px] truncate">
                    {selectedModel || "Select model"}
                  </span>
                  <ChevronDown className="size-4" />
                </>
              )}
            </button>
            {isModelDropdownOpen && models.length > 0 && (
              <div className="absolute right-0 mt-2 w-64 bg-background border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {models.map((model) => (
                  <button
                    key={model.name}
                    onClick={() => {
                      setSelectedModel(model.name);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${
                      selectedModel === model.name ? "bg-muted font-medium" : ""
                    }`}
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1">
          <Thread />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
}
