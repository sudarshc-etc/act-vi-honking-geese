"use client";
import { useState, useEffect } from "react";

export default function CustomPhasesSlider({gooseName} : {gooseName:string}) {
  const [value, setValue] = useState(0);
  const [phase, setPhase] = useState('');

  const phases = [
    { value: 0, label: "happy" },
    { value: 25, label: "sad" },
    { value: 50, label: "angry" },
    { value: 75, label: "confused" },
    { value: 100, label: "sarcastic" },
  ];

  let phaseSliderColor = gooseName === 'Nala' ? 'accent-pink-500' : 'accent-blue-500';

  let phaseBulletColor = gooseName === 'Nala' ? 'bg-pink-500' : 'bg-blue-500';

  useEffect(()=>{
    let phase = phases.filter((phase)=>{return phase.value === value;});
    setPhase(phase[0].label);
  },[value]);


  return (
    <div className="w-full max-w-md mx-auto m-10">
        <h1 className="m-3 flex justify-center text-4xl font-bold text-white-900">{gooseName} Phases</h1>
      <input
        type="range"
        min="0"
        max="100"
        step="25"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className={`w-full ${phaseSliderColor}`}
      />

      {/* phases */}
      <div className="relative w-full mt-2">
        {phases.map((phase) => (
          <div
            key={phase.value}
            className="absolute flex flex-col items-center"
            style={{ left: `${phase.value}%`, transform: "translateX(-50%)" }}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                value === phase.value ? phaseBulletColor : "bg-gray-400"
              }`}
            ></div>
            <span className="text-xs mt-1">{phase.label}</span>
          </div>
        ))}
      </div>

      <p className="mt-11 text-center text-sm text-gray-600">
        {gooseName} is now prompted to be: {phase}
      </p>
    </div>
  );
}