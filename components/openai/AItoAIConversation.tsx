"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { NALA_BASE_PROMPTS, SIMBA_BASE_PROMPTS, NALA_VOICE, SIMBA_VOICE } from "./OpenAIConstants";
import { AIAgentHandle } from "./AIAgentHandle";

const AItoAIConversation = forwardRef<AIAgentHandle, {
  gooseName: string;
  phase: string;
  onMessage?: (text: string) => void;
}>(
function AItoAIConversation({ gooseName, phase, onMessage }, ref) {
  const [active, setActive] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isSimba = gooseName === "Simba";
  const activeButtonClass = isSimba
    ? "bg-linear-to-t from-sky-500 to-indigo-500"
    : "bg-linear-65 from-purple-500 to-pink-500";

  useEffect(() => {
    audioRef.current = document.createElement("audio");
    audioRef.current.autoplay = true;
    audioRef.current.controls = true;
    document.body.appendChild(audioRef.current);

    return () => {
      pcRef.current?.close();
      audioRef.current?.remove();
    };
  }, []);

  function createSilentAudioTrack() {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    oscillator.frequency.value = 0;
    const dst = ctx.createMediaStreamDestination();
    oscillator.connect(dst);
    oscillator.start();
    const track = dst.stream.getAudioTracks()[0];
    track.enabled = false;
    return track;
  }

  const startSession = async () => {
    if (active) return;

    const pc = new RTCPeerConnection();
    pcRef.current = pc;
    pc.addTrack(createSilentAudioTrack());

    pc.ontrack = (e) => {
      if (audioRef.current) {
        audioRef.current.srcObject = e.streams[0];
        audioRef.current.play().catch(() => console.warn("Autoplay blocked"));
      }
    };

    const dc = pc.createDataChannel("oai-events");
    dcRef.current = dc;

    dc.onopen = () => {
      dc.send(JSON.stringify({
        type: "session.update",
        session: {
          voice: isSimba ? SIMBA_VOICE : NALA_VOICE,
          instructions: isSimba ? SIMBA_BASE_PROMPTS : NALA_BASE_PROMPTS
        }
      }));
      dc.send(JSON.stringify({ type: "response.create" }));
    };

    dc.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      if (data.type === "response.output_text" || data.type === "response.output_text.delta") {
        const text = data.text || data.delta;
        if (text && onMessage) onMessage(text);
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sessionRes = await fetch("/api/openai/session", { method: "POST" });
    const session = await sessionRes.json();

    const answerRes = await fetch(
      "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.client_secret.value}`,
          "Content-Type": "application/sdp",
          "OpenAI-Beta": "realtime=v1"
        },
        body: offer.sdp
      }
    );

    const sdp = await answerRes.text();
    await pc.setRemoteDescription({ type: "answer", sdp });
    setActive(true);
  };

  const endSession = () => {
    dcRef.current?.close();
    pcRef.current?.close();
    pcRef.current = null;
    setActive(false);
  };

  const sendMessage = (text: string) => {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    dcRef.current.send(JSON.stringify({ type: "input_text", text }));
    dcRef.current.send(JSON.stringify({ type: "response.create" }));
  };

  const interrupt = () => {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    dcRef.current.send(JSON.stringify({ type: "response.cancel" }));
  };

  useEffect(() => {
    if (!dcRef.current || !active) return;
    dcRef.current.send(JSON.stringify({
      type: "session.update",
      session: { instructions: `Emotional tone: ${phase}. Speak strongly.` }
    }));
  }, [phase]);

  useImperativeHandle(ref, () => ({ startSession, endSession, sendMessage, interrupt }));

  return (
    <div className="flex gap-4">
      <button onClick={startSession} disabled={active} className={`h-14 w-1/2 m-5 ${activeButtonClass} cursor-pointer rounded-lg`}>Start</button>
      <button onClick={endSession} disabled={!active} className={`h-14 w-1/2 m-5 ${activeButtonClass} cursor-pointer rounded-lg`}>End</button>
    </div>
  );
});

export default AItoAIConversation;