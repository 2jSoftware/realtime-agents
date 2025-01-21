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
  isPTTActive: boolean;
  isPTTUserSpeaking: boolean;
  handleTalkButtonDown: () => void;
  handleTalkButtonUp: () => void;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

function Transcript({
  userText,
  setUserText,
  onSendMessage,
  canSend,
  isPTTActive,
  isPTTUserSpeaking,
  handleTalkButtonDown,
  handleTalkButtonUp
}: TranscriptProps) {
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
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto p-4">
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
      
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={3}
              className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg resize-none text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            {isPTTActive && (
              <button
                onMouseDown={handleTalkButtonDown}
                onMouseUp={handleTalkButtonUp}
                onTouchStart={handleTalkButtonDown}
                onTouchEnd={handleTalkButtonUp}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isPTTUserSpeaking
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-[var(--input-bg)] text-[var(--text-primary)] hover:bg-[var(--bubble-bg)]"
                }`}
              >
                Talk
              </button>
            )}
            
            <button
              onClick={onSendMessage}
              disabled={!canSend || !userText.trim()}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors`}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Transcript;
