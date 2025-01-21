"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";

// UI components
import Transcript from "./components/Transcript";
import Events from "./components/Events";
import BottomToolbar from "./components/BottomToolbar";
import Analytics from "./components/Analytics";
import Settings from "./components/Settings";

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
import { analyticsLogger } from "./lib/analyticsLogger";

export type DelegationMode = 'manual' | 'auto';

type TabType = 'chat' | 'analytics' | 'settings';

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
  const [delegationMode, setDelegationMode] = useState<DelegationMode>('manual');
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  
  // Managers
  const connectionRef = useRef<ConnectionManager | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  
  // Audio interaction states
  const [isPTTActive, setIsPTTActive] = useState<boolean>(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState<boolean>(false);
  const [isAudioPlaybackEnabled, setIsAudioPlaybackEnabled] = useState<boolean>(true);
  const [isEventsPaneExpanded, setIsEventsPaneExpanded] = useState<boolean>(true);

  const handleAgentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (delegationMode === 'auto') {
      const suggestions = analyticsLogger.getDelegationSuggestions();
      
      // Require extremely high confidence and multiple supporting factors
      const hasHighConfidence = suggestions.confidence > 0.95;
      const hasMultipleReasons = suggestions.reasoning.length >= 3;
      const hasContextMatch = Object.values(suggestions.contextMatch).every(score => score > 0.9);
      
      if (!hasHighConfidence || !hasMultipleReasons || !hasContextMatch) {
        logClientEvent({ 
          type: "agent_change_rejected",
          reason: "Insufficient confidence for auto-delegation",
          details: {
            confidence: suggestions.confidence,
            reasonCount: suggestions.reasoning.length,
            contextMatch: suggestions.contextMatch
          }
        });
        return;
      }
    }

    const newAgentSetKey = event.target.value;
    
    // If the new agent is the same as the current one, do nothing
    if (newAgentSetKey === agentSetKey) {
      return;
    }
    
    // Find the agent set from the categories
    let newAgentSet = null;
    for (const category of Object.values(agentCategories)) {
      const agent = Object.values(category).find(a => a.key === newAgentSetKey);
      if (agent) {
        newAgentSet = allAgentSets[newAgentSetKey as keyof typeof allAgentSets];
        break;
      }
    }
    
    if (!newAgentSet) {
      console.error(`Agent set ${newAgentSetKey} not found`);
      return;
    }
    
    // Disconnect current session if connected
    if (sessionStatus === "CONNECTED") {
      handleDisconnect();
    }
    
    setSelectedAgentConfigSet(newAgentSet);
    
    // Set the agent name from the first agent in the set
    const firstAgent = newAgentSet[0];
    if (firstAgent) {
      setSelectedAgentName(firstAgent.name);
      
      // Update analytics with new agent context
      analyticsLogger.setCurrentAgent(firstAgent);
      
      // Log outcome projection for the new agent
      analyticsLogger.addOutcomeProjection({
        immediateGoal: "Initialize new agent interaction",
        contextualGoals: [firstAgent.publicDescription],
        requiredCapabilities: ["agent_initialization", "context_awareness"],
        successCriteria: {
          primary: ["Successful connection", "Relevant responses"],
          secondary: ["Goal alignment"],
          metrics: {
            responseTime: "immediate",
            contextMatch: "high"
          }
        },
        riskFactors: [{
          type: "context_transition",
          likelihood: "low",
          impact: "medium",
          mitigationStrategy: "Clear initialization and goal setting"
        }],
        delegationHints: {
          suggestedAgents: [],
          reasoning: ["Initial agent selection"],
          confidenceScore: 1.0
        }
      });
      
      // Auto-connect with the new agent after a short delay
      setTimeout(() => {
        handleConnect();
      }, 100);
    }
    
    logClientEvent({ 
      type: "agent_set_changed", 
      agentSetKey: newAgentSetKey,
      agentName: firstAgent?.name 
    });
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

  const handleSendMessage = useCallback(async () => {
    if (!userText.trim() || !connectionRef.current?.isConnected) return;

    const messageId = crypto.randomUUID();
    addTranscriptMessage({
      itemId: messageId,
      role: "user",
      content: userText,
      isHidden: false
    });

    logClientEvent({
      type: "USER_MESSAGE_SENT",
      data: { messageId, content: userText },
    });

    try {
      await connectionRef.current.sendMessage(userText);
      updateTranscriptItemStatus(messageId, "DONE");
    } catch (error) {
      console.error("Failed to send message:", error);
      updateTranscriptItemStatus(messageId, "DONE");
      logClientEvent({
        type: "USER_MESSAGE_ERROR",
        data: { messageId, error: String(error) },
      });
    }

    setUserText("");
  }, [userText, connectionRef, addTranscriptMessage, updateTranscriptItemStatus, logClientEvent]);

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

  // Find current agent set key
  const getCurrentAgentSetKey = () => {
    if (!selectedAgentConfigSet) return agentSetKey;
    
    for (const [category, agents] of Object.entries(agentCategories)) {
      for (const [key, agent] of Object.entries(agents)) {
        if (allAgentSets[key as keyof typeof allAgentSets] === selectedAgentConfigSet) {
          return key;
        }
      }
    }
    return agentSetKey;
  };

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
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={getCurrentAgentSetKey()}
                onChange={handleAgentChange}
                className="appearance-none bg-background border border-[var(--border)] rounded-lg text-base px-4 py-2 pr-10 cursor-pointer font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[300px]"
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
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--text-secondary)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex border border-[var(--border)] rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 text-sm transition-colors ${
                activeTab === 'chat' 
                  ? 'bg-[var(--bubble-bg)] text-[var(--text-primary)]' 
                  : 'hover:bg-[var(--bubble-bg)] text-[var(--text-secondary)]'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-sm transition-colors ${
                activeTab === 'analytics' 
                  ? 'bg-[var(--bubble-bg)] text-[var(--text-primary)]' 
                  : 'hover:bg-[var(--bubble-bg)] text-[var(--text-secondary)]'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 text-sm transition-colors ${
                activeTab === 'settings' 
                  ? 'bg-[var(--bubble-bg)] text-[var(--text-primary)]' 
                  : 'hover:bg-[var(--bubble-bg)] text-[var(--text-secondary)]'
              }`}
            >
              Settings
            </button>
          </div>
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
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full flex">
            <div className="flex-1 p-4">
              <Transcript
                userText={userText}
                setUserText={setUserText}
                onSendMessage={handleSendMessage}
                canSend={sessionStatus === "CONNECTED"}
                isPTTActive={isPTTActive}
                isPTTUserSpeaking={isPTTUserSpeaking}
                handleTalkButtonDown={handleTalkButtonDown}
                handleTalkButtonUp={handleTalkButtonUp}
              />
            </div>
            <div className="w-96 border-l border-[var(--border)]">
              <div className="h-full p-4 overflow-y-auto">
                <Events isExpanded={true} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="h-full p-4">
            <Analytics 
              isExpanded={true}
              delegationMode={delegationMode}
              onDelegationModeChange={setDelegationMode}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="h-full p-4">
            <Settings
              sessionStatus={sessionStatus}
              isPTTActive={isPTTActive}
              setIsPTTActive={setIsPTTActive}
              isAudioPlaybackEnabled={isAudioPlaybackEnabled}
              setIsAudioPlaybackEnabled={setIsAudioPlaybackEnabled}
            />
          </div>
        )}
      </div>

      <BottomToolbar
        sessionStatus={sessionStatus}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isEventsPaneExpanded={isEventsPaneExpanded}
        setIsEventsPaneExpanded={setIsEventsPaneExpanded}
      />
    </div>
  );
}

export default App;
