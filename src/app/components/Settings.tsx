import { SessionStatus } from "@/app/types";

interface SettingsProps {
  sessionStatus: SessionStatus;
  isPTTActive: boolean;
  setIsPTTActive: (active: boolean) => void;
  isAudioPlaybackEnabled: boolean;
  setIsAudioPlaybackEnabled: (enabled: boolean) => void;
}

export default function Settings({
  sessionStatus,
  isPTTActive,
  setIsPTTActive,
  isAudioPlaybackEnabled,
  setIsAudioPlaybackEnabled
}: SettingsProps) {
  const isConnected = sessionStatus === "CONNECTED";

  return (
    <div className="p-6 bg-background">
      <h2 className="text-xl font-semibold mb-6 text-[var(--text-primary)]">Settings</h2>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-[var(--text-primary)]">Voice Controls</h3>
          
          <div className="flex items-center gap-3">
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
              className={`${
                isConnected ? "cursor-pointer text-[var(--text-primary)]" : "cursor-not-allowed text-[var(--text-disabled)]"
              }`}
            >
              Enable Push to Talk
            </label>
          </div>

          <div className="flex items-center gap-3">
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
              className={`${
                isConnected ? "cursor-pointer text-[var(--text-primary)]" : "cursor-not-allowed text-[var(--text-disabled)]"
              }`}
            >
              Enable Audio Playback
            </label>
          </div>
        </div>

        {!isConnected && (
          <p className="text-sm text-[var(--text-secondary)]">
            Note: Voice controls are only available when connected to a session.
          </p>
        )}
      </div>
    </div>
  );
} 