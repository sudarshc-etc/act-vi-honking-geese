"use client";

import { useEffect, useState } from "react";

export default function CustomPhasesSlider({
  participantLabel,
  onPhaseChange,
  isParticipant1,
}: {
  participantLabel: string;
  onPhaseChange: (phase: string) => void;
  isParticipant1?: boolean;
}) {
  const [value, setValue] = useState(0);

  const phases = [
    { value: 0, label: "happy" },
    { value: 25, label: "sad" },
    { value: 50, label: "angry" },
    { value: 75, label: "confused" },
    { value: 100, label: "sarcastic" },
  ];

  useEffect(() => {
    const selected = phases.find((p) => p.value === value);
    if (selected) {
      onPhaseChange(selected.label);
    }
  }, [value, onPhaseChange]);

  return (
    <div className="w-full mt-6 pt-6 border-t border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <span className="text-gray-500 text-xs font-mono uppercase tracking-widest">
          {participantLabel} EMOTION OVERRIDE
        </span>
        <span className="text-sm font-black uppercase tracking-widest text-sky-500">
          [{phases.find(p => p.value === value)?.label}]
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        step="25"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-sky-500 cursor-pointer mb-2"
      />

      <div className="relative w-full h-4 mt-2">
        {phases.map((p) => (
          <div
            key={p.value}
            className="absolute flex flex-col items-center"
            style={{ left: `${p.value}%`, transform: "translateX(-50%)" }}
          >
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                value === p.value ? "bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.8)]" : "bg-gray-700"
              }`}
            ></div>
            <span className={`text-[10px] mt-2 font-mono uppercase tracking-wider ${
              value === p.value ? "text-sky-400 font-bold" : "text-gray-600"
            }`}>
              {p.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}