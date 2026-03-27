"use client";

import { useEffect, useState } from "react";
import CustomPhasesSlider from "./CustomPhasesSlider";
import OpenAIIntegration from "./OpenAIIntegration";

type GameMode = "menu" | "interrogation" | "playtest";

export default function Chat() {
  const [appMode, setAppMode] = useState<GameMode>("menu");
  
  const [globalTension, setGlobalTension] = useState(0); 
  const [chaosMeter, setChaosMeter] = useState(0);
  const [storyPhase, setStoryPhase] = useState<"intro" | "suspicious" | "climax">("intro");
  const [systemEvent, setSystemEvent] = useState<{type: string, prompt: string, timestamp: number} | null>(null);
  const [emotion1, setEmotion1] = useState("happy");
  const [unlockedPersonalities, setUnlockedPersonalities] = useState<string[]>(["Arthur"]);
  const [currentPersonality, setCurrentPersonality] = useState("Arthur");
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [clue, setClue] = useState<string | null>(null);
  const [isLying, setIsLying] = useState(false);
  const [lieCount, setLieCount] = useState(0);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(setMicStream).catch();
  }, []);

  useEffect(() => {
    if (globalTension >= 40 && globalTension < 80 && storyPhase === "intro") setStoryPhase("suspicious");
    if (globalTension >= 80 && storyPhase === "suspicious") setStoryPhase("climax");
  }, [globalTension, storyPhase]);

  useEffect(() => {
    if (appMode !== "interrogation") return;
    
    setClue(null);
    let timer: NodeJS.Timeout;

    if (!unlockedPersonalities.includes("Lily")) {
      if (lieCount >= 1) {
        setClue("FORENSIC REPORT: A bloody [toy] or [teddy bear] was found at the scene. He's reacting to this.");
      }
    } else if (!unlockedPersonalities.includes("The Architect")) {
      if (currentPersonality === "Lily") {
        timer = setTimeout(() => {
          setClue("PSYCH EVAL: She mentions a man who builds things. A [designer] or [architect]. Call him out.");
        }, 8000);
      } else if (currentPersonality === "Arthur" && lieCount >= 3) {
        setClue("PSYCH EVAL: Suspect exhibits a God-complex. Mentions of being an [architect] trigger him.");
      }
    }

    return () => clearTimeout(timer);
  }, [lieCount, unlockedPersonalities, currentPersonality, appMode]);

  const handleSlamButton = () => {
    setSystemEvent({
      type: "slam",
      prompt: "The user just violently slammed a heavy button on the table! Stop what you are doing and react with extreme shock or anger right now!",
      timestamp: Date.now()
    });
  };

  const handlePersonalityUnlock = (persona: string) => {
    if (!unlockedPersonalities.includes(persona)) {
      setUnlockedPersonalities((prev: string[]) => [...prev, persona]);
      setCurrentPersonality(persona);
      setSystemEvent({
        type: "switch",
        prompt: `The user triggered a keyword! YOU ARE NOW ${persona.toUpperCase()}!`,
        timestamp: Date.now()
      });
    }
  };

  const getPolygraphStyle = () => {
    if (currentPersonality === "The Architect") return "bg-purple-900/30 text-purple-500 border-purple-900";
    if (currentPersonality === "Lily") return "bg-sky-900/20 text-sky-400 border-sky-900";
    if (isLying) return "bg-red-900/50 text-red-500 border-red-700 animate-pulse";
    return "bg-emerald-900/20 text-emerald-500 border-emerald-900";
  };

  const getPolygraphText = () => {
    if (currentPersonality === "The Architect") return "HEART RATE: ABNORMALLY CALM";
    if (currentPersonality === "Lily") return "HEART RATE: PURE / FLATLINE";
    if (isLying) return "WARNING: DECEPTION DETECTED";
    return "HEART RATE: STABLE";
  };

  // --- 1. Main Menu Interface ---
  if (appMode === "menu") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-white p-6">
        <h1 className="text-5xl font-black mb-12 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-pink-500">
          SELECT MODE
        </h1>
        <div className="flex flex-col gap-6 w-full max-w-sm">
          <button 
            onClick={() => { setAppMode("interrogation"); setCurrentPersonality("Arthur"); }}
            className="w-full py-4 bg-sky-900/30 border border-sky-500 hover:bg-sky-600 rounded-lg text-sky-100 font-black uppercase tracking-widest transition-all hover:scale-105"
          >
            🕵️‍♂️ Interrogation
          </button>
          <button 
            onClick={() => { setAppMode("playtest"); setCurrentPersonality("Alice"); }}
            className="w-full py-4 bg-fuchsia-900/30 border border-fuchsia-500 hover:bg-fuchsia-600 rounded-lg text-fuchsia-100 font-black uppercase tracking-widest transition-all hover:scale-105"
          >
            🛸 Playtest: Alice
          </button>
        </div>
      </div>
    );
  }

  // --- 2. Pure Playtest Interface ---
  if (appMode === "playtest") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-white p-6 relative">
        <button 
          onClick={() => setAppMode("menu")}
          className="absolute top-6 left-6 text-gray-500 hover:text-white font-bold uppercase tracking-widest text-sm"
        >
          ← Back to Menu
        </button>
        
        <h1 className="text-4xl font-black mb-8 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-600">
          PLAYTEST: ALICE
        </h1>
        
        <div className="w-full max-w-md bg-[#0f1115] p-8 rounded-2xl border border-fuchsia-900/50 shadow-[0_0_30px_rgba(192,38,211,0.15)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500"></div>
          <OpenAIIntegration
            mode="playtest"
            participantIndex={0}
            currentPersonality="Alice"
            unlockedPersonalities={["Alice"]}
            currentEmotion="happy"
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
    );
  }

  // --- 3. Official Interrogation Interface ---
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="p-6 max-w-7xl mx-auto flex justify-between items-center border-b border-gray-800">
        <div>
          <button onClick={() => setAppMode("menu")} className="text-gray-500 hover:text-white font-bold uppercase tracking-widest text-xs mb-2 block">← Back to Menu</button>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-pink-500">INTERROGATION ROOM</h1>
        </div>
        <button onClick={handleSlamButton} className="bg-red-600 hover:bg-red-500 text-white font-black px-6 py-3 rounded-lg border border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.7)]">🚨 SLAM TABLE</button>
      </div>

      <div className="max-w-4xl mx-auto mt-6 px-6">
        <div className={`w-full p-4 rounded-lg border flex items-center justify-center h-16 transition-all duration-300 ${getPolygraphStyle()}`}>
          <span className="font-black tracking-widest uppercase">{getPolygraphText()}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-4 px-6">
        {clue && (
          <div className="bg-yellow-900/30 border-l-4 border-yellow-500 p-4 text-yellow-400 font-mono text-sm tracking-wider shadow-[0_0_20px_rgba(234,179,8,0.15)] animate-pulse">
            <span className="font-black mr-2">SYSTEM CLUE:</span> {clue}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-1 gap-6 p-6 max-w-4xl mx-auto">
        <div className="p-8 border border-gray-800 rounded-2xl bg-[#0f1115] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-sky-500"></div>
          <OpenAIIntegration
            mode="interrogation"
            participantIndex={0}
            currentPersonality={currentPersonality}
            unlockedPersonalities={unlockedPersonalities}
            currentEmotion={emotion1}
            storyPhase={storyPhase}
            globalTension={globalTension}
            chaosMeter={chaosMeter}
            stream={micStream}
            systemEvent={systemEvent}
            onPersonalityChange={setCurrentPersonality}
            onTensionChange={(amt: number) => setGlobalTension((p: number) => Math.min(p + amt, 100))}
            onChaosChange={(amt: number) => setChaosMeter((p: number) => Math.min(p + amt, 100))}
            onLieDetected={() => setLieCount((p: number) => p + 1)}
            onLieStateChange={setIsLying}
            onPersonalityUnlock={handlePersonalityUnlock}
          />
          <CustomPhasesSlider participantLabel={currentPersonality} onPhaseChange={setEmotion1} isParticipant1={true} />
        </div>
      </div>
    </div>
  );
}