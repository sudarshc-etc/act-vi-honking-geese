"use client";

import { useEffect, useState } from "react";
import CustomPhasesSlider from "../CustomPhasesSlider";
import OpenAIWebRTC from "../OpenAIWebRTC";

export default function DatingShow() {
  const [benPhase, setBenPhase] = useState("happy");
  const [alicePhase, setAlicePhase] = useState("happy");

  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  // Capture mic ONCE
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(setMicStream)
      .catch(console.error);
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <h1 className="m-3 flex justify-center font-bold text-heading md:text-5xl lg:text-6xl">
        <span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">The Geese Matchmaking Show</span>
      </h1>
      <div className="grid md:grid-cols-2 gap-6 p-6">
        {/* Ben */}
        <div className="p-10 border-4 border-gray-500">
          <CustomPhasesSlider
            pirticipantName="Ben"
            onPhaseChange={setBenPhase}
          />
          <OpenAIWebRTC
            mode="datingshow"
            participantIndex={0}
            currentPersonality="Ben"
            unlockedPersonalities={["Ben"]}
            currentEmotion={benPhase}
            storyPhase="intro"
            globalTension={0}
            chaosMeter={0}
            stream={micStream}
            systemEvent={null}
            onPersonalityChange={() => {}}
            onTensionChange={() => {}}
            onChaosChange={() => {}}
            onLieDetected={() => {}}
            onLieStateChange={() => {}}
            onPersonalityUnlock={() => {}}
          />
        </div>

        {/* Alice */}
        <div className="p-10 border-4 border-gray-500">
          <CustomPhasesSlider
            pirticipantName="Alice"
            onPhaseChange={setAlicePhase}
          />
          <OpenAIWebRTC
            mode="datingshow"
            participantIndex={0}
            currentPersonality="Alice"
            unlockedPersonalities={["Alice"]}
            currentEmotion={alicePhase}
            storyPhase="intro"
            globalTension={0}
            chaosMeter={0}
            stream={micStream}
            systemEvent={null}
            onPersonalityChange={() => {}}
            onTensionChange={() => {}}
            onChaosChange={() => {}}
            onLieDetected={() => {}}
            onLieStateChange={() => {}}
            onPersonalityUnlock={() => {}}
          />
        </div>
      </div>

    </div>
  );
}