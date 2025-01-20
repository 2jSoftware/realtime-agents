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
    <div className="p-4 flex flex-row items-center justify-center gap-x-8">
      <button
        onClick={isConnected ? onDisconnect : onConnect}
        disabled={isConnecting}
        className={`px-4 py-2 rounded-lg font-medium ${
          isConnected
            ? "bg-red-500 text-white hover:bg-red-600"
            : isConnecting
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-green-500 text-white hover:bg-green-600"
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
          className="w-4 h-4"
        />
        <label
          htmlFor="push-to-talk"
          className={`flex items-center ${
            isConnected ? "cursor-pointer" : "cursor-not-allowed text-gray-400"
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
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : isPTTUserSpeaking
              ? "bg-blue-200 hover:bg-blue-300"
              : "bg-gray-200 hover:bg-gray-300"
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
          className="w-4 h-4"
        />
        <label
          htmlFor="audio-playback"
          className={`flex items-center ${
            isConnected ? "cursor-pointer" : "cursor-not-allowed text-gray-400"
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
          className="w-4 h-4"
        />
        <label htmlFor="logs" className="flex items-center cursor-pointer">
          Event Log
        </label>
      </div>
    </div>
  );
}

export default BottomToolbar;
