"use client";

import { useEffect, useRef, useState } from "react";
import {
  NALA_BASE_PROMPTS,
  SIMBA_BASE_PROMPTS,
  NALA_VOICE,
  SIMBA_VOICE,
} from "./OpenAIConstants";

export default function OpenAIIntegration({
  gooseName,
  phase,
  stream,
}: {
  gooseName: string;
  phase: string;
  stream: MediaStream | null;
}) {
  const portRef = useRef<any>(null);
  const writerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [callActive, setCallActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  let activeButtonClass =
    gooseName === "Nala"
      ? "bg-linear-65 from-purple-500 to-pink-500"
      : "bg-linear-to-t from-sky-500 to-indigo-500";

  //Create audio element ONCE
  useEffect(() => {
    audioRef.current = document.createElement("audio");
    audioRef.current.autoplay = true;

    return () => {
      audioRef.current?.remove();
    };
  }, []);

  const startSession = async () => {
    if (!stream || callActive) return;

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
        console.log("AVG:", avg);

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
      const isSimba = gooseName === "Simba";

      dc.send(
        JSON.stringify({
          type: "session.update",
          session: {
            voice: isSimba ? SIMBA_VOICE : NALA_VOICE,
            instructions: isSimba
              ? SIMBA_BASE_PROMPTS
              : NALA_BASE_PROMPTS,
          },
        })
      );
    };

    stream.getTracks().forEach((track) =>
      pc.addTrack(track, stream)
    );

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sessionRes = await fetch("/api/openai/session", {
      method: "POST",
    });
    const session = await sessionRes.json();

    const answerRes = await fetch(
      `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.client_secret.value}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      }
    );

    await pc.setRemoteDescription({
      type: "answer",
      sdp: await answerRes.text(),
    });

    setCallActive(true);
  };

  const endSession = () => {
    dcRef.current?.close();
    pcRef.current?.close();
    pcRef.current = null;
    setCallActive(false);
  };

  const pauseSession = () => {
    if (!pcRef.current) return;

    pcRef.current.getSenders().forEach((sender) => {
      if (sender.track?.kind === "audio") {
        sender.track.enabled = false;
      }
    });

    setIsPaused(true);

    if (audioRef.current) audioRef.current.muted = true;
  };

  const resumeSession = () => {
    if (!pcRef.current) return;

    pcRef.current.getSenders().forEach((sender) => {
      if (sender.track?.kind === "audio") {
        sender.track.enabled = true;
      }
    });

    setIsPaused(false);

    if (audioRef.current) audioRef.current.muted = false;
  };

  useEffect(() => {
    if (!dcRef.current || !callActive) return;

    dcRef.current.send(
      JSON.stringify({
        type: "session.update",
        session: { instructions: phase, voice: "alloy" },
      })
    );
  }, [phase]);

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
    <div className="flex gap-4">
      <button
        onClick={startSession}
        disabled={callActive}
        className={`h-14 w-1/2 m-5 ${activeButtonClass} rounded-lg`}
      >
        Start
      </button>

      <button
        onClick={endSession}
        disabled={!callActive}
        className={`h-14 w-1/2 m-5 ${activeButtonClass} rounded-lg`}
      >
        End
      </button>

      {callActive && !isPaused && (
        <button
          onClick={pauseSession}
          className={`h-14 w-1/2 m-5 ${activeButtonClass} rounded-lg`}
        >
          Pause
        </button>
      )}

      {callActive && isPaused && (
        <button
          onClick={resumeSession}
          className={`h-14 w-1/2 m-5 ${activeButtonClass} rounded-lg`}
        >
          Resume
        </button>
      )}

      {callActive && (
        <button
          onClick={connectArduino}
          className={`h-14 w-1/2 m-5 ${activeButtonClass} rounded-lg`}
        >
          Arduino
        </button>
      )}
    </div>
  );
}