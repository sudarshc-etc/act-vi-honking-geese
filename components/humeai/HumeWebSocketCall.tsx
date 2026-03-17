"use client";

import { useEffect, useRef, useState } from "react";
import { NALA_BASE_PROMPTS, SIMBA_BASE_PROMPTS, NALA_VOICE, SIMBA_VOICE } from "./Charachters";

export default function HumeWebSocketCall({
  accessToken,
  gooseName,
}: {
  accessToken: string;
  gooseName: "Simba" | "Nala";
}) {
  const isSimba = gooseName === "Simba";

  let activeButtonClass = isSimba
    ? "bg-linear-to-t from-sky-500 to-indigo-500"
    : "bg-linear-65 from-purple-500 to-pink-500";

  const [callActive, setCallActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);

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
      const base64 = audioQueueRef.current.shift()!;
      const binary = atob(base64);
      const buffer = new ArrayBuffer(binary.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);

      const decoded = await audioContext.decodeAudioData(buffer);
      const source = audioContext.createBufferSource();
      source.buffer = decoded;
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
          system_prompt: isSimba ? SIMBA_BASE_PROMPTS : NALA_BASE_PROMPTS,
          voice_id: isSimba ? SIMBA_VOICE : NALA_VOICE,
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