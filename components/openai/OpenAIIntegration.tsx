"use client";

import { useEffect, useRef, useState } from "react";
import { NALA_BASE_PROMPTS, SIMBA_BASE_PROMPTS, NALA_VOICE, SIMBA_VOICE } from "./OpenAIConstants";

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
  const [callActive, setCallActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  let activeButtonClass = gooseName === "Nala" ? "bg-linear-65 from-purple-500 to-pink-500" : 
                                           "bg-linear-to-t from-sky-500 to-indigo-500";

  // Setup audio element
  /* useEffect(() => {
    audioRef.current = document.createElement("audio");
    audioRef.current.autoplay = true;

    return () => {
      pcRef.current?.close();
      audioRef.current?.remove();
    };
  }, []); */

  useEffect(() => {
    audioRef.current = document.createElement("audio");
    audioRef.current.autoplay = true;

    const audioCtx = new AudioContext();
    let analyser: AnalyserNode;
    let dataArray: Uint8Array;
    let source: MediaElementAudioSourceNode;

    const sendVolume = async (volume: number) => {
      /* await fetch("/api/openai/serial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ volume }),
      }); */
      if (!writerRef.current) return;
      const data = new TextEncoder().encode(volume + "\n");
      await writerRef.current.write(data);

    };

    const startAnalyzing = () => {
      if (!audioRef.current) return;

      source = audioCtx.createMediaElementSource(audioRef.current);
      analyser = audioCtx.createAnalyser();

      analyser.fftSize = 256;
      
      dataArray = new Uint8Array(analyser.frequencyBinCount);

      source.connect(analyser);
      analyser.connect(audioCtx.destination);

      let lastSent = 0;

      let smoothed = 0;

      const tick = (time: number) => {
        //@ts-ignore
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }

        const avg = sum / dataArray.length;
        let volume = Math.min(100, Math.floor((avg / 255) * 100));

        if (volume < 10) volume = 0;

        smoothed = smoothed + (volume - smoothed) * 0.3;

        if (time - lastSent > 33) {
          sendVolume(Math.floor(smoothed));
          lastSent = time;
        }

        requestAnimationFrame(tick);
      };

      tick(0);
    };

    if (audioRef.current) {
      audioRef.current.onplay = () => {
        audioCtx.resume(); // required for autoplay policies
        startAnalyzing();
      };

      audioRef.current.onpause = () => sendVolume(0);
      audioRef.current.onended = () => sendVolume(0);
    }

    return () => {
      writerRef.current?.releaseLock();
  portRef.current?.close();
      pcRef.current?.close();
      audioRef.current?.remove();
      audioCtx.close();
    };
  }, []);

  const startSession = async () => {
    if (!stream || callActive) return;

    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    pc.ontrack = (e) => {
      if (audioRef.current) {
        audioRef.current.srcObject = e.streams[0];
      }
    };

    const dc = pc.createDataChannel("oai-events");
    dcRef.current = dc;

    dc.onopen = () => {
      const isSimba = gooseName === "Simba";

      dc.send(JSON.stringify({
        type: "session.update",
        session: { 
          voice: isSimba ? SIMBA_VOICE : NALA_VOICE,
          instructions: isSimba
            ? SIMBA_BASE_PROMPTS
            : NALA_BASE_PROMPTS }
      }));
    };

    stream.getTracks().forEach(track =>
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

    pcRef.current.getSenders().forEach(sender => {
      if (sender.track?.kind === "audio") {
        sender.track.enabled = false; // stop mic
      }
    });

    setIsPaused(true);

    audioRef.current && (audioRef.current.muted = true);
  };

  const resumeSession = () => {
    if (!pcRef.current) return;

    pcRef.current.getSenders().forEach(sender => {
      if (sender.track?.kind === "audio") {
        sender.track.enabled = true; // resume mic
      }
    });

    setIsPaused(false);

    audioRef.current && (audioRef.current.muted = false);
  };

  useEffect(() => {
    if (!dcRef.current || !callActive) return;

    const emotionInstruction = `
      Current emotional tone: ${phase}.
      Strongly express this emotion in voice, pacing, and word choice.
    `;

    dcRef.current.send(JSON.stringify({
      type: "session.update",
      session: { instructions: phase, voice: "alloy" }
    }));

  }, [phase]);

  const connectArduino = async () => {
  try {
    // close existing connection if any
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

    await new AudioContext().resume();

    console.log("Connected to Arduino ✅");
  } catch (err) {
    console.error("Connection failed:", err);
  }
};

  return (
    <div className="flex gap-4">
      <button
        onClick={startSession}
        disabled={callActive}
        className={`h-14 w-1/2 m-5 ${activeButtonClass} cursor-pointer rounded-lg`}
      >
        Start
      </button>

      <button
        onClick={endSession}
        disabled={!callActive}
        className={`h-14 w-1/2 m-5 ${activeButtonClass} cursor-pointer rounded-lg`}
      >
        End
      </button>

      {callActive && !isPaused && (
        <button
          onClick={pauseSession}
          className={`h-14 w-1/2 m-5 ${activeButtonClass} cursor-pointer rounded-lg`}
        >
          Pause
        </button>
      )}

      {callActive && isPaused && (
        <button
          onClick={resumeSession}
          className={`h-14 w-1/2 m-5 ${activeButtonClass} cursor-pointer rounded-lg`}
        >
          Resume
        </button>
      )}

      {callActive && (
        <button
          onClick={connectArduino}
          className={`h-14 w-1/2 m-5 ${activeButtonClass} cursor-pointer rounded-lg`}
        >
          Arduino
        </button>
      )}
    </div>
  );
}