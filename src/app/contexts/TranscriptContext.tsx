"use client";

import React, { createContext, useContext, useState, FC, PropsWithChildren } from "react";
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

  const addTranscriptMessage = (message: { role: string; content: string; itemId?: string; isHidden?: boolean }) => {
    const newItem: TranscriptItem = {
      itemId: message.itemId || uuidv4(),
      type: "MESSAGE",
      role: message.role as "user" | "assistant",
      title: message.content,
      expanded: false,
      timestamp: new Date().toLocaleTimeString(),
      createdAtMs: Date.now(),
      status: "IN_PROGRESS",
      isHidden: message.isHidden || false
    };

    setTranscriptItems((prev) => {
      // Check if message with same ID already exists
      if (message.itemId && prev.some(item => item.itemId === message.itemId)) {
        console.warn(`Message with ID ${message.itemId} already exists`);
        return prev;
      }
      return [...prev, newItem];
    });
  };

  const updateTranscriptMessage = (itemId: string, newText: string, isDelta: boolean = false) => {
    setTranscriptItems((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId && item.type === "MESSAGE") {
          return {
            ...item,
            title: isDelta ? (item.title || "") + newText : newText,
          };
        }
        return item;
      })
    );
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