"use client";

import { useEffect, useRef, useState } from "react";
import { NALA_BASE_PROMPTS, SIMBA_BASE_PROMPTS, NALA_VOICE, SIMBA_VOICE } from "./Charachters";
import { HumeClient } from "hume";

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

        // CASE 1: Float32Array (raw PCM)
        if (audio instanceof Float32Array) {
            const buffer = audioContext.createBuffer(
                1,
                audio.length,
                audioContext.sampleRate
            );

            const safeAudio = new Float32Array(audio);
            buffer.copyToChannel(safeAudio, 0);
            source.buffer = buffer;
        } 
        // CASE 2: base64 string
        else {
            const binary = atob(audio);
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
            playQueue(); // play next in queue
        };

        source.start();
    };

    ws.onopen = () => {
      console.log("Connected to Hume");

      ws.send(
        JSON.stringify({
          type: "session_settings",
          context:{
            text: "You are not an assitant. You are an improv performer on a live dating show.",
            type: 'persistent'
          },
          system_prompt: basePrompt,
          voice_id: voice
        })
      );

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && !isPaused) {
          const arrayBuffer = await event.data.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

          ws.send(JSON.stringify({ type: "audio_input", data: base64 }));
        }
      };

      mediaRecorder.start(250); // send chunks every 250ms

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
    if (!wsRef.current || !callActive) return;

    const emotionInstruction = `
        <adapt_to_change_in_expression_phase>
          Current emotional tone, {{ ${phase} }}.
          Mention the {{ ${phase} }} and strongly express this {{${phase}}} in voice, pacing, and word choice. Do not sound montonous.
        </adapt_to_change_in_expression_phase>
    `;

    wsRef.current.send(
        JSON.stringify({
        type: "session_settings",
        system_prompt: `
            ${basePrompt}

            ${emotionInstruction}
        `,
        })
    );
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