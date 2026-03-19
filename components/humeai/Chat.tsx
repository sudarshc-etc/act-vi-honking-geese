"use client";

import { useEffect, useState } from "react";
import HumeWebSocketCall from "./HumeWebSocketCall";

export default function Chat({
  accessToken,
}: {
  accessToken: string;
}) {
  const [globalTension, setGlobalTension] = useState(0); 
  const [chaosMeter, setChaosMeter] = useState(0);
  const [systemEvent, setSystemEvent] = useState<{type: string, prompt: string, timestamp: number} | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(setMicStream)
      .catch(console.error);
  }, []);

  const handleSlamButton = () => {
    setGlobalTension(100);
    setChaosMeter(prev => Math.min(prev + 25, 100));
    setSystemEvent({
      type: "slam",
      prompt: "The user just violently slammed a heavy button on the table. Stop your current sentence and react with extreme shock or anger.",
      timestamp: Date.now()
    });
  };

  const handlePickUpProp = () => {
    setSystemEvent({
      type: "prop",
      prompt: "The user just picked up a highly sensitive document from the table. You are forced to talk about this document immediately.",
      timestamp: Date.now()
    });
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-5 font-sans">
      <h1 className="m-3 flex justify-center font-bold text-heading md:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">
        The Geese Matchmaking Show (Drama Manager)
      </h1>
      
      <div className="flex justify-center gap-8 mb-6 mt-6 bg-gray-800 p-4 rounded-lg border border-gray-700 w-fit mx-auto shadow-lg">
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

      <div className="flex justify-center gap-6 mb-10">
        <button 
          onClick={handleSlamButton} 
          className="bg-red-600 hover:bg-red-500 text-white p-4 text-xl font-black rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.7)] active:scale-95 transition-transform"
        >
          🚨 SLAM BUTTON
        </button>
        <button 
          onClick={handlePickUpProp} 
          className="bg-yellow-600 hover:bg-yellow-500 text-white p-4 text-xl font-bold rounded-lg shadow-lg active:scale-95 transition-transform"
        >
          📄 PICK UP PROP
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 content-evenly max-w-7xl mx-auto">
        <div className="p-8 border-4 border-sky-500 rounded-2xl bg-gray-800 shadow-[0_0_20px_rgba(14,165,233,0.3)]">
          <h2 className="text-3xl font-bold mb-4 text-sky-400">Simba</h2>
          <HumeWebSocketCall 
            gooseName="Simba" 
            accessToken={accessToken} 
            systemEvent={systemEvent}
            onUpdateTension={setGlobalTension}
          />
        </div>
        <div className="p-8 border-4 border-pink-500 rounded-2xl bg-gray-800 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
          <h2 className="text-3xl font-bold mb-4 text-pink-400">Nala</h2>
          <HumeWebSocketCall 
            gooseName="Nala" 
            accessToken={accessToken} 
            systemEvent={systemEvent}
            onUpdateTension={setGlobalTension}
          />
        </div>
      </div>
    </div>
  );
}