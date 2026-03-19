"use client";

import { useEffect, useRef, useState } from "react";
import { NALA_BASE_PROMPTS, SIMBA_BASE_PROMPTS, NALA_VOICE, SIMBA_VOICE } from "./Charachters";

export default function HumeWebSocketCall({
  accessToken,
  gooseName,
  phase,
}: {
  accessToken: string;
  gooseName: "Simba" | "Nala";
  phase: string
}) {
  const isSimba = gooseName === "Simba";

  let activeButtonClass = isSimba
    ? "bg-linear-to-t from-sky-500 to-indigo-500"
    : "bg-linear-65 from-purple-500 to-pink-500";

  const basePrompt = isSimba ? SIMBA_BASE_PROMPTS : NALA_BASE_PROMPTS;

  const voice = isSimba ? SIMBA_VOICE : NALA_VOICE;

  const [callActive, setCallActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<(string | Float32Array)[]>([]);

const startSession = async () => {
    if (callActive) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ws = new WebSocket(
      `wss://api.hume.ai/v0/evi/chat?access_token=${accessToken}`
    );
    wsRef.current = ws;

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    let playing = false;

    const playQueue = async () => {
      if (playing || isPaused) return;
      if (audioQueueRef.current.length === 0) return;

      playing = true;

      const audio = audioQueueRef.current.shift()!;
      const audioContext = audioContextRef.current!;

      let source = audioContext.createBufferSource();

      if (audio instanceof Float32Array) {
        const buffer = audioContext.createBuffer(
          1,
          audio.length,
          audioContext.sampleRate
        );

        const safeAudio = new Float32Array(audio);
        buffer.copyToChannel(safeAudio, 0);
        source.buffer = buffer;
      } else {
        const binary = atob(audio as string);
        const buffer = new ArrayBuffer(binary.length);
        const view = new Uint8Array(buffer);

        for (let i = 0; i < binary.length; i++) {
          view[i] = binary.charCodeAt(i);
        }

        const decoded = await audioContext.decodeAudioData(buffer);
        source.buffer = decoded;
      }

      source.connect(audioContext.destination);

      source.onended = () => {
        playing = false;
        playQueue();
      };

      source.start();
    };

    ws.onopen = () => {
      console.log("Connected to Hume");

      const initialEmotionInstruction = `
<current_status>
  <emotion>${phase.toUpperCase()}</emotion>
  <instruction>
    You are currently feeling strictly ${phase}. 
    You MUST express this emotion strongly in your voice, pacing, and word choice.
  </instruction>
</current_status>
      `;

      ws.send(
        JSON.stringify({
          type: "session_settings",
          system_prompt: `${basePrompt}\n\n${initialEmotionInstruction}`,
          voice_id: voice,
        })
      );

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && !isPaused) {
          if (ws.readyState === WebSocket.OPEN) {
            const arrayBuffer = await event.data.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            ws.send(JSON.stringify({ type: "audio_input", data: base64 }));
          }
        }
    };

      mediaRecorder.start(250);

      setCallActive(true);
      setIsPaused(false);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "audio_output") {
        audioQueueRef.current.push(data.data);
        if (!isPaused) playQueue();
      }
    };

    ws.onerror = (err) => console.error("WebSocket error", err);

    ws.onclose = () => {
      console.log("Disconnected");
      setCallActive(false);
    };
  };

  const endSession = () => {
    mediaRecorderRef.current?.stop();
    wsRef.current?.close();
    wsRef.current = null;
    mediaRecorderRef.current = null;
    audioQueueRef.current = [];
    setCallActive(false);
    setIsPaused(false);
  };

  const pauseSession = () => {
    // Stop recording & prevent sending audio
    mediaRecorderRef.current?.pause();

    setIsPaused(true);
  };

  const resumeSession = () => {
    setIsPaused(false);
    // Resume playing queued audio
    mediaRecorderRef.current?.resume();
  };

  useEffect(() => {
    if (!wsRef.current || !callActive || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const emotionInstruction = `
    <current_status>
      <emotion>${phase.toUpperCase()}</emotion>
      <instruction>
        You are currently feeling strictly ${phase}. 
        You MUST express this emotion strongly in your voice, pacing, and word choice. 
        Adjust your personality slightly to fit this mood. Do NOT sound monotone.
      </instruction>
    </current_status>
    `;

  try {
        wsRef.current.send(
          JSON.stringify({
            type: "session_settings",
            system_prompt: `${basePrompt}\n\n${emotionInstruction}`,
          })
        );
        console.log(`[${gooseName}] Successfully updated emotion to: ${phase}`);
      } catch (error) {
        console.error("Error occurred while updating emotion:", error);
      }
    }, [phase, callActive]);

  return (
    <div className="flex gap-4">
      <button
        className={`h-14 w-1/2 m-5 ${activeButtonClass} cursor-pointer rounded-lg`}
        onClick={startSession}
        disabled={callActive}
      >
        Start
      </button>

      <button
        className={`h-14 w-1/2 m-5 ${activeButtonClass} cursor-pointer rounded-lg`}
        onClick={endSession}
        disabled={!callActive}
      >
        End
      </button>

      {callActive && !isPaused && (
        <button
          className={`h-14 w-1/2 m-5 ${activeButtonClass} cursor-pointer rounded-lg`}
          onClick={pauseSession}
        >
          Pause
        </button>
      )}

      {callActive && isPaused && (
        <button
          className={`h-14 w-1/2 m-5 ${activeButtonClass} cursor-pointer rounded-lg`}
          onClick={resumeSession}
        >
          Resume
        </button>
      )}
    </div>
  );
}