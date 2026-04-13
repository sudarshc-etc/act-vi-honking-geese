"use client";

import { useEffect, useState } from "react";
import OpenAIWebRTC from "../OpenAIWebRTC";

export default function InterrogationNegotiation(){
    const [micStream, setMicStream] = useState<MediaStream | null>(null);
    const [unlockedPersonalities, setUnlockedPersonalities] = useState<string[]>(["Dave","Abe"]);
    const [currentPersonality, setCurrentPersonality] = useState("Dave");
    const [systemEvent, setSystemEvent] = useState<{type: string, prompt: string, timestamp: number} | null>(null);

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

    // Capture mic ONCE
    useEffect(() => {
    navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(setMicStream)
        .catch(console.error);
    }, []);

    return (
        <div className="w-full flex flex-col items-center justify-center">
        
            <h1 className="text-4xl font-black mb-8 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-600">
                INTERROGATION NEGOTATION
            </h1>
            
            <div className="w-full max-w-md bg-[#0f1115] p-8 rounded-2xl border border-teal-900/50 shadow-[0_0_30px_rgba(192,38,211,0.15)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                <OpenAIWebRTC
                    mode="interrogation"
                    participantIndex={0}
                    currentPersonality={currentPersonality}
                    unlockedPersonalities={unlockedPersonalities}
                    currentEmotion="happy"
                    storyPhase="intro"
                    globalTension={0}
                    chaosMeter={0}
                    stream={micStream}
                    systemEvent={systemEvent}
                    onPersonalityChange={setCurrentPersonality}
                    onTensionChange={() => {}}
                    onChaosChange={() => {}}
                    onLieDetected={() => {}}
                    onLieStateChange={() => {}}
                    onPersonalityUnlock={handlePersonalityUnlock}
                />
            </div>
        </div>
    );
}