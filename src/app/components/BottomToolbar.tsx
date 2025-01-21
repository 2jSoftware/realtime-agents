import React from "react";
import { SessionStatus } from "@/app/types";

interface BottomToolbarProps {
  sessionStatus: SessionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  isEventsPaneExpanded: boolean;
  setIsEventsPaneExpanded: (expanded: boolean) => void;
}

export default function BottomToolbar({
  sessionStatus,
  onConnect,
  onDisconnect,
  isEventsPaneExpanded,
  setIsEventsPaneExpanded
}: BottomToolbarProps) {
  return (
    <div className="p-4 border-t border-[var(--border)] bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {sessionStatus === "DISCONNECTED" ? (
            <button
              onClick={onConnect}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect
            </button>
          ) : sessionStatus === "CONNECTING" ? (
            <button
              disabled
              className="px-4 py-2 bg-gray-600 text-white rounded-lg cursor-not-allowed"
            >
              Connecting...
            </button>
          ) : (
            <button
              onClick={onDisconnect}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsEventsPaneExpanded(!isEventsPaneExpanded)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title={isEventsPaneExpanded ? "Hide Events" : "Show Events"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
