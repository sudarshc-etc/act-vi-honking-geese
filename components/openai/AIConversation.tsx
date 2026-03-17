"use client";

import { useRef, useEffect } from "react";
import AItoAIConversation from "./AItoAIConversation";
import { AIAgentHandle } from "./AIAgentHandle";

export default function AIConversationController() {
  const simbaRef = useRef<AIAgentHandle>(null);
  const nalaRef = useRef<AIAgentHandle>(null);

  let lastSpeaker: "simba" | "nala" | null = null;

  const handleSimbaMessage = (text: string) => {
    if (lastSpeaker === "simba") return;
    lastSpeaker = "simba";
    nalaRef.current?.interrupt();
    setTimeout(() => {
      nalaRef.current?.sendMessage(text);
      lastSpeaker = null;
    }, 700);
  };

  const handleNalaMessage = (text: string) => {
    if (lastSpeaker === "nala") return;
    lastSpeaker = "nala";
    simbaRef.current?.interrupt();
    setTimeout(() => {
      simbaRef.current?.sendMessage(text);
      lastSpeaker = null;
    }, 700);
  };

  return (
    <div className="flex flex-col">
      <button
        onClick={() => {
          simbaRef.current?.startSession();
          nalaRef.current?.startSession();
        }}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Start AI Conversation
      </button>
      <AItoAIConversation ref={simbaRef} gooseName="Simba" phase="excited" onMessage={handleSimbaMessage} />
      <AItoAIConversation ref={nalaRef} gooseName="Nala" phase="calm" onMessage={handleNalaMessage} />
    </div>
  );
}