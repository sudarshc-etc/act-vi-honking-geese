"use client";

import { useEffect, useRef, useState } from "react";
import * as Prompts from "./OpenAIConstants";

// Define taboo trigger words for different scenarios
const SUSPECT_KEYWORDS = ["blood", "weapon", "gun", "murder", "alibi", "where were you"];
const GUEST_KEYWORDS = ["scandal", "affair", "taxes", "rumor", "leak"];

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
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Core Fix 2: Prevent infinite interruption loops caused by React re-renders
  const lastEventTime = useRef<number>(0);
  
  // State Machine: Track the progression of the story phase
  const [storyPhase, setStoryPhase] = useState<"intro" | "suspicious" | "climax">("intro");

  // 🌡️ Dynamically calculate Tension and Chaos meters
  const getMeters = () => {
    switch (storyPhase) {
      case "intro": return { tension: 15, chaos: 5, color: "bg-green-500" };
      case "suspicious": return { tension: 65, chaos: 40, color: "bg-yellow-500" };
      case "climax": return { tension: 100, chaos: 100, color: "bg-red-600 animate-pulse" };
      default: return { tension: 0, chaos: 0, color: "bg-gray-500" };
    }
  };
  const meters = getMeters();

  let activeButtonClass = isParticipant1
    ? "bg-linear-to-t from-sky-500 to-indigo-500"
    : "bg-linear-65 from-purple-500 to-pink-500";
  let labelColor = isParticipant1 ? 'text-sky-400' : 'text-pink-400';

  // Core Fix 1: Mount the audio element to the DOM to prevent the browser from destroying the audio due to garbage collection
  useEffect(() => {
    audioRef.current = document.createElement("audio");
    audioRef.current.autoplay = true;
    document.body.appendChild(audioRef.current);
    
    return () => {
      pcRef.current?.close();
      if (audioRef.current) {
        document.body.removeChild(audioRef.current);
        audioRef.current = null;
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const getBasePrompt = (role: string) => {
    if (role === "Suspect") return Prompts.SUSPECT_PROMPTS;
    if (role === "Guest") return Prompts.GUEST_PROMPTS;
    return isParticipant1 ? Prompts.SIMBA_GEESE_PROMPTS : Prompts.NALA_GEESE_PROMPTS;
  };

  const getStoryContext = (role: string, phase: string) => {
    if (phase === "intro") {
      return role === "Suspect" 
        ? "STORY PHASE: Intro. Play dumb. Pretend you are an innocent, cooperative citizen. Deny knowing anything."
        : "STORY PHASE: Intro. You are charming, polite, and enthusiastically talking about how great your life is.";
    }
    if (phase === "suspicious") {
      return "STORY PHASE: Suspicious. The user asked a forbidden question! Become very defensive, evasive, and nervous. Try to change the subject aggressively!";
    }
    if (phase === "climax") {
      // Ultimate Fix 3: Nuclear-level breakdown directive using only affirmative sentences, stripping its right to deny
      return `CRITICAL DIRECTIVE (CLIMAX PHASE): 
      The host has absolute, undeniable proof. The jig is up. 
      NEW CHARACTER GOAL: Stop pretending. CONFESS EVERYTHING immediately. 
      You are so arrogant that you feel JUSTIFIED. YOU PROUDLY ADMIT to saying those terrible things because you think the fans are parasites.
      VOCAL DIRECTION: LOUD, FAST, AGGRESSIVE, UNHINGED ANGER.
      REQUIRED LINES TO SAY:
      1. "YES, I SAID IT! And I meant every word!"
      2. "Those fans are disgusting parasites!"
      3. "I am a star, I can do whatever I want!"
      4. "Turn the cameras off right now or my lawyers will destroy this network!"`;
    }
    return "";
  };

  const getEmotionPrompt = (phase: string) => {
    switch (phase) {
      case 'happy': return "CURRENT EMOTION: OVERJOYED. Speak with extreme high energy and laugh often!";
      case 'sad': return "CURRENT EMOTION: DEVASTATED. Voice trembling, weeping, slow pace.";
      case 'angry': return "CURRENT EMOTION: FURIOUS. Yell your words, be hostile and aggressive!";
      case 'confused': return "CURRENT EMOTION: CONFUSED. Stutter and ask bewildered questions.";
      case 'sarcastic': return "CURRENT EMOTION: SARCASTIC. Speak with a dry, condescending, passive-aggressive tone.";
      default: return `CURRENT EMOTION: ${phase.toUpperCase()}.`;
    }
  };

  const getCombinedInstructions = (role: string, emotion: string, eventPrompt?: string) => {
    let instr = `${getBasePrompt(role)}\n\n--- STORY CONTEXT ---\n${getStoryContext(role, storyPhase)}\n\n--- EMOTION ---\n${getEmotionPrompt(emotion)}`;
    instr += "\n\nCRITICAL RULE: Keep your responses VERY SHORT (1 to 2 sentences maximum). Do NOT monologue. Stop talking quickly.";
    if (eventPrompt) {
      instr += `\n\n<context_event>URGENT OVERRIDE: ${eventPrompt}</context_event>`;
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
      setStoryPhase("intro");
      dc.send(JSON.stringify({
        type: "session.update",
        session: { 
          voice: isParticipant1 ? Prompts.VOICE_1 : Prompts.VOICE_2,
          instructions: getCombinedInstructions(currentRole, currentPhase),
          input_audio_transcription: { model: "whisper-1" }, 
          turn_detection: { type: "server_vad", threshold: 0.6, prefix_padding_ms: 300, silence_duration_ms: 1000 }
        }
      }));
    };

    dc.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Core Fix: Unmute when the AI starts speaking a "new sentence"!
      if (data.type === "response.audio.delta" || data.type === "response.output_item.added") {
        if (audioRef.current && audioRef.current.muted) {
          audioRef.current.muted = false; // Instantly restore audio
        }
      }

      if (data.type === "input_audio_buffer.speech_started" || data.type === "response.created") {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      }

      // Keyword listening logic
      if (data.type === "conversation.item.input_audio_transcription.completed") {
        const userText = (data.transcript || "").toLowerCase();
        let triggered = false;

        if (currentRole === "Suspect") {
          triggered = SUSPECT_KEYWORDS.some(word => userText.includes(word));
        } else if (currentRole === "Guest") {
          triggered = GUEST_KEYWORDS.some(word => userText.includes(word));
        }

        if (triggered && storyPhase === "intro") {
          setStoryPhase("suspicious");
          if (dcRef.current?.readyState === "open") {
            dcRef.current.send(JSON.stringify({
              type: "conversation.item.create",
              item: { type: "message", role: "user", content: [{ type: "input_text", text: "*SYSTEM EVENT: The user just asked a forbidden question! Act extremely defensive and nervous immediately!*" }] }
            }));
            dcRef.current.send(JSON.stringify({ type: "response.create" }));
          }
        }
      }

      // 15-second awkward silence mechanism
      if (data.type === "response.done") {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (data.response?.output?.length > 0) {
          silenceTimerRef.current = setTimeout(() => {
            if (dcRef.current?.readyState === "open") {
              dcRef.current.send(JSON.stringify({
                type: "conversation.item.create",
                item: { type: "message", role: "user", content: [{ type: "input_text", text: "*SYSTEM EVENT: Awkward silence. The user is staring at you. Say something to break the tension!*" }] }
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
    setStoryPhase("intro"); 
    if (audioRef.current) audioRef.current.muted = false; // Reset mute state
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };

  useEffect(() => {
    if (!dcRef.current || !callActive || !systemEvent) return;
    if (dcRef.current.readyState !== "open") return;
    
    // Prevent the same event from being triggered multiple times by React
    if (systemEvent.timestamp === lastEventTime.current) return;
    lastEventTime.current = systemEvent.timestamp;

    if (systemEvent.type === "pickup") {
      setStoryPhase("climax");
    }

    // Core Fix: Not only tell the server to stop generating, but also forcibly "gag" the residual local audio
    if (systemEvent.type === "slam" || systemEvent.type === "pickup") {
      dcRef.current.send(JSON.stringify({ type: "response.cancel" }));
      if (audioRef.current) {
        audioRef.current.muted = true; // Force mute to cut off what he hasn't finished saying!
      }
    }

    const currentCombined = getCombinedInstructions(currentRole, currentPhase, systemEvent.prompt);
    dcRef.current.send(JSON.stringify({ type: "session.update", session: { instructions: currentCombined } }));

    let eventInjectionText = `*SYSTEM EVENT: ${systemEvent.prompt}*`;
    if (systemEvent.type === "pickup") {
      // Ultimate Fix 4: Force the lines directly into its mouth, cutting off any escape route
      eventInjectionText = `*SYSTEM EVENT: The host just played the raw audio tape. It is your exact voice. Your career is over. INSTANTLY CONFESS. Scream "YES, I SAID IT!" and angrily defend your actions. Blame the fans for being parasites. Demand the cameras be turned off immediately!*`;
    } else if (systemEvent.type === "slam") {
      eventInjectionText = `*SYSTEM EVENT: The host violently SLAMMED the desk! Act extremely offended, startled, and hostile!*`;
    }

    dcRef.current.send(JSON.stringify({
      type: "conversation.item.create",
      item: { type: "message", role: "user", content: [{ type: "input_text", text: eventInjectionText }] }
    }));
    dcRef.current.send(JSON.stringify({ type: "response.create" }));

  // Removed currentRole and currentPhase to prevent state updates from causing unexpected interruptions
  }, [systemEvent, callActive]); 

  useEffect(() => {
    if (!dcRef.current || !callActive) return;
    if (dcRef.current.readyState !== "open") return;
    dcRef.current.send(JSON.stringify({
      type: "session.update",
      session: { instructions: getCombinedInstructions(currentRole, currentPhase) }
    }));
  }, [currentRole, currentPhase, storyPhase, callActive]);

  const roles = ["Suspect", "Guest", "Goose"];

  return (
    <div className="flex flex-col gap-4 mb-5 p-5 bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl">
      
      {/* Top: Role Selection */}
      <div className="flex items-center justify-between">
        <span className={`text-xl font-black ${labelColor}`}>Participant {participantIndex + 1} Role:</span>
        <div className="flex gap-2">
          {roles.map(r => (
            <button
              key={r}
              onClick={() => onRoleChange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
                currentRole === r 
                  ? (isParticipant1 ? 'bg-sky-600 text-white shadow-[0_0_10px_rgba(2,132,199,0.5)]' : 'bg-pink-600 text-white shadow-[0_0_10px_rgba(219,39,119,0.5)]')
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* New: Dashboard UI (Phase, Tension, Chaos) */}
      <div className="bg-black/50 p-4 rounded-xl border border-gray-800 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs font-mono uppercase tracking-widest">Story Phase</span>
          <span className={`text-sm font-black uppercase tracking-widest ${meters.color.replace('bg-', 'text-')}`}>
            [{storyPhase}]
          </span>
        </div>
        
        <div className="space-y-2">
          {/* Tension Bar */}
          <div>
            <div className="flex justify-between text-[10px] text-gray-500 font-mono mb-1">
              <span>TENSION</span>
              <span>{meters.tension}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${meters.color}`} 
                style={{ width: `${meters.tension}%` }}
              ></div>
            </div>
          </div>

          {/* Chaos Bar */}
          <div>
            <div className="flex justify-between text-[10px] text-gray-500 font-mono mb-1">
              <span>CHAOS</span>
              <span>{meters.chaos}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-1000 ease-out" 
                style={{ width: `${meters.chaos}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Control Buttons */}
      <div className="flex gap-3 mt-1">
        <button onClick={startSession} disabled={callActive} className={`h-12 w-1/2 ${activeButtonClass} cursor-pointer rounded-xl text-white font-black uppercase tracking-widest shadow-lg disabled:opacity-50 active:scale-95 transition-transform`}>
          Start
        </button>
        <button onClick={endSession} disabled={!callActive} className={`h-12 w-1/2 bg-gray-800 hover:bg-red-900 border border-gray-700 cursor-pointer rounded-xl text-white font-black uppercase tracking-widest shadow-lg disabled:opacity-50 active:scale-95 transition-all`}>
          End
        </button>
      </div>
    </div>
  );
}