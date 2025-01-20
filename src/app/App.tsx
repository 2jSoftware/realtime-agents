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
import { allAgentSets, defaultAgentSetKey } from "@/app/agentConfigs";

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
    setSelectedAgentConfigSet(allAgentSets[newAgentSetKey]);
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
    <div className="text-base flex flex-col h-screen bg-gray-100 text-gray-800 relative">
      <div className="p-5 text-lg font-semibold flex justify-between items-center">
        <div className="flex items-center">
          <div onClick={() => window.location.reload()} style={{ cursor: 'pointer' }}>
            <Image
              src="/deepseek-logo.svg"
              alt="DeepSeek Logo"
              width={20}
              height={20}
              className="mr-2"
            />
          </div>
          <div>
            DeepSeek <span className="text-gray-500">Business Assistant</span>
          </div>
        </div>
        <div className="flex items-center">
          <label className="flex items-center text-base gap-1 mr-2 font-medium">
            Scenarios
          </label>
          <div className="relative inline-block">
            <select
              value={agentSetKey}
              onChange={handleAgentChange}
              className="appearance-none border border-gray-300 rounded-lg text-base px-2 py-1 pr-8 cursor-pointer font-normal focus:outline-none"
            >
              <option value="newsAnalysis">News Analysis</option>
              <option value="marketResearch">Market Research</option>
              <option value="competitorAnalysis">Competitor Analysis</option>
              <option value="businessStrategy">Business Strategy</option>
              <option value="trendAnalysis">Trend Analysis</option>
              <option value="financialReports">Financial Reports</option>
              <option value="productResearch">Product Research</option>
              <option value="customerFeedback">Customer Feedback</option>
            </select>
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
