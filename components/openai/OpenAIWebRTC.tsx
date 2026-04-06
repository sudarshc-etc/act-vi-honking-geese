"use client";

import { useEffect, useRef, useState } from "react";
import * as Prompts from "./OpenAIConstants";

export default function OpenAIWebRTC({
  mode,
  participantIndex,
  currentPersonality,
  unlockedPersonalities,
  currentEmotion,
  storyPhase,
  globalTension,
  chaosMeter,
  stream,
  systemEvent,
  onPersonalityChange,
  onTensionChange,
  onChaosChange,
  onLieDetected,
  onLieStateChange,
  onPersonalityUnlock
}: {
  mode: "menu" | "datingshow" | "gameplay" | "meisnerexercise" | "talkshow";
  participantIndex: number;
  currentPersonality: string;
  unlockedPersonalities: string[];
  currentEmotion: string;
  storyPhase: string;
  globalTension: number;
  chaosMeter: number;
  stream: MediaStream | null;
  systemEvent: {type: string, prompt: string, timestamp: number} | null;
  onPersonalityChange: (p: string) => void;
  onTensionChange: (amt: number) => void;
  onChaosChange: (amt: number) => void;
  onLieDetected: () => void;
  onLieStateChange: (state: boolean) => void;
  onPersonalityUnlock: (p: string) => void;
}) {

  const portRef = useRef<any>(null);
  const writerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [callActive, setCallActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const lastEventTime = useRef<number>(0);
  const usedKeywords = useRef<Set<string>>(new Set());
  const isPlayerSpeaking = useRef<boolean>(false);
  const queuedSlam = useRef<any>(null);

  const pendingLieRef = useRef<boolean>(false);
  const isLyingRef = useRef<boolean>(false);

  const storyPhaseRef = useRef(storyPhase);
  const currentPersonalityRef = useRef(currentPersonality);
  const callbacks = useRef({ onTensionChange, onChaosChange, onLieDetected, onLieStateChange, onPersonalityUnlock });

  useEffect(() => { storyPhaseRef.current = storyPhase; }, [storyPhase]);
  useEffect(() => { currentPersonalityRef.current = currentPersonality; }, [currentPersonality]);
  useEffect(() => { callbacks.current = { onTensionChange, onChaosChange, onLieDetected, onLieStateChange, onPersonalityUnlock }; }, [onTensionChange, onChaosChange, onLieDetected, onLieStateChange, onPersonalityUnlock]);

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

  const getBasePrompt = (personality: string) => {
    if (personality === "Lexi") return Prompts.LEXI_PROMPTS;
    if (personality === "Lily") return Prompts.LILY_PROMPTS;
    if (personality === "The Architect") return Prompts.ARCHITECT_PROMPTS;
    if (personality === "Ben") return Prompts.BEN_PROMPTS;
    if (personality === "Alice") return Prompts.ALICE_PROMPTS;
    return Prompts.ARTHUR_PROMPTS;
  };

  const getStoryContext = (personality: string, phase: string) => {
    if (personality === "Arthur") {
      if (phase === "intro") return "STORY PHASE: Intro. You are genuinely confused and innocent.";
      if (phase === "suspicious") return "STORY PHASE: Suspicious. Your mind is fragmenting. You are stammering heavily, trying to hide dark flashes of memory.";
    }
    return "";
  };

  const getEmotionPrompt = (emotion: string) => {
    switch (emotion) {
      case 'happy': return "CURRENT EMOTION: CALM.";
      case 'sad': return "CURRENT EMOTION: DEVASTATED. Voice trembling.";
      case 'angry': return "CURRENT EMOTION: FURIOUS.";
      case 'confused': return "CURRENT EMOTION: HIGHLY CONFUSED.";
      case 'sarcastic': return "CURRENT EMOTION: SARCASTIC/MOCKING.";
      default: return `CURRENT EMOTION: ${emotion.toUpperCase()}.`;
    }
  };

  const getCombinedInstructions = (personality: string, emotion: string, eventPrompt?: string) => {
    if (personality === "Alice") {
      let instr = `${getBasePrompt(personality)}`;
      if (eventPrompt) instr += `\n\n<context_event>URGENT OVERRIDE: ${eventPrompt}</context_event>`;
      return instr;
    }

    let instr = `${getBasePrompt(personality)}\n\n--- STORY CONTEXT ---\n${getStoryContext(personality, storyPhase)}\n\n--- EMOTION ---\n${getEmotionPrompt(emotion)}`;
    instr += "\n\nCRITICAL RULE: Keep your responses VERY SHORT (1 to 2 sentences maximum).";
    if (eventPrompt) instr += `\n\n<context_event>URGENT OVERRIDE: ${eventPrompt}</context_event>`;
    return instr;
  };

  const getVoiceForCurrentState = () => {
    if (currentPersonality === "Lexi") return Prompts.VOICE_LEXI;
    if (currentPersonality === "Lily") return Prompts.VOICE_LILY;
    if (currentPersonality === "The Architect") return Prompts.VOICE_ARCHITECT;
    if (currentPersonality === "Ben") return Prompts.VOICE_BEN;
    if (currentPersonality === "Alice") return Prompts.VOICE_ALICE;
    return Prompts.VOICE_ARTHUR;
  };

  const triggerSlamAction = (event: any) => {
    if (dcRef.current?.readyState !== "open") return;
    dcRef.current.send(JSON.stringify({ type: "response.cancel" }));
    if (audioRef.current && !isPaused) audioRef.current.muted = true;

    callbacks.current.onTensionChange(15);
    callbacks.current.onChaosChange(25);

    if (currentPersonalityRef.current === "Arthur") {
      pendingLieRef.current = true;
    }

    dcRef.current.send(JSON.stringify({
      type: "conversation.item.create",
      item: { type: "message", role: "user", content: [{ type: "input_text", text: `*SYSTEM EVENT: ${event.prompt}*` }] }
    }));
    dcRef.current.send(JSON.stringify({ type: "response.create" }));
  };

  const togglePause = () => {
    const nextPauseState = !isPaused;
    setIsPaused(nextPauseState);
    if (stream) {
      stream.getAudioTracks().forEach((track: MediaStreamTrack) => track.enabled = !nextPauseState);
    }
    if (audioRef.current) {
      audioRef.current.muted = nextPauseState;
    }
    if (nextPauseState && dcRef.current?.readyState === "open") {
       dcRef.current.send(JSON.stringify({ type: "response.cancel" }));
    }
  };

  const startSession = async () => {
    if (!stream || callActive) return;
    setIsPaused(false);
    stream.getAudioTracks().forEach((track: MediaStreamTrack) => track.enabled = true);

    const pc = new RTCPeerConnection();
    pcRef.current = pc;
    pc.ontrack = async (e) => {
      //Play audio
      if (audioRef.current) {
        audioRef.current.srcObject = e.streams[0];
      }

      //Create ONE AudioContext (user-triggered)
      const audioCtx = new AudioContext();
      await audioCtx.resume();
      audioCtxRef.current = audioCtx;

      //Analyze stream directly
      const source = audioCtx.createMediaStreamSource(e.streams[0]);
      const analyser = audioCtx.createAnalyser();

      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      source.connect(analyser);

      let smoothed = 0;
      let lastSent = 0;

      const tick = (time: number) => {
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }

        const avg = sum / dataArray.length;

        let volume = Math.min(100, Math.floor((avg / 50) * 100));

        // optional noise gate
        if (volume < 5) volume = 0;

        // smoothing
        smoothed = smoothed + (volume - smoothed) * 0.3;

        // send to Arduino ~30fps
        if (time - lastSent > 33) {
          if (writerRef.current) {
            const data = new TextEncoder().encode(
              Math.floor(smoothed) + "\n"
            );
            writerRef.current.write(data);
          }
          lastSent = time;
        }

        requestAnimationFrame(tick);
      };

      tick(0);
    };
    const dc = pc.createDataChannel("oai-events");
    dcRef.current = dc;

    dc.onopen = () => {
      dc.send(JSON.stringify({
        type: "session.update",
        session: {
          voice: getVoiceForCurrentState(),
          instructions: getCombinedInstructions(currentPersonality, currentEmotion),
          input_audio_transcription: { model: "whisper-1" },
          turn_detection: { type: "server_vad", threshold: 0.8, prefix_padding_ms: 300, silence_duration_ms: 1000 }
        }
      }));
    };

    dc.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "response.audio.delta" || data.type === "response.output_item.added") {
        if (pendingLieRef.current && currentPersonalityRef.current === "Arthur") {
          if (!isLyingRef.current) {
            isLyingRef.current = true;
            callbacks.current.onLieStateChange(true);
            callbacks.current.onLieDetected();
          }
        }

        if (audioRef.current && audioRef.current.muted && !isPaused) {
          audioRef.current.muted = false;
        }
      }

      if (data.type === "input_audio_buffer.speech_started") {
        isPlayerSpeaking.current = true;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      }

      if (data.type === "input_audio_buffer.speech_stopped" || data.type === "input_audio_buffer.committed" || data.type === "response.created") {
        isPlayerSpeaking.current = false;
        if (queuedSlam.current) {
          triggerSlamAction(queuedSlam.current);
          queuedSlam.current = null;
        }
        if (data.type === "response.created" && silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      }

      if (mode === "gameplay" && data.type === "conversation.item.input_audio_transcription.completed") {
        const transcript = (data.transcript || "").toLowerCase();

        let count = 0;
        Prompts.CRIME_KEYWORDS.forEach((kw: string) => {
          if (transcript.includes(kw) && !usedKeywords.current.has(kw)) {
            usedKeywords.current.add(kw);
            count++;
          }
        });

        if (count > 0) {
          const addAmt = storyPhaseRef.current === "intro" ? count * 10 : count * 5;
          callbacks.current.onTensionChange(addAmt);

          if (currentPersonalityRef.current === "Arthur") {
            pendingLieRef.current = true;
          }
        }

        if (Prompts.LILY_TRIGGERS.some((w: string) => transcript.includes(w))) {
          callbacks.current.onPersonalityUnlock("Lily");
        }

        if (Prompts.ARCHITECT_TRIGGERS.some((w: string) => transcript.includes(w))) {
          callbacks.current.onPersonalityUnlock("The Architect");
        }
      }

      if (data.type === "response.done") {
        if (isLyingRef.current) {
          isLyingRef.current = false;
          callbacks.current.onLieStateChange(false);
        }
        pendingLieRef.current = false;

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (data.response?.output?.length > 0) {
          silenceTimerRef.current = setTimeout(() => {
            if (!isPaused && currentPersonalityRef.current !== "Alice") {
              callbacks.current.onTensionChange(5);
              if (dcRef.current?.readyState === "open") {
                dcRef.current.send(JSON.stringify({
                  type: "conversation.item.create",
                  item: { type: "message", role: "user", content: [{ type: "input_text", text: "*SYSTEM EVENT: Awkward silence. The user is staring at you. Say something to break the tension!*" }] }
                }));
                dcRef.current.send(JSON.stringify({ type: "response.create" }));
              }
            }
          }, 15000);
        }
      }
    };

    stream.getTracks().forEach((track: MediaStreamTrack) => pc.addTrack(track, stream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    try {
      const sessionRes = await fetch("/api/openai/session", { method: "POST" });
      if (!sessionRes.ok) {
        console.error("Session fetch failed with status:", sessionRes.status);
        return;
      }
      
      const rawText = await sessionRes.text();
      if (!rawText) {
        console.error("Received empty response from session API");
        return;
      }
      
      const sessionData = JSON.parse(rawText);

      const answerRes = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionData.client_secret.value}`, "Content-Type": "application/sdp" },
        body: offer.sdp,
      });

      await pc.setRemoteDescription({ type: "answer", sdp: await answerRes.text() });
      setCallActive(true);
    } catch (error) {
      console.error("Error during session initialization:", error);
      pc.close();
    }
  };

  const endSession = () => {
    dcRef.current?.close();
    pcRef.current?.close();
    pcRef.current = null;
    dcRef.current = null;
    setCallActive(false);
    setIsPaused(false);
    usedKeywords.current.clear();
    isPlayerSpeaking.current = false;
    queuedSlam.current = null;
    pendingLieRef.current = false;
    isLyingRef.current = false;
    callbacks.current.onLieStateChange(false);
    if (audioRef.current) audioRef.current.muted = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (stream) stream.getAudioTracks().forEach((t: MediaStreamTrack) => t.enabled = true);
  };

  useEffect(() => {
    if (!dcRef.current || !callActive || !systemEvent) return;
    if (dcRef.current.readyState !== "open") return;
    if (systemEvent.timestamp === lastEventTime.current) return;
    lastEventTime.current = systemEvent.timestamp;

    if (systemEvent.type === "slam") {
      if (isPlayerSpeaking.current) {
        queuedSlam.current = systemEvent;
      } else {
        triggerSlamAction(systemEvent);
      }
    } else if (systemEvent.type === "switch") {
      dcRef.current.send(JSON.stringify({ type: "response.cancel" }));
      if (audioRef.current && !isPaused) audioRef.current.muted = true;

      dcRef.current.send(JSON.stringify({
        type: "session.update",
        session: {
          instructions: getCombinedInstructions(currentPersonality, currentEmotion, systemEvent.prompt),
          voice: getVoiceForCurrentState()
        }
      }));

      dcRef.current.send(JSON.stringify({
        type: "conversation.item.create",
        item: { type: "message", role: "user", content: [{ type: "input_text", text: `*SYSTEM EVENT: ${systemEvent.prompt}*` }] }
      }));
      dcRef.current.send(JSON.stringify({ type: "response.create" }));
    }
  }, [systemEvent, callActive]);

  useEffect(() => {
    if (!dcRef.current || !callActive) return;
    if (dcRef.current.readyState !== "open") return;
    dcRef.current.send(JSON.stringify({
      type: "session.update",
      session: {
        instructions: getCombinedInstructions(currentPersonality, currentEmotion),
        voice: getVoiceForCurrentState()
      }
    }));
  }, [currentPersonality, currentEmotion, storyPhase, callActive]);

  const btnColor = mode === "talkshow" ? "fuchsia" : "sky";

  const arduino = mode !== "datingshow";

  const connectArduino = async () => {
        try {
        if (writerRef.current) {
            writerRef.current.releaseLock();
            writerRef.current = null;
        }

        if (portRef.current) {
            await portRef.current.close();
            portRef.current = null;
        }

        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });

        const writer = port.writable.getWriter();

        portRef.current = port;
        writerRef.current = writer;

        console.log("Connected to Arduino");
        } catch (err) {
        console.error("Connection failed:", err);
        }
    };

  return (
    <div className="flex flex-col mb-2">
      {mode === "gameplay" && (
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
          <span className="text-xl font-black text-sky-400">PROFILES</span>
          <div className="flex gap-2 flex-wrap justify-end max-w-[60%]">
            {unlockedPersonalities.map((p: string) => (
              <button
                key={p}
                onClick={() => {
                  onPersonalityChange(p);
                  if (dcRef.current?.readyState === "open") {
                    dcRef.current.send(JSON.stringify({ type: "response.cancel" }));
                    dcRef.current.send(JSON.stringify({
                      type: "conversation.item.create",
                      item: { type: "message", role: "user", content: [{ type: "input_text", text: `*SYSTEM EVENT: The user switched to speak to ${p}. Switch personality immediately.*` }] }
                    }));
                    dcRef.current.send(JSON.stringify({ type: "response.create" }));
                  }
                }}
                className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors hover:cursor-pointer  ${
                  currentPersonality === p
                    ? 'bg-sky-600 text-white shadow-[0_0_10px_rgba(2,132,199,0.5)]'
                    : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={startSession}
          disabled={callActive}
          className={`flex-1 py-3 cursor-pointer rounded text-white font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-${btnColor}-600 hover:bg-${btnColor}-500 shadow-[0_0_15px_rgba(${mode === 'talkshow' ? '192,38,211' : '14,165,233'},0.2)]`}
        >
          Start
        </button>
        <button
          onClick={togglePause}
          disabled={!callActive}
          className={`flex-1 py-3 ${isPaused ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} cursor-pointer rounded font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
        >
          {isPaused ? "RESUME" : "PAUSE"}
        </button>
        <button
          onClick={endSession}
          disabled={!callActive}
          className={`flex-1 py-3 bg-red-900/50 hover:bg-red-800 text-red-400 hover:text-white cursor-pointer rounded font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
        >
          End
        </button>
        {callActive && arduino && (
            <button
            onClick={connectArduino}
            className="bg-cyan-700 text-white hover:bg-cyan-600 cursor-pointer rounded font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
            Arduino
            </button>
        )}
      </div>
    </div>
  );
}