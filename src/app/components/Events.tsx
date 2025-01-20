"use client";

import React, { useRef, useEffect, useState } from "react";
import { useEvent } from "@/app/contexts/EventContext";
import { LoggedEvent } from "@/app/types";

interface EventsProps {
  isExpanded?: boolean;
}

function Events({ isExpanded = true }: EventsProps) {
  const [prevEventLogs, setPrevEventLogs] = useState<LoggedEvent[]>([]);
  const eventLogsContainerRef = useRef<HTMLDivElement | null>(null);

  const { loggedEvents, toggleExpand } = useEvent();

  const getDirectionArrow = (direction: string) => {
    if (direction === "client") return { symbol: "▲", color: "#7f5af0" };
    if (direction === "server") return { symbol: "▼", color: "#2cb67d" };
    return { symbol: "•", color: "#555" };
  };

  useEffect(() => {
    const hasNewEvent = loggedEvents.length > prevEventLogs.length;

    if (isExpanded && hasNewEvent && eventLogsContainerRef.current) {
      eventLogsContainerRef.current.scrollTop =
        eventLogsContainerRef.current.scrollHeight;
    }

    setPrevEventLogs(loggedEvents);
  }, [loggedEvents, isExpanded]);

  if (!isExpanded) return null;

  return (
    <div
      className={
        (isExpanded ? "w-[500px] min-w-[400px] max-w-[600px] overflow-auto" : "w-0 overflow-hidden opacity-0") +
        " transition-all rounded-xl duration-200 ease-in-out flex flex-col bg-gray-50 shadow-lg"
      }
      ref={eventLogsContainerRef}
    >
      <div>
        <div className="font-semibold px-6 py-4 sticky top-0 z-10 text-base border-b bg-white shadow-sm">
          Logs
        </div>
        <div className="divide-y divide-gray-200">
          {loggedEvents.map((log) => {
            const arrowInfo = getDirectionArrow(log.direction);
            const isError =
              log.eventName.toLowerCase().includes("error") ||
              log.eventData?.response?.status_details?.error != null;

            return (
              <div
                key={log.id}
                className="py-3 px-6 font-mono hover:bg-gray-100 transition-colors"
              >
                <div
                  onClick={() => toggleExpand(log.id)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <span
                      style={{ color: arrowInfo.color }}
                      className="ml-1 mr-2 flex-shrink-0"
                    >
                      {arrowInfo.symbol}
                    </span>
                    <span
                      className={
                        "flex-1 text-sm truncate " +
                        (isError ? "text-red-600 font-medium" : "text-gray-900")
                      }
                    >
                      {log.eventName}
                    </span>
                  </div>
                  <div className="text-gray-600 ml-3 text-xs whitespace-nowrap flex-shrink-0">
                    {log.timestamp}
                  </div>
                </div>

                {log.expanded && log.eventData && (
                  <div className="text-gray-800 text-left mt-2">
                    <pre className="border-l-2 ml-1 border-gray-300 whitespace-pre-wrap break-words font-mono text-xs pl-3 py-2 bg-white rounded-r-lg overflow-x-auto max-w-full">
                      {JSON.stringify(log.eventData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Events;
