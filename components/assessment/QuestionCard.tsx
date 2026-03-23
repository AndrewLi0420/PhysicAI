"use client";

import { useState } from "react";
import type { TreeOption } from "@/types";

interface QuestionCardProps {
  prompt: string;
  options: TreeOption[];
  onSelect: (index: number) => void;
  questionNumber: number;
}

export default function QuestionCard({
  prompt,
  options,
  onSelect,
  questionNumber,
}: QuestionCardProps) {
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  function handleTap(index: number) {
    if (pressedIndex !== null) return; // debounce double-tap
    setPressedIndex(index);
    // Brief highlight, then advance
    setTimeout(() => {
      onSelect(index);
      setPressedIndex(null);
    }, 120);
  }

  return (
    // key is set by the parent to trigger re-mount animation on question change
    <div className="animate-in fade-in slide-in-from-right-4 duration-200 flex flex-col gap-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
        Question {questionNumber}
      </p>

      <h2 className="text-xl font-bold text-gray-900 leading-snug">
        {prompt}
      </h2>

      <div className="flex flex-col gap-3 mt-2">
        {options.map((option, i) => {
          const isPressed = pressedIndex === i;
          return (
            <button
              key={i}
              onClick={() => handleTap(i)}
              disabled={pressedIndex !== null}
              className={[
                "w-full text-left px-5 py-4 rounded-2xl border-2 font-medium text-sm leading-snug",
                "transition-all duration-100 active:scale-[0.98]",
                isPressed
                  ? "border-blue-500 bg-blue-500 text-white scale-[0.98]"
                  : "border-gray-100 bg-gray-50 text-gray-800 hover:border-blue-200 hover:bg-blue-50",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
