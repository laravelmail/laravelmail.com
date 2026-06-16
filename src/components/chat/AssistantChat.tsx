"use client";

import { useState, useLayoutEffect, useRef } from "react";

interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const OLLAMA_BASE_URL = "https://ai.izdrail.com";

const presetAvatars = [
  "bg-gradient-to-br from-purple-500 to-pink-500",
  "bg-gradient-to-br from-cyan-500 to-blue-500",
  "bg-gradient-to-br from-green-400 to-emerald-500",
  "bg-gradient-to-br from-orange-400 to-red-500",
  "bg-gradient-to-br from-yellow-400 to-orange-500",
  "bg-gradient-to-br from-pink-400 to-rose-500",
  "bg-gradient-to-br from-indigo-400 to-purple-500",
  "bg-gradient-to-br from-teal-400 to-cyan-500",
];

function getInitials(name: string) {
  return name.charAt(0).toUpperCase();
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function AssistantChat() {
  const [models] = useState<OllamaModel[]>([
    { name: "laravelcompany/laravelmail", modified_at: new Date().toISOString(), size: 0 }
  ]);
  const [selectedModel] = useState<string>("laravelcompany/laravelmail");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Force messages container height on mount and resize
  useLayoutEffect(() => {
    const updateMessagesHeight = () => {
      if (!messagesContainerRef.current || !rightPanelRef.current) return;
      const rect = rightPanelRef.current.getBoundingClientRect();
      const header = rightPanelRef.current.querySelector<HTMLElement>('[data-part="header"]');
      const input = rightPanelRef.current.querySelector<HTMLElement>('[data-part="input"]');
      const headerH = header?.offsetHeight ?? 0;
      const inputH = input?.offsetHeight ?? 0;
      messagesContainerRef.current.style.maxHeight = `${rect.height - headerH - inputH}px`;
    };
    updateMessagesHeight();
    window.addEventListener('resize', updateMessagesHeight);
    return () => window.removeEventListener('resize', updateMessagesHeight);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !selectedModel) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + data.message.content,
                  };
                }
                return updated;
              });
            }
          } catch {
            // skip malformed
          }
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          updated[updated.length - 1] = {
            ...last,
            content: "Error: Failed to get response. Please try again.",
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 80px)' }} className="flex flex-col md:flex-row border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* Left sidebar */}
      <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col" style={{ minHeight: 0 }}>
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {models.map((model) => (
              <li
                key={model.name}
                className="p-4 bg-blue-50 dark:bg-gray-800"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="flex items-center justify-center space-x-4 rounded">
                      <div className="relative">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${presetAvatars[0]}`}
                        >
                          {getInitials(model.name)}
                        </div>
                        <span className="absolute h-3.5 w-3.5 rounded-full border-2 border-white dark:border-gray-800 -bottom-1 -right-1 bg-green-400" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                      {model.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                      AI Assistant
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel */}
      <div ref={rightPanelRef} className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-800" style={{ minHeight: 0 }}>
        {/* Header */}
        <div data-part="header" className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center" style={{ flexShrink: 0 }}>
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center space-x-4 rounded">
              <div className="relative">
                {selectedModel ? (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      presetAvatars[
                        models.findIndex((m) => m.name === selectedModel) %
                          presetAvatars.length
                      ]
                    }`}
                  >
                    {getInitials(selectedModel)}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-400" />
                )}
                <span
                  className={`absolute h-3.5 w-3.5 rounded-full border-2 border-white dark:border-gray-800 -left-1 -top-1 ${
                    isLoading ? "bg-yellow-400" : "bg-green-400"
                  }`}
                />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {selectedModel || "Select a model"}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {isLoading ? "Typing..." : "Active now"}
              </span>
            </div>
          </div>
          <div className="flex space-x-2" style={{ flexShrink: 0 }}>
            <button
              type="button"
              className="group relative flex items-stretch justify-center p-0.5 text-center font-medium transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow] focus:z-10 focus:outline-none text-gray-900 bg-white border border-gray-200 enabled:hover:bg-gray-100 enabled:hover:text-blue-700 focus:text-blue-700 dark:bg-transparent dark:text-gray-400 dark:border-gray-600 dark:enabled:hover:text-white dark:enabled:hover:bg-gray-700 focus:ring-2 rounded-full"
            >
              <span className="flex items-stretch transition-all duration-200 rounded-md px-2 py-1.5 text-sm">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </span>
            </button>
            <button
              type="button"
              className="group relative flex items-stretch justify-center p-0.5 text-center font-medium transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow] focus:z-10 focus:outline-none text-gray-900 bg-white border border-gray-200 enabled:hover:bg-gray-100 enabled:hover:text-blue-700 focus:text-blue-700 dark:bg-transparent dark:text-gray-400 dark:border-gray-600 dark:enabled:hover:text-white dark:enabled:hover:bg-gray-700 focus:ring-2 rounded-full"
            >
              <span className="flex items-stretch transition-all duration-200 rounded-md px-2 py-1.5 text-sm">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </span>
            </button>
            <button
              type="button"
              className="group relative flex items-stretch justify-center p-0.5 text-center font-medium transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow] focus:z-10 focus:outline-none text-gray-900 bg-white border border-gray-200 enabled:hover:bg-gray-100 enabled:hover:text-blue-700 focus:text-blue-700 dark:bg-transparent dark:text-gray-400 dark:border-gray-600 dark:enabled:hover:text-white dark:enabled:hover:bg-gray-700 focus:ring-2 rounded-full"
            >
              <span className="flex items-stretch transition-all duration-200 rounded-md px-2 py-1.5 text-sm">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Start a conversation with{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedModel || "a model"}
                </span>
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center justify-center rounded mr-2 mt-1">
                  <div className="relative">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        presetAvatars[
                          models.findIndex((m) => m.name === selectedModel) %
                            presetAvatars.length
                        ]
                      }`}
                    >
                      {getInitials(selectedModel)}
                    </div>
                  </div>
                </div>
              )}
              <div
                className={`p-3 rounded-lg max-w-md shadow-sm ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white rounded-br-none"
                    : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-600"
                }`}
              >
                <p className="whitespace-pre-wrap">
                  {msg.content ||
                    (msg.role === "assistant" && isLoading ? "\u200B" : "")}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div data-part="input" className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700" style={{ flexShrink: 0 }}>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="group relative items-stretch justify-center p-0.5 text-center font-medium transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow] focus:z-10 focus:outline-none text-gray-900 bg-white border border-gray-200 enabled:hover:bg-gray-100 enabled:hover:text-blue-700 focus:text-blue-700 dark:bg-transparent dark:text-gray-400 dark:border-gray-600 dark:enabled:hover:text-white dark:enabled:hover:bg-gray-700 focus:ring-2 rounded-full hidden sm:inline-flex"
            >
              <span className="flex items-stretch transition-all duration-200 rounded-md px-2 py-1.5 text-sm">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 20 20" aria-hidden="true" className="h-6 w-6 text-gray-500" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                </svg>
              </span>
            </button>
            <button
              type="button"
              className="group relative items-stretch justify-center p-0.5 text-center font-medium transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow] focus:z-10 focus:outline-none text-gray-900 bg-white border border-gray-200 enabled:hover:bg-gray-100 enabled:hover:text-blue-700 focus:text-blue-700 dark:bg-transparent dark:text-gray-400 dark:border-gray-600 dark:enabled:hover:text-white dark:enabled:hover:bg-gray-700 focus:ring-2 rounded-full hidden sm:inline-flex"
            >
              <span className="flex items-stretch transition-all duration-200 rounded-md px-2 py-1.5 text-sm">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 20 20" aria-hidden="true" className="h-6 w-6 text-gray-500" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </span>
            </button>
            <div className="flex-1">
              <div className="flex">
                <div className="relative w-full">
                  <input
                    className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 bg-gray-50 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                    type="text"
                    placeholder="Write a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || !selectedModel}
              type="button"
              className="group relative flex items-stretch justify-center p-0.5 text-center font-medium transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow] focus:z-10 focus:outline-none rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-stretch transition-all duration-200 rounded-md px-4 py-2 text-sm">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 rotate-90 text-purple-600" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
