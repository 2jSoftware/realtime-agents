import { Message } from "./realtimeConnection";

interface MemoryState {
  messages: Message[];
  summary: string | null;
  keyPoints: string[];
  lastSummarizedAt: number;
}

export class ConversationMemoryChain {
  private state: MemoryState;
  private maxMessages: number;
  private summarizeThreshold: number;
  private summaryPrompt: string;

  constructor(options: {
    maxMessages?: number;
    summarizeThreshold?: number;
    summaryPrompt?: string;
  } = {}) {
    this.maxMessages = options.maxMessages || 10;
    this.summarizeThreshold = options.summarizeThreshold || 5;
    this.summaryPrompt = options.summaryPrompt || "Summarize the key points of this conversation:";
    this.state = {
      messages: [],
      summary: null,
      keyPoints: [],
      lastSummarizedAt: Date.now()
    };
  }

  async addMessage(message: Message): Promise<void> {
    this.state.messages.push(message);

    // Check if we need to summarize
    if (this.state.messages.length >= this.summarizeThreshold) {
      await this.summarizeConversation();
    }

    // Trim old messages if needed
    if (this.state.messages.length > this.maxMessages) {
      this.state.messages = this.state.messages.slice(-this.maxMessages);
    }
  }

  private async summarizeConversation(): Promise<void> {
    const messagesToSummarize = this.state.messages.slice(
      this.state.messages.findIndex(m => m.role !== "system")
    );

    if (messagesToSummarize.length === 0) return;

    // Create summary prompt
    const conversationText = messagesToSummarize
      .map(m => `${m.role}: ${m.content}`)
      .join("\n");

    const summaryPrompt = `${this.summaryPrompt}\n\n${conversationText}`;

    // TODO: Call LLM to generate summary
    // For now, we'll just store the last few exchanges
    this.state.summary = `Last ${messagesToSummarize.length} messages exchanged`;
    this.state.keyPoints = messagesToSummarize
      .filter(m => m.role === "assistant")
      .map(m => m.content.substring(0, 100) + "...");

    this.state.lastSummarizedAt = Date.now();
  }

  getContext(): { messages: Message[]; summary: string | null; keyPoints: string[] } {
    return {
      messages: this.state.messages,
      summary: this.state.summary,
      keyPoints: this.state.keyPoints
    };
  }

  clear(): void {
    this.state = {
      messages: [],
      summary: null,
      keyPoints: [],
      lastSummarizedAt: Date.now()
    };
  }

  // Get formatted context for the LLM
  getFormattedContext(): string {
    let context = "";
    
    if (this.state.summary) {
      context += `Previous conversation summary:\n${this.state.summary}\n\n`;
    }
    
    if (this.state.keyPoints.length > 0) {
      context += "Key points discussed:\n";
      context += this.state.keyPoints.map(point => `- ${point}`).join("\n");
      context += "\n\n";
    }
    
    return context;
  }
} 