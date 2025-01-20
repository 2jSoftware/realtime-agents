import React from "react";
import { SessionStatus } from "@/app/types";

interface BottomToolbarProps {
  sessionStatus: SessionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  isPTTActive: boolean;
  setIsPTTActive: (val: boolean) => void;
  isPTTUserSpeaking: boolean;
  handleTalkButtonDown: () => void;
  handleTalkButtonUp: () => void;
  isEventsPaneExpanded: boolean;
  setIsEventsPaneExpanded: (val: boolean) => void;
  isAudioPlaybackEnabled: boolean;
  setIsAudioPlaybackEnabled: (val: boolean) => void;
}

function BottomToolbar({
  sessionStatus,
  onConnect,
  onDisconnect,
  isPTTActive,
  setIsPTTActive,
  isPTTUserSpeaking,
  handleTalkButtonDown,
  handleTalkButtonUp,
  isEventsPaneExpanded,
  setIsEventsPaneExpanded,
  isAudioPlaybackEnabled,
  setIsAudioPlaybackEnabled,
}: BottomToolbarProps) {
  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  return (
    <div className="p-4 flex flex-row items-center justify-center gap-x-8 border-t border-[var(--border)] bg-background">
      <button
        onClick={isConnected ? onDisconnect : onConnect}
        disabled={isConnecting}
        className={`px-4 py-2 rounded-lg font-medium ${
          isConnected
            ? "bg-red-600 text-white hover:bg-red-700"
            : isConnecting
            ? "bg-[var(--bubble-bg)] text-[var(--text-disabled)] cursor-not-allowed"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {isConnecting ? "Connecting..." : isConnected ? "Disconnect" : "Connect"}
      </button>

      <div className="flex flex-row items-center gap-2">
        <input
          id="push-to-talk"
          type="checkbox"
          checked={isPTTActive}
          onChange={(e) => setIsPTTActive(e.target.checked)}
          disabled={!isConnected}
          className="w-4 h-4 bg-[var(--input-bg)] border-[var(--border)] rounded accent-blue-600"
        />
        <label
          htmlFor="push-to-talk"
          className={`flex items-center ${
            isConnected ? "cursor-pointer text-[var(--text-primary)]" : "cursor-not-allowed text-[var(--text-disabled)]"
          }`}
        >
          Push to talk
        </label>
        <button
          onMouseDown={handleTalkButtonDown}
          onMouseUp={handleTalkButtonUp}
          onTouchStart={handleTalkButtonDown}
          onTouchEnd={handleTalkButtonUp}
          disabled={!isPTTActive || !isConnected}
          className={`py-1 px-4 rounded-full transition-colors ${
            !isPTTActive || !isConnected
              ? "bg-[var(--bubble-bg)] text-[var(--text-disabled)] cursor-not-allowed"
              : isPTTUserSpeaking
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-[var(--input-bg)] hover:bg-[var(--bubble-bg)] text-[var(--text-primary)]"
          }`}
        >
          Talk
        </button>
      </div>

      <div className="flex flex-row items-center gap-2">
        <input
          id="audio-playback"
          type="checkbox"
          checked={isAudioPlaybackEnabled}
          onChange={(e) => setIsAudioPlaybackEnabled(e.target.checked)}
          disabled={!isConnected}
          className="w-4 h-4 bg-[var(--input-bg)] border-[var(--border)] rounded accent-blue-600"
        />
        <label
          htmlFor="audio-playback"
          className={`flex items-center ${
            isConnected ? "cursor-pointer text-[var(--text-primary)]" : "cursor-not-allowed text-[var(--text-disabled)]"
          }`}
        >
          Audio playback
        </label>
      </div>

      <div className="flex flex-row items-center gap-2">
        <input
          id="logs"
          type="checkbox"
          checked={isEventsPaneExpanded}
          onChange={(e) => setIsEventsPaneExpanded(e.target.checked)}
          className="w-4 h-4 bg-[var(--input-bg)] border-[var(--border)] rounded accent-blue-600"
        />
        <label htmlFor="logs" className="flex items-center cursor-pointer text-[var(--text-primary)]">
          Event Log
        </label>
      </div>
    </div>
  );
}

export default BottomToolbar;
