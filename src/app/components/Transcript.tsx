"use-client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { TranscriptItem } from "@/app/types";
import Image from "next/image";
import { useTranscript } from "@/app/contexts/TranscriptContext";

interface TranscriptProps {
  userText: string;
  setUserText: (text: string) => void;
  onSendMessage: () => void;
  canSend: boolean;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

function Transcript({ userText, setUserText, onSendMessage, canSend }: TranscriptProps) {
  const { transcriptItems, toggleTranscriptItemExpand } = useTranscript();
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [prevLogs, setPrevLogs] = useState<TranscriptItem[]>([]);
  const [justCopied, setJustCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function scrollToBottom() {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }

  useEffect(() => {
    const hasNewMessage = transcriptItems.length > prevLogs.length;
    const hasUpdatedMessage = transcriptItems.some((newItem, index) => {
      const oldItem = prevLogs[index];
      return (
        oldItem &&
        (newItem.title !== oldItem.title || newItem.data !== oldItem.data)
      );
    });

    if (hasNewMessage || hasUpdatedMessage) {
      scrollToBottom();
    }

    setPrevLogs(transcriptItems);
  }, [transcriptItems]);

  // Autofocus on text box input on load
  useEffect(() => {
    if (canSend && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [canSend]);

  const handleCopyTranscript = async () => {
    if (!transcriptRef.current) return;
    try {
      await navigator.clipboard.writeText(transcriptRef.current.innerText);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy transcript:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend && userText.trim()) {
        onSendMessage();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border border-[var(--border)] shadow-lg rounded-xl">
      <div className="flex-1 overflow-y-auto p-6" ref={transcriptRef}>
        {transcriptItems.map((item) => {
          if (item.isHidden) return null;

          const isUser = item.role === 'user';
          const containerClasses = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`;
          const bubbleClasses = `max-w-[80%] p-4 rounded-xl shadow-sm ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-[var(--bubble-bg)] text-[var(--text-primary)] border border-[var(--bubble-border)]'
          }`;

          return (
            <div key={item.itemId} className={containerClasses}>
              <div className={bubbleClasses}>
                <ReactMarkdown 
                  className={`prose ${isUser ? 'prose-invert' : 'prose-invert'} max-w-none`}
                  components={{
                    code: ({ inline, className, children }) => {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline ? (
                        <pre className={`${isUser ? 'bg-blue-700' : 'bg-[var(--input-bg)]'} p-3 rounded-lg overflow-x-auto`}>
                          <code className={match ? `language-${match[1]}` : ""}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className={`${isUser ? 'bg-blue-700' : 'bg-[var(--input-bg)]'} px-1.5 py-0.5 rounded`}>
                          {children}
                        </code>
                      );
                    }
                  } as Components}
                >
                  {item.title || ''}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[var(--border)] p-6 bg-background">
        <div className="flex items-end gap-4">
          <textarea
            ref={textareaRef}
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 min-h-[80px] p-3 border border-[var(--border)] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
          />
          <button
            onClick={onSendMessage}
            disabled={!canSend || !userText.trim()}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              canSend && userText.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : 'bg-[var(--bubble-bg)] text-[var(--text-disabled)] cursor-not-allowed'
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Transcript;
