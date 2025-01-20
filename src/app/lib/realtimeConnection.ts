import { RefObject } from "react";
import { DEEPSEEK_API_ENDPOINT, LANGFLOW_SYSTEM_PROMPT } from "./deepseek";

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

  constructor(apiKey?: string, retryConfig?: Partial<RetryConfig>, systemPrompt?: string) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || null;
    if (retryConfig) {
      this.retryConfig = { ...this.retryConfig, ...retryConfig };
    }
    this.messageHistory = [{
      role: "system",
      content: systemPrompt || "You are a helpful AI assistant."
    }];
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
    this.messageHistory = [{
      role: "system",
      content: LANGFLOW_SYSTEM_PROMPT
    }];
  }

  private addToHistory(message: Message) {
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.maxHistoryLength + 1) {
      this.messageHistory = [
        this.messageHistory[0],
        ...this.messageHistory.slice(-(this.maxHistoryLength))
      ];
    }
  }

  async sendMessage(message: string) {
    if (!this._isConnected) {
      throw new Error("Not connected to DeepSeek");
    }

    this.addToHistory({ role: "user", content: message });

    return this.retryOperation(async () => {
      const response = await fetch(DEEPSEEK_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: this.messageHistory,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.choices?.[0]?.message) {
        throw new Error("Invalid response format from API");
      }

      this.addToHistory(result.choices[0].message);
      return result;
    }, "Failed to send message to DeepSeek");
  }

  getContext(): Message[] {
    return [...this.messageHistory];
  }
}

export function createRealtimeConnection(
  apiKey?: string,
  systemPrompt?: string
): ConnectionManager {
  return new DeepSeekConnection(apiKey, undefined, systemPrompt);
} 