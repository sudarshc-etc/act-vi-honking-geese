"use client";
import { useEffect, useState } from "react";

export default function CustomPhasesSlider({
  participantLabel,
  onPhaseChange,
  isParticipant1,
}: {
  participantLabel: string;
  onPhaseChange: (phase: string) => void;
  isParticipant1: boolean;
}) {
  const [value, setValue] = useState(0);
  const [phase, setPhase] = useState('happy');

  const phases = [
    { value: 0, label: "happy" },
    { value: 25, label: "sad" },
    { value: 50, label: "angry" },
    { value: 75, label: "confused" },
    { value: 100, label: "sarcastic" },
  ];

  let phaseSliderColor = isParticipant1 ? 'accent-sky-500' : 'accent-pink-500';
  let phaseBulletColor = isParticipant1 ? 'bg-sky-500' : 'bg-pink-500';

  useEffect(() => {
    const selected = phases.find((p) => p.value === value);
    if (selected) {
      onPhaseChange(selected.label);
      setPhase(selected.label);
    }
  }, [value, onPhaseChange]);

  return (
    <div className="w-full max-w-md mx-auto m-5 p-4 bg-gray-900 rounded-lg border border-gray-700 shadow-inner">
      <h2 className={`m-3 flex justify-center text-2xl font-black ${isParticipant1 ? 'text-sky-400' : 'text-pink-400'}`}>
        {participantLabel} Emotion
      </h2>

      <input
        type="range"
        min="0"
        max="100"
        step="25"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className={`w-full ${phaseSliderColor} cursor-pointer`}
      />

      <div className="relative w-full mt-2 h-6">
        {phases.map((p) => (
          <div
            key={p.value}
            className="absolute flex flex-col items-center"
            style={{ left: `${p.value}%`, transform: "translateX(-50%)" }}
          >
            <div
              className={`w-3 h-3 rounded-full border-2 border-gray-900 ${
                value === p.value ? phaseBulletColor : "bg-gray-600"
              }`}
            ></div>
            <span className="text-xs mt-1 text-gray-400 font-medium">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}