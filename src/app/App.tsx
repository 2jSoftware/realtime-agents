"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";

// UI components
import Transcript from "./components/Transcript";
import Events from "./components/Events";
import BottomToolbar from "./components/BottomToolbar";

// Types
import { AgentConfig, SessionStatus } from "@/app/types";

// Context providers & hooks
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";

// Agent configs
import { allAgentSets, defaultAgentSetKey, agentCategories } from "@/app/agentConfigs";

// Managers
import { createRealtimeConnection } from "./lib/realtimeConnection";
import { createAudioManager } from "./lib/audioManager";
import type { ConnectionManager } from "./lib/realtimeConnection";
import type { AudioManager } from "./lib/audioManager";

function App() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <AppContent />
    </React.Suspense>
  );
}

function AppContent() {
  const searchParams = useSearchParams();
  const { transcriptItems, addTranscriptMessage, updateTranscriptMessage, updateTranscriptItemStatus } = useTranscript();
  const { logClientEvent } = useEvent();

  const [selectedAgentName, setSelectedAgentName] = useState<string>("");
  const [selectedAgentConfigSet, setSelectedAgentConfigSet] = useState<AgentConfig[] | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("DISCONNECTED");
  const [userText, setUserText] = useState<string>("");
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  // Managers
  const connectionRef = useRef<ConnectionManager | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  
  // Audio interaction states
  const [isPTTActive, setIsPTTActive] = useState<boolean>(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState<boolean>(false);
  const [isAudioPlaybackEnabled, setIsAudioPlaybackEnabled] = useState<boolean>(true);
  const [isEventsPaneExpanded, setIsEventsPaneExpanded] = useState<boolean>(true);

  const handleAgentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newAgentSetKey = event.target.value;
    const newAgentSet = allAgentSets[newAgentSetKey];
    
    // Disconnect current session if connected
    if (sessionStatus === "CONNECTED") {
      handleDisconnect();
    }
    
    setSelectedAgentConfigSet(newAgentSet);
    setSelectedAgentName(newAgentSet[0]?.name || "");
    
    // Auto-connect with the new agent
    setTimeout(() => {
      if (newAgentSet && newAgentSet.length > 0) {
        handleConnect();
      }
    }, 100);
    
    logClientEvent({ type: "agent_set_changed", agentSetKey: newAgentSetKey });
  };

  const handleConnect = async () => {
    try {
      setSessionStatus("CONNECTING");
      
      // Get the current agent's system prompt
      const currentAgent = selectedAgentConfigSet?.find(agent => agent.name === selectedAgentName);
      const systemPrompt = currentAgent?.instructions || "You are a helpful AI assistant.";
      
      // Initialize managers with API key and system prompt
      const connection = createRealtimeConnection(
        "sk-aaa0a2708abf436dbe5d420bd36d68f5",
        systemPrompt
      );
      await connection.connect();
      connectionRef.current = connection;

      const audioManager = createAudioManager();
      audioManagerRef.current = audioManager;

      setSessionStatus("CONNECTED");
      logClientEvent({ type: "connection.established" });
    } catch (error) {
      console.error("Connection error:", error);
      setSessionStatus("DISCONNECTED");
      logClientEvent({ type: "connection.error", error });
    }
  };

  const handleDisconnect = () => {
    if (connectionRef.current) {
      connectionRef.current.disconnect();
      connectionRef.current = null;
    }
    if (audioManagerRef.current?.isRecording) {
      audioManagerRef.current.stopRecording();
    }
    if (audioManagerRef.current?.isPlaying) {
      audioManagerRef.current.stopPlayback();
    }
    audioManagerRef.current = null;
    setSessionStatus("DISCONNECTED");
    logClientEvent({ type: "connection.closed" });
  };

  const handleSendMessage = async () => {
    if (!userText.trim() || !connectionRef.current?.isConnected) return;

    const messageId = uuidv4();
    addTranscriptMessage({
      itemId: messageId,
      role: "user",
      content: userText
    });

    try {
      const response = await connectionRef.current.sendMessage(userText);
      const assistantMessageId = uuidv4();
      const assistantContent = response.choices[0].message.content;
      
      addTranscriptMessage({
        itemId: assistantMessageId,
        role: "assistant",
        content: assistantContent
      });
      
      updateTranscriptItemStatus(assistantMessageId, "DONE");
      logClientEvent({ type: "message.sent", messageId });

    } catch (error) {
      console.error("Message error:", error);
      addTranscriptMessage({
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      });
      logClientEvent({ type: "message.error", error });
    }

    setUserText("");
  };

  const handleTalkButtonDown = async () => {
    if (!connectionRef.current?.isConnected || !audioManagerRef.current) return;
    
    try {
      await audioManagerRef.current.startRecording();
      setIsPTTUserSpeaking(true);
      logClientEvent({ type: "ptt.start" });
    } catch (error) {
      console.error("Recording error:", error);
      logClientEvent({ type: "ptt.error", error });
    }
  };

  const handleTalkButtonUp = async () => {
    if (!connectionRef.current?.isConnected || !isPTTUserSpeaking || !audioManagerRef.current) return;
    
    try {
      const audioBlob = await audioManagerRef.current.stopRecording();
      setIsPTTUserSpeaking(false);
      logClientEvent({ type: "ptt.end" });

      // Convert audio to text using the speech-to-text service
      try {
        // TODO: Replace with actual speech-to-text API call
        // For now, we'll just show a message that PTT is not yet implemented
        addTranscriptMessage({
          itemId: uuidv4(),
          role: "system",
          content: "Push-to-talk feature is not yet implemented. Please use text input."
        });
      } catch (error) {
        console.error("Speech-to-text error:", error);
        logClientEvent({ type: "speech.to.text.error", error });
      }
    } catch (error) {
      console.error("Recording stop error:", error);
      logClientEvent({ type: "ptt.error", error });
    }
  };

  useEffect(() => {
    const storedPTT = localStorage.getItem("pushToTalkUI");
    if (storedPTT) setIsPTTActive(storedPTT === "true");

    const storedLogs = localStorage.getItem("logsExpanded");
    if (storedLogs) setIsEventsPaneExpanded(storedLogs === "true");

    const storedAudio = localStorage.getItem("audioPlaybackEnabled");
    if (storedAudio) setIsAudioPlaybackEnabled(storedAudio === "true");

    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pushToTalkUI", isPTTActive.toString());
  }, [isPTTActive]);

  useEffect(() => {
    localStorage.setItem("logsExpanded", isEventsPaneExpanded.toString());
  }, [isEventsPaneExpanded]);

  useEffect(() => {
    localStorage.setItem("audioPlaybackEnabled", isAudioPlaybackEnabled.toString());
  }, [isAudioPlaybackEnabled]);

  const updateTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    updateTheme(newTheme);
  };

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    updateTheme(initialTheme);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionRef.current?.isConnected) {
        connectionRef.current.disconnect();
      }
      if (audioManagerRef.current?.isRecording) {
        audioManagerRef.current.stopRecording();
      }
      if (audioManagerRef.current?.isPlaying) {
        audioManagerRef.current.stopPlayback();
      }
    };
  }, []);

  const agentSetKey = searchParams.get("agentConfig") || defaultAgentSetKey;

  return (
    <div className="text-base flex flex-col h-screen bg-background text-foreground relative">
      <div className="p-5 text-lg font-semibold flex justify-between items-center bg-background border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div onClick={() => window.location.reload()} style={{ cursor: 'pointer' }}>
            <Image
              src="/deepseek-logo.svg"
              alt="2jSoftware Logo"
              width={24}
              height={24}
              className="mr-2"
            />
          </div>
          <div>
            2jSoftware <span className="text-secondary">Business Assistant</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="theme-toggle" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            )}
          </button>
          <div className="flex items-center gap-3">
            <label className="flex items-center text-base gap-2 font-medium text-foreground">
              Scenarios
            </label>
            <div className="relative">
              <select
                value={agentSetKey}
                onChange={handleAgentChange}
                className="appearance-none bg-background border border-gray-600 rounded-lg text-base px-4 py-2 pr-10 cursor-pointer font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[300px]"
              >
                {Object.entries(agentCategories).map(([category, agents]) => (
                  <optgroup key={category} label={category}>
                    {Object.values(agents).map((agent) => (
                      <option key={agent.key} value={agent.key} title={agent.description}>
                        {agent.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 p-4">
          <Transcript
            userText={userText}
            setUserText={setUserText}
            onSendMessage={handleSendMessage}
            canSend={sessionStatus === "CONNECTED"}
          />
        </div>
        <div className="w-96 border-l border-gray-200 p-4 overflow-y-auto">
          <Events isExpanded={isEventsPaneExpanded} />
        </div>
      </div>

      <BottomToolbar
        sessionStatus={sessionStatus}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isPTTActive={isPTTActive}
        setIsPTTActive={setIsPTTActive}
        isPTTUserSpeaking={isPTTUserSpeaking}
        handleTalkButtonDown={handleTalkButtonDown}
        handleTalkButtonUp={handleTalkButtonUp}
        isEventsPaneExpanded={isEventsPaneExpanded}
        setIsEventsPaneExpanded={setIsEventsPaneExpanded}
        isAudioPlaybackEnabled={isAudioPlaybackEnabled}
        setIsAudioPlaybackEnabled={setIsAudioPlaybackEnabled}
      />
    </div>
  );
}

export default App;
