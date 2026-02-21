"use client";
import { useRef, useState, useEffect } from "react";

export default function OpenAIIntegration({ gooseName }: { gooseName: string }) {
  const [callActive, setCallActive] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = document.createElement("audio");
    audioRef.current.autoplay = true;

    return () => {
      pcRef.current?.close();
      audioRef.current?.remove();
    };
  }, []);

  const startSession = async () => {
    if (callActive) return;

    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    pc.ontrack = (e) => {
      if (audioRef.current) {
        audioRef.current.srcObject = e.streams[0];
      }
    };

    const dc = pc.createDataChannel("oai-events");
    dc.onmessage = (e) => console.log("event:", e.data);
    dcRef.current = dc;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sessionRes = await fetch("/api/openai/session", { method: "POST" });
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

    pcRef.current?.getSenders().forEach(sender => sender.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;

    setCallActive(false);
  };

  return (
    <div className="flex justify-center gap-4">
      <button onClick={startSession} disabled={callActive}>
        Start Session
      </button>
      <button onClick={endSession} disabled={!callActive}>
        End Session
      </button>
    </div>
  );
}