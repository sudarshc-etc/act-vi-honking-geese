"use client";

import { useEffect, useState } from "react";
import OpenAIWebRTC from "../OpenAIWebRTC";

export default function TalkShow(){
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
        
            <h1 className="text-4xl font-black mb-8 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-600">
                Late Night Talkshow with Lexi
            </h1>
            
            <div className="w-full max-w-md bg-[#0f1115] p-8 rounded-2xl border border-green-900/50 shadow-[0_0_30px_rgba(192,38,211,0.15)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                <OpenAIWebRTC
                    mode="talkshow"
                    participantIndex={0}
                    currentPersonality="Lexi"
                    unlockedPersonalities={["Lexi"]}
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