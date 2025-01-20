import { RefObject } from "react";
import { DEEPSEEK_API_ENDPOINT, LANGFLOW_SYSTEM_PROMPT } from "./deepseek";
import { ConversationMemoryChain } from "./memoryChain";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ConnectionManager {
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
  sendMessage: (message: string) => Promise<any>;
  onMessage?: (message: any) => void;
  getContext: () => Message[];
}

interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffFactor: number;
}

class DeepSeekConnection implements ConnectionManager {
  private apiKey: string | null = null;
  private _isConnected: boolean = false;
  private messageHistory: Message[] = [];
  private maxHistoryLength: number = 10;
  private retryConfig: RetryConfig = {
    maxAttempts: 3,
    delayMs: 1000,
    backoffFactor: 2
  };
  private memoryChain: ConversationMemoryChain;

  constructor(apiKey?: string, retryConfig?: Partial<RetryConfig>, systemPrompt?: string) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || null;
    if (retryConfig) {
      this.retryConfig = { ...this.retryConfig, ...retryConfig };
    }
    
    // Initialize memory chain
    this.memoryChain = new ConversationMemoryChain({
      maxMessages: this.maxHistoryLength,
      summarizeThreshold: 5
    });
    
    // Add system message
    const systemMessage: Message = {
      role: "system",
      content: systemPrompt || "You are a helpful AI assistant."
    };
    this.messageHistory = [systemMessage];
    this.memoryChain.addMessage(systemMessage);
  }

  get isConnected() {
    return this._isConnected;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    let lastError: Error | null = null;
    let delayMs = this.retryConfig.delayMs;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt === this.retryConfig.maxAttempts) break;
        
        await this.delay(delayMs);
        delayMs *= this.retryConfig.backoffFactor;
      }
    }

    throw new Error(`${errorMessage} after ${this.retryConfig.maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  async connect() {
    if (!this.apiKey) {
      throw new Error("DeepSeek API key not configured");
    }

    return this.retryOperation(async () => {
      const response = await fetch(DEEPSEEK_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "system", content: "connection_test" }]
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      this._isConnected = true;
    }, "Failed to connect to DeepSeek API");
  }

  disconnect() {
    this._isConnected = false;
    this.messageHistory = [];
    this.memoryChain.clear();
  }

  async sendMessage(message: string): Promise<any> {
    if (!this._isConnected) {
      throw new Error("Not connected");
    }

    const userMessage: Message = { role: "user", content: message };
    await this.memoryChain.addMessage(userMessage);

    try {
      const response = await this.retryOperation(
        async () => {
          const messages = [
            ...this.messageHistory,
            { role: "system", content: this.memoryChain.getFormattedContext() },
            userMessage
          ];

          const result = await fetch(DEEPSEEK_API_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages,
              temperature: 0.7,
            }),
          });

          if (!result.ok) {
            throw new Error(`API request failed: ${result.statusText}`);
          }

          return await result.json();
        },
        "Failed to send message"
      );

      const assistantMessage: Message = {
        role: "assistant",
        content: response.choices[0].message.content,
      };
      
      await this.memoryChain.addMessage(assistantMessage);
      this.messageHistory.push(userMessage, assistantMessage);

      // Trim history if needed
      if (this.messageHistory.length > this.maxHistoryLength) {
        this.messageHistory = this.messageHistory.slice(-this.maxHistoryLength);
      }

      return response;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  getContext(): Message[] {
    return this.memoryChain.getContext().messages;
  }
}

export function createRealtimeConnection(
  apiKey?: string,
  systemPrompt?: string
): ConnectionManager {
  return new DeepSeekConnection(apiKey, undefined, systemPrompt);
} 