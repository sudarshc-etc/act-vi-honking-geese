"use client";

import { useEffect, useState } from "react";
import CustomPhasesSlider from "./CustomPhasesSlider";
import OpenAIIntegration from "./OpenAIIntegration";

export default function Chat() {
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
        <span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">The Geese Matchmaking Show  (OpenAI Version).</span>
      </h1>
      <div className="grid md:grid-cols-2 gap-6 p-6">
        {/* SIMBA */}
        <div className="p-10 border-4 border-gray-500">
          <CustomPhasesSlider
            gooseName="Simba"
            onPhaseChange={setSimbaPhase}
          />
          <OpenAIIntegration
            gooseName="Simba"
            phase={simbaPhase}
            stream={micStream}
          />
        </div>

        {/* NALA */}
        <div className="p-10 border-4 border-gray-500">
          <CustomPhasesSlider
            gooseName="Nala"
            onPhaseChange={setNalaPhase}
          />
          <OpenAIIntegration
            gooseName="Nala"
            phase={nalaPhase}
            stream={micStream}
          />
        </div>
      </div>

    </div>
  );
}