"use client";

import { useEffect, useRef, useState } from "react";
import { NALA_BASE_PROMPTS, SIMBA_BASE_PROMPTS, NALA_VOICE, SIMBA_VOICE } from "./Charachters";

export default function HumeWebSocketCall({
  accessToken,
  gooseName,
  systemEvent,
  onUpdateTension,
}: {
  accessToken: string;
  gooseName: "Simba" | "Nala";
  systemEvent: {type: string, prompt: string, timestamp: number} | null;
  onUpdateTension: React.Dispatch<React.SetStateAction<number>>;
}) {
  const isSimba = gooseName === "Simba";
  const activeButtonClass = isSimba
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
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(false);

  const startSession = async () => {
    if (callActive) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ws = new WebSocket(`wss://api.hume.ai/v0/evi/chat?access_token=${accessToken}`);
    wsRef.current = ws;

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const playQueue = async () => {
      if (isPlayingRef.current || isPaused) return;
      if (audioQueueRef.current.length === 0) return;

      isPlayingRef.current = true;
      const audio = audioQueueRef.current.shift()!;
      let source = audioContext.createBufferSource();

      if (audio instanceof Float32Array) {
        const buffer = audioContext.createBuffer(1, audio.length, audioContext.sampleRate);
        buffer.copyToChannel(audio as Float32Array<ArrayBuffer>, 0);
        source.buffer = buffer;
      } else {
        const binary = atob(audio as string);
        const buffer = new ArrayBuffer(binary.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < binary.length; i++) {
          view[i] = binary.charCodeAt(i);
        }
        source.buffer = await audioContext.decodeAudioData(buffer);
      }

      source.connect(audioContext.destination);
      currentAudioSourceRef.current = source;

      source.onended = () => {
        isPlayingRef.current = false;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: "session_settings",
              system_prompt: `${basePrompt}\n\n<system_event>The user has remained completely silent after you finished speaking. Interpret this as apathy or guilt, and alter your next move drastically.</system_event>`
            }));
          }
        }, 5000);
        playQueue();
      };

      source.start();
    };

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "session_settings",
        system_prompt: basePrompt,
        voice_id: voice,
      }));

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && !isPaused && ws.readyState === WebSocket.OPEN) {
          const arrayBuffer = await event.data.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, Array.from(uint8Array.subarray(i, i + chunkSize)));
          }
          const base64 = btoa(binary);
          ws.send(JSON.stringify({ type: "audio_input", data: base64 }));
        }
      };

      mediaRecorder.start(250);
      setCallActive(true);
      setIsPaused(false);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "user_message") {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        if (isPlayingRef.current) {
          audioQueueRef.current = [];
          if (currentAudioSourceRef.current) {
            try { currentAudioSourceRef.current.stop(); } catch (e) {}
          }
          isPlayingRef.current = false;
          
          ws.send(JSON.stringify({
            type: "session_settings",
            system_prompt: `${basePrompt}\n\n<system_event>The user just violently interrupted you mid-sentence. React with annoyance or surprise.</system_event>`
          }));
        }

        if (data.models?.prosody?.scores) {
          const anger = data.models.prosody.scores.Anger || 0;
          const calm = data.models.prosody.scores.Calmness || 0;
          
          if (anger > 0.5) {
            onUpdateTension((prev) => Math.min(prev + 15, 100));
          } else if (calm > 0.5) {
            onUpdateTension((prev) => Math.max(prev - 10, 0));
          }
        }
      }

      if (data.type === "audio_output") {
        audioQueueRef.current.push(data.data);
        if (!isPaused) playQueue();
      }
    };

    ws.onerror = () => {};

    ws.onclose = () => {
      setCallActive(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
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
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };

  const pauseSession = () => {
    mediaRecorderRef.current?.pause();
    setIsPaused(true);
  };

  const resumeSession = () => {
    setIsPaused(false);
    mediaRecorderRef.current?.resume();
  };

  useEffect(() => {
    if (!wsRef.current || !callActive || !systemEvent) return;

    audioQueueRef.current = [];
    if (currentAudioSourceRef.current) {
      try { currentAudioSourceRef.current.stop(); } catch (e) {}
    }
    isPlayingRef.current = false;

    wsRef.current.send(
      JSON.stringify({
        type: "session_settings",
        system_prompt: `${basePrompt}\n\n<hardware_event>${systemEvent.prompt}</hardware_event>`,
      })
    );
  }, [systemEvent, callActive]);

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