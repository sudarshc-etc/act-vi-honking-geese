"use client";

import { useEffect, useRef, useState } from "react";
import * as Prompts from "./OpenAIConstants";

export default function OpenAIIntegration({
  participantIndex,
  currentRole,
  currentPhase,
  stream,
  systemEvent,
  onRoleChange,
}: {
  participantIndex: number;
  currentRole: string;
  currentPhase: string;
  stream: MediaStream | null;
  systemEvent: {type: string, prompt: string, timestamp: number} | null;
  onRoleChange: (role: string) => void;
}) {
  const [callActive, setCallActive] = useState(false);
  const isParticipant1 = participantIndex === 0;
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // ADDED: Ref to track the 15s awkward silence interval
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  let activeButtonClass = isParticipant1
    ? "bg-linear-to-t from-sky-500 to-indigo-500"
    : "bg-linear-65 from-purple-500 to-pink-500";

  let labelColor = isParticipant1 ? 'text-sky-400' : 'text-pink-400';

  useEffect(() => {
    audioRef.current = document.createElement("audio");
    audioRef.current.autoplay = true;
    return () => {
      pcRef.current?.close();
      audioRef.current?.remove();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const getBasePrompt = (role: string) => {
    if (isParticipant1) {
      if (role === "Goose") return Prompts.SIMBA_GEESE_PROMPTS;
      if (role === "Policeman") return Prompts.OFFICER1_POLICEMAN_PROMPTS;
      if (role === "Doctor") return Prompts.DR_A_DOCTOR_PROMPTS;
    } else {
      if (role === "Goose") return Prompts.NALA_GEESE_PROMPTS;
      if (role === "Policeman") return Prompts.OFFICER2_POLICEMAN_PROMPTS;
      if (role === "Doctor") return Prompts.DR_B_DOCTOR_PROMPTS;
    }
    return Prompts.SIMBA_GEESE_PROMPTS;
  };

  // ADDED: Maps slider phase to extreme emotional instructions for the AI
  const getEmotionPrompt = (phase: string) => {
    switch (phase) {
      case 'happy':
        return "CURRENT EMOTION: EXTREMELY HAPPY AND OVERJOYED. Speak with extreme high energy, extreme joy, and fast pacing. Laugh often! Use very enthusiastic words and multiple exclamation marks!!!";
      case 'sad':
        return "CURRENT EMOTION: DEVASTATED AND WEEPING. Your voice is trembling, breaking, and weak. Speak very slowly and softly. Use ellipses (...) frequently to show hesitation, crying, and deep sorrow. Sound absolutely heartbroken.";
      case 'angry':
        return "CURRENT EMOTION: FURIOUS AND SCREAMING. You are completely enraged! Yell your words. Use short, aggressive sentences. USE ALL CAPS FOR EMPHASIS. Show zero patience and extreme hostility.";
      case 'confused':
        return "CURRENT EMOTION: DEEPLY CONFUSED AND LOST. You have no idea what is going on. Stutter slightly (e.g., 'W-wait... what?'). Ask heavily bewildered questions. Speak with a very hesitant, questioning tone.";
      case 'sarcastic':
        return "CURRENT EMOTION: EXTREMELY SARCASTIC AND CONDESCENDING. Mock the other person. Speak slowly with a dry, patronizing, and arrogant tone. Give exaggerated, fake praise. Be as passive-aggressive and snarky as possible.";
      default:
        return `CURRENT EMOTION: ${phase.toUpperCase()}. Strongly express this in your voice tone.`;
    }
  };

  const getCombinedInstructions = (role: string, phase: string, eventPrompt?: string) => {
    let instr = `${getBasePrompt(role)}\n\n--- CRITICAL INSTRUCTION ---\n${getEmotionPrompt(phase)}`;
    
    // ADDED: Forces short AI responses to prevent infinite monologue loops
    instr += "\n\nCRITICAL RULE: Keep your responses VERY SHORT (1 to 2 sentences maximum). Do NOT monologue. Stop talking quickly and wait for the other person to respond.";

    if (eventPrompt) {
      instr += `\n\n<context_event>URGENT SYSTEM OVERRIDE: ${eventPrompt}</context_event>`;
    }
    return instr;
  };

  const startSession = async () => {
    if (!stream || callActive) return;
    const pc = new RTCPeerConnection();
    pcRef.current = pc;
    pc.ontrack = (e) => { if (audioRef.current) audioRef.current.srcObject = e.streams[0]; };
    const dc = pc.createDataChannel("oai-events");
    dcRef.current = dc;

    dc.onopen = () => {
      dc.send(JSON.stringify({
        type: "session.update",
        session: { 
          voice: isParticipant1 ? Prompts.VOICE_1 : Prompts.VOICE_2,
          instructions: getCombinedInstructions(currentRole, currentPhase),
          input_audio_transcription: { model: "whisper-1" },
          
          // ADDED: Configures VAD threshold to ignore background noise and prevent false triggers
          turn_detection: {
            type: "server_vad",
            threshold: 0.6,
            prefix_padding_ms: 300,
            silence_duration_ms: 1000
          }
        }
      }));
    };

    dc.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // ADDED: Clear silence timer if user speaks or AI generates a new response
      if (data.type === "input_audio_buffer.speech_started" || data.type === "response.created") {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      }

      // ADDED: Start 15s timer after AI finishes speaking to trigger the awkward silence event
      if (data.type === "response.done") {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        
        if (data.response && data.response.output && data.response.output.length > 0) {
          silenceTimerRef.current = setTimeout(() => {
            if (dcRef.current?.readyState === "open") {
              dcRef.current.send(JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "message",
                  role: "user",
                  content: [{
                    type: "input_text",
                    text: "*SYSTEM EVENT: The user has remained completely silent for 5 seconds. React to this awkward silence immediately!*"
                  }]
                }
              }));
              dcRef.current.send(JSON.stringify({ type: "response.create" }));
            }
          }, 15000); 
        }
      }
    };

    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const sessionRes = await fetch("/api/openai/session", { method: "POST" });
    const session = await sessionRes.json();
    const answerRes = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.client_secret.value}`, "Content-Type": "application/sdp" },
      body: offer.sdp,
    });
    await pc.setRemoteDescription({ type: "answer", sdp: await answerRes.text() });
    setCallActive(true);
  };

  const endSession = () => {
    dcRef.current?.close();
    pcRef.current?.close();
    pcRef.current = null;
    dcRef.current = null;
    setCallActive(false);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };

  // ADDED: Intercepts system events (Slam/Prop) to cancel current speech and force immediate reaction
  useEffect(() => {
    if (!dcRef.current || !callActive || !systemEvent) return;
    if (dcRef.current.readyState !== "open") return;
    
    // ADDED: Hard interrupt AI speech and briefly mute audio to simulate an instant cut-off
    if (systemEvent.type === "slam") {
      dcRef.current.send(JSON.stringify({ type: "response.cancel" }));
      if (audioRef.current) audioRef.current.muted = true; 
      setTimeout(() => { if (audioRef.current) audioRef.current.muted = false; }, 100);
    }

    const currentCombined = getCombinedInstructions(currentRole, currentPhase, systemEvent.prompt);

    dcRef.current.send(JSON.stringify({
      type: "session.update",
      session: { instructions: currentCombined }
    }));

    // ADDED: Inject system event as user input and force immediate AI response
    dcRef.current.send(JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{
          type: "input_text",
          text: `*SYSTEM EVENT: ${systemEvent.prompt}*`
        }]
      }
    }));

    dcRef.current.send(JSON.stringify({ type: "response.create" }));

  }, [systemEvent, callActive, currentRole, currentPhase]);

  // ADDED: Dynamically updates the AI session instructions when role or emotion slider changes
  useEffect(() => {
    if (!dcRef.current || !callActive) return;
    if (dcRef.current.readyState !== "open") return;
    dcRef.current.send(JSON.stringify({
      type: "session.update",
      session: { instructions: getCombinedInstructions(currentRole, currentPhase) }
    }));
  }, [currentRole, currentPhase, callActive]);

  const roles = ["Goose", "Policeman", "Doctor"];

  return (
    <div className="flex flex-col gap-3 mb-5 p-4 bg-gray-800 rounded-xl border border-gray-700 Shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xl font-black ${labelColor}`}>Participant {participantIndex + 1} Role:</span>
        <div className="flex gap-2">
          {roles.map(r => (
            <button
              key={r}
              onClick={() => onRoleChange(r)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                currentRole === r 
                  ? (isParticipant1 ? 'bg-sky-600 text-white' : 'bg-pink-600 text-white')
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={startSession} disabled={callActive} className={`h-12 w-1/2 ${activeButtonClass} cursor-pointer rounded-lg text-white font-bold disabled:opacity-50 active:scale-95 transition-transform`}>
          Start
        </button>
        <button onClick={endSession} disabled={!callActive} className={`h-12 w-1/2 ${activeButtonClass} cursor-pointer rounded-lg text-white font-bold disabled:opacity-50 active:scale-95 transition-transform`}>
          End
        </button>
      </div>
    </div>
  );
}