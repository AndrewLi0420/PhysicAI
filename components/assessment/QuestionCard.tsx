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
      <p className="text-xs font-bold text-ds-text-3 uppercase tracking-widest">
        Question {questionNumber}
      </p>

      <h2 className="font-heading text-xl font-bold text-foreground leading-snug">
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
                "w-full text-left px-5 py-4 rounded-xl border-[1.5px] font-medium text-sm leading-snug",
                "transition-all duration-100 active:scale-[0.98]",
                isPressed
                  ? "border-ds-accent bg-ds-accent text-white scale-[0.98]"
                  : "border-border bg-card text-foreground hover:border-ds-accent/60 hover:bg-ds-accent-lt",
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
