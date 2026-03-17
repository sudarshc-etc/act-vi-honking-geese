import CustomPhasesSlider from "../shared/CustomPhasesSlider";
import { useEffect, useState } from "react";
import HumeWebSocketCall from "./HumeWebSocketCall";

export default function Chat({
  accessToken,
}: {
  accessToken: string;
}) {
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  
    // Capture mic ONCE
    useEffect(() => {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(setMicStream)
        .catch(console.error);
    }, []);
  return (
    <div>
      <h1 className="m-3 flex justify-center font-bold text-heading md:text-5xl lg:text-6xl">
        <span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">The Geese Matchmaking Show  (Hume AI Version).</span>
      </h1>
      <div className="grid md:grid-cols-2 gap-1 content-evenly">
        <div className="p-10 border-4 border-gray-500">
          <CustomPhasesSlider gooseName = 'Simba'/>
          <HumeWebSocketCall gooseName="Simba" accessToken={accessToken}/>
        </div>
        <div className="p-10 border-4 border-gray-500">
          <CustomPhasesSlider gooseName = 'Nala'/>
          <HumeWebSocketCall gooseName="Nala" accessToken={accessToken}/>
        </div>
      </div>
    </div>
  );
}
