"use client";

import { useEffect, useRef, useState } from "react";

const PIN_LENGTH = 4;

export function PinPad({ hasError }: { hasError?: boolean }) {
  const [pin, setPin] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      containerRef.current?.closest("form")?.requestSubmit();
    }
  }, [pin]);

  function press(digit: string) {
    setPin((p) => (p.length < PIN_LENGTH ? p + digit : p));
  }

  function backspace() {
    setPin((p) => p.slice(0, -1));
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-6">
      <input type="hidden" name="pin" value={pin} readOnly />

      <div
        key={hasError ? "error" : "ok"}
        className={`flex gap-3 ${hasError ? "animate-[shake_0.4s_ease-in-out]" : ""}`}
        aria-live="polite"
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border-2 transition-colors ${
              i < pin.length ? "border-brand bg-brand" : "border-card-border bg-transparent"
            }`}
          />
        ))}
      </div>

      {hasError && (
        <p className="-mt-3 text-sm font-semibold text-danger">
          That PIN isn&apos;t right - try again!
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => press(digit)}
            className="h-16 w-16 rounded-2xl bg-brand-soft font-display text-2xl font-bold text-brand-dark transition-transform active:scale-95"
          >
            {digit}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => press("0")}
          className="h-16 w-16 rounded-2xl bg-brand-soft font-display text-2xl font-bold text-brand-dark transition-transform active:scale-95"
        >
          0
        </button>
        <button
          type="button"
          onClick={backspace}
          aria-label="Backspace"
          className="h-16 w-16 rounded-2xl text-xl text-muted transition-transform active:scale-95"
        >
          ⌫
        </button>
      </div>

      <style>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-8px); }
          40%, 60% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
