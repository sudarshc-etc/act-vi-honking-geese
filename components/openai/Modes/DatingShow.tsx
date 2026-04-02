"use client";

import { useEffect, useState } from "react";
import CustomPhasesSlider from "../CustomPhasesSlider";
import OpenAIIntegration from "../OpenAIIntegration";
import OpenAIWebRTC from "../OpenAIWebRTC";

export default function DatingShow() {
  const [simbaPhase, setSimbaPhase] = useState("happy");
  const [nalaPhase, setNalaPhase] = useState("happy");

  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  // Capture mic ONCE
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(setMicStream)
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="m-3 flex justify-center font-bold text-heading md:text-5xl lg:text-6xl">
        <span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">The Geese Matchmaking Show</span>
      </h1>
      <div className="grid md:grid-cols-2 gap-6 p-6">
        {/* SIMBA */}
        <div className="p-10 border-4 border-gray-500">
          <CustomPhasesSlider
            pirticipantName="Simba"
            onPhaseChange={setSimbaPhase}
          />
          <OpenAIWebRTC
            mode="datingshow"
            participantIndex={0}
            currentPersonality="Simba"
            unlockedPersonalities={["Simba"]}
            currentEmotion={simbaPhase}
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

        {/* NALA */}
        <div className="p-10 border-4 border-gray-500">
          <CustomPhasesSlider
            pirticipantName="Nala"
            onPhaseChange={setNalaPhase}
          />
          <OpenAIWebRTC
            mode="datingshow"
            participantIndex={0}
            currentPersonality="Nala"
            unlockedPersonalities={["Nala"]}
            currentEmotion={nalaPhase}
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