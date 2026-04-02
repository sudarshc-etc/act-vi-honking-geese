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
        <div>
        
            <h1 className="text-4xl font-black mb-8 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-600">
                Late Night Talkshow with Alice
            </h1>
            
            <div className="w-full max-w-md bg-[#0f1115] p-8 rounded-2xl border border-fuchsia-900/50 shadow-[0_0_30px_rgba(192,38,211,0.15)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500"></div>
                <OpenAIWebRTC
                    mode="talkshow"
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