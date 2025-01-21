"use client";

import React, { createContext, useContext, useState, FC, PropsWithChildren, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { TranscriptItem } from "@/app/types";

interface TranscriptContextType {
  transcriptItems: TranscriptItem[];
  addTranscriptMessage: (message: { role: string; content: string; itemId?: string; isHidden?: boolean }) => void;
  updateTranscriptMessage: (itemId: string, text: string, isDelta: boolean) => void;
  addTranscriptBreadcrumb: (title: string, data?: Record<string, any>) => void;
  toggleTranscriptItemExpand: (itemId: string) => void;
  updateTranscriptItemStatus: (itemId: string, newStatus: "IN_PROGRESS" | "DONE") => void;
}

const TranscriptContext = createContext<TranscriptContextType | undefined>(undefined);

export const TranscriptProvider: FC<PropsWithChildren> = ({ children }) => {
  const [transcriptItems, setTranscriptItems] = useState<TranscriptItem[]>([]);
  const messageCounterRef = useRef(0);
  const lastUpdateRef = useRef<{ [key: string]: number }>({});  // Track last update time per itemId

  const addTranscriptMessage = (message: { role: string; content: string; itemId?: string; isHidden?: boolean }) => {
    const timestamp = Date.now();
    
    // More robust content hash generation
    const contentHash = message.content
      .split('')
      .map(char => char.charCodeAt(0).toString(16))
      .join('')
      .slice(0, 8);
    
    messageCounterRef.current += 1;
    
    const newItem: TranscriptItem = {
      itemId: message.itemId || `${timestamp}-${message.role}-${contentHash}-${messageCounterRef.current}-${uuidv4()}`,
      type: "MESSAGE",
      role: message.role as "user" | "assistant" | "system",
      title: message.content,
      expanded: false,
      timestamp: new Date(timestamp).toLocaleTimeString(),
      createdAtMs: timestamp,
      status: "IN_PROGRESS",
      isHidden: message.isHidden || false
    };

    setTranscriptItems((prev) => {
      // Check for exact duplicate IDs first
      if (prev.some(item => item.itemId === newItem.itemId)) {
        // If duplicate ID found, generate a new unique ID
        newItem.itemId = `${timestamp}-${message.role}-${contentHash}-${messageCounterRef.current}-${uuidv4()}-${Date.now()}`;
      }

      // More thorough duplicate checks
      if (message.itemId) {
        const existingItem = prev.find(item => item.itemId === message.itemId);
        if (existingItem) {
          console.warn(`Message with ID ${message.itemId} already exists:`, 
            { existing: existingItem.title?.slice(0, 50) || '[no title]', new: message.content.slice(0, 50) });
          return prev;
        }
      }

      // Check for recent duplicates with same content
      const recentDuplicate = prev.find(item => 
        item.role === message.role && 
        item.title === message.content && 
        timestamp - item.createdAtMs < 200 &&
        item.itemId.includes(contentHash)
      );

      if (recentDuplicate) {
        console.warn('Recent duplicate detected:', 
          { existing: recentDuplicate.title?.slice(0, 50) || '[no title]', timeAgo: timestamp - recentDuplicate.createdAtMs });
        return prev;
      }

      return [...prev, newItem];
    });
  };

  const updateTranscriptMessage = (itemId: string, newText: string, isDelta: boolean = false) => {
    const now = Date.now();
    const lastUpdate = lastUpdateRef.current[itemId] || 0;
    
    // Skip rapid updates
    if (isDelta && now - lastUpdate < 50) {
      return;
    }
    
    lastUpdateRef.current[itemId] = now;

    setTranscriptItems((prev) => {
      const item = prev.find(i => i.itemId === itemId);
      if (!item || item.type !== "MESSAGE") return prev;

      return prev.map((item) => {
        if (item.itemId === itemId && item.type === "MESSAGE") {
          return {
            ...item,
            title: isDelta ? (item.title || "") + newText : newText,
            createdAtMs: now
          };
        }
        return item;
      });
    });
  };

  const addTranscriptBreadcrumb = (title: string, data?: Record<string, any>) => {
    setTranscriptItems((prev) => [
      ...prev,
      {
        itemId: `breadcrumb-${uuidv4()}`,
        type: "BREADCRUMB",
        title,
        data,
        expanded: false,
        timestamp: new Date().toLocaleTimeString(),
        createdAtMs: Date.now(),
        status: "DONE",
        isHidden: false,
      },
    ]);
  };

  const toggleTranscriptItemExpand = (itemId: string) => {
    setTranscriptItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId ? { ...item, expanded: !item.expanded } : item
      )
    );
  };

  const updateTranscriptItemStatus = (itemId: string, newStatus: "IN_PROGRESS" | "DONE") => {
    setTranscriptItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId ? { ...item, status: newStatus } : item
      )
    );
  };

  return (
    <TranscriptContext.Provider
      value={{
        transcriptItems,
        addTranscriptMessage,
        updateTranscriptMessage,
        addTranscriptBreadcrumb,
        toggleTranscriptItemExpand,
        updateTranscriptItemStatus,
      }}
    >
      {children}
    </TranscriptContext.Provider>
  );
};

export function useTranscript() {
  const context = useContext(TranscriptContext);
  if (!context) {
    throw new Error("useTranscript must be used within a TranscriptProvider");
  }
  return context;
}