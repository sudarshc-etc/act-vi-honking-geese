"use client";

import { useEffect, useState } from "react";
import CustomPhasesSlider from "./CustomPhasesSlider";
import OpenAIIntegration from "./OpenAIIntegration";

export default function Chat() {
  const [globalTension, setGlobalTension] = useState(0); 
  const [chaosMeter, setChaosMeter] = useState(0);
  
  // ADDED: System event state for Slam/Prop triggers
  const [systemEvent, setSystemEvent] = useState<{type: string, prompt: string, timestamp: number} | null>(null);

  const [simbaPhase, setSimbaPhase] = useState("happy");
  const [nalaPhase, setNalaPhase] = useState("happy");

  // ADDED: Role switching states
  const [role1, setRole1] = useState("Goose");
  const [role2, setRole2] = useState("Goose");

  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(setMicStream)
      .catch();
  }, []);

  // ADDED: Slam button logic
  const handleSlamButton = () => {
    setGlobalTension(100);
    setChaosMeter(prev => Math.min(prev + 25, 100));
    setSystemEvent({
      type: "slam",
      prompt: "The user just violently slammed a heavy button on the table! Stop what you are doing and react with extreme shock or anger right now!",
      timestamp: Date.now()
    });
  };

  // ADDED: Prop button logic
  const handlePickUpProp = () => {
    setSystemEvent({
      type: "prop",
      prompt: "The user just picked up a highly sensitive document from the table! You are forced to talk about this document immediately! Demand to know what they are holding!",
      timestamp: Date.now()
    });
  };

  return (
    <div className="bg-gray-950 min-h-screen text-white p-5 font-sans">
      <h1 className="m-3 flex justify-center font-black text-heading md:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
        OpenAI Improv Drama Show (v2)
      </h1>

      <div className="flex justify-center gap-8 mb-6 mt-6 bg-gray-900 p-4 rounded-lg border border-gray-700 w-fit mx-auto shadow-2xl">
        <div className="text-xl">
          <span className="text-gray-400">Global Tension: </span>
          <span className={`font-bold ${globalTension > 80 ? 'text-red-500' : 'text-yellow-400'}`}>
            {globalTension}/100
          </span>
        </div>
        <div className="text-xl">
          <span className="text-gray-400">Chaos Meter: </span>
          <span className="font-bold text-purple-400">{chaosMeter}/100</span>
        </div>
      </div>

      <div className="flex justify-center gap-6 mb-8">
        <button onClick={handleSlamButton} className="bg-red-600 hover:bg-red-500 text-white p-4 text-xl font-black rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.7)] active:scale-95 transition-transform">
          🚨 SLAM BUTTON
        </button>
        <button onClick={handlePickUpProp} className="bg-yellow-600 hover:bg-yellow-500 text-white p-4 text-xl font-bold rounded-lg shadow-lg active:scale-95 transition-transform">
          📄 PICK UP PROP
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 p-6 max-w-7xl mx-auto">
        <div className="p-8 border-4 border-sky-500 rounded-2xl bg-gray-900 shadow-[0_0_30px_rgba(14,165,233,0.3)]">
          {/* ADDED: Pass roles and events to Integration */}
          <OpenAIIntegration
            participantIndex={0}
            currentRole={role1}
            currentPhase={simbaPhase}
            stream={micStream}
            systemEvent={systemEvent}
            onRoleChange={setRole1}
          />
          <CustomPhasesSlider
            participantLabel={role1 === 'Goose' ? 'Simba' : (role1 === 'Policeman' ? 'Officer Davis' : 'Dr. Aris')}
            onPhaseChange={setSimbaPhase}
            isParticipant1={true}
          />
        </div>

        <div className="p-8 border-4 border-pink-500 rounded-2xl bg-gray-900 shadow-[0_0_30px_rgba(236,72,153,0.3)]">
          <OpenAIIntegration
            participantIndex={1}
            currentRole={role2}
            currentPhase={nalaPhase}
            stream={micStream}
            systemEvent={systemEvent}
            onRoleChange={setRole2}
          />
          <CustomPhasesSlider
            participantLabel={role2 === 'Goose' ? 'Nala' : (role2 === 'Policeman' ? 'Officer Chen' : 'Dr. Bennet')}
            onPhaseChange={setNalaPhase}
            isParticipant1={false}
          />
        </div>
      </div>
    </div>
  );
}