import React from "react";
import "../index.css";
import ChatBot from "./ChatBot";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

const SHOW_DIVIDER = false;

/* ---------- Right control panel (SVG) ---------- */
function MicrowavePanel({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 260 560"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="shell" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff7e9" />
          <stop offset="100%" stopColor="#f5dfb4" />
        </linearGradient>
        <linearGradient id="face" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fffaf1" />
          <stop offset="100%" stopColor="#fde8c1" />
        </linearGradient>
        <linearGradient id="lcd" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#b4e2aa" />
          <stop offset="100%" stopColor="#92d084" />
        </linearGradient>
        <radialGradient id="keycap" cx="35%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#a87349" />
          <stop offset="70%" stopColor="#7a4f2e" />
          <stop offset="100%" stopColor="#6b4428" />
        </radialGradient>
        <linearGradient id="keycapHilite" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,.55)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <linearGradient id="slat" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#e9c792" />
          <stop offset="100%" stopColor="#d2a96b" />
        </linearGradient>
        <radialGradient id="roundBrown" cx="35%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#8b5d39" />
          <stop offset="100%" stopColor="#5f3b23" />
        </radialGradient>
        <radialGradient id="roundOrange" cx="35%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#ffa85c" />
          <stop offset="100%" stopColor="#e57a27" />
        </radialGradient>
        <linearGradient id="handleGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#b07a4d" />
          <stop offset="100%" stopColor="#8a5a34" />
        </linearGradient>
        <filter id="softDrop" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.24" />
        </filter>
        <filter id="inset" x="-10%" y="-10%" width="120%" height="120%">
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1" result="b" />
          <feComposite in="SourceGraphic" in2="b" operator="arithmetic" k2="-1" k3="1" />
        </filter>
      </defs>

      {/* Shell + face */}
      <rect x="0.5" y="0.5" width="259" height="559" rx="28" fill="url(#shell)" stroke="#e7cf9f" />
      <rect x="12" y="12" width="236" height="536" rx="22" fill="url(#face)" stroke="#e6ce9d" />

      {/* Outside handle (full height), on the LEFT edge of the panel */}
      <rect x="8" y="72" width="12" height="416" rx="6" fill="#000" opacity="0.06" />
      <rect x="6" y="72" width="12" height="416" rx="6"
            fill="url(#handleGrad)" style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,.25))" }}/>
      <rect x="6" y="72" width="12" height="416" rx="6" fill="none" stroke="rgba(255,255,255,.35)"/>

      {/* LCD */}
      <g transform="translate(40,26)">
        <rect x="0" y="0" width="180" height="54" rx="10" fill="#2b2b2b" filter="url(#softDrop)" />
        <rect x="10" y="10" width="160" height="34" rx="8" fill="url(#lcd)" />
        <rect x="10" y="10" width="160" height="34" rx="8" fill="none" stroke="rgba(255,255,255,.35)" />
      </g>

      {/* 4×3 keypad under LCD */}
      <g transform="translate(48,106)">
        {Array.from({ length: 12 }).map((_, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const x = col * 42;
          const y = row * 48;
          return (
            <g key={i} transform={`translate(${x},${y})`}>
              <rect x="0" y="0" width="34" height="34" rx="8" fill="url(#keycap)" filter="url(#softDrop)" />
              <rect x="4" y="4" width="26" height="10" rx="5" fill="url(#keycapHilite)" />
              <rect x="0.5" y="0.5" width="33" height="33" rx="8" fill="none" stroke="rgba(0,0,0,.18)" />
            </g>
          );
        })}
      </g>

      {/* Vent */}
      <g transform="translate(48,262)">
        <rect x="0" y="0" width="164" height="86" rx="10" fill="#fff6e6" stroke="#e8c896" filter="url(#inset)" />
        {Array.from({ length: 6 }).map((_, i) => (
          <rect key={i} x="14" y={14 + i * 12} width="136" height="8" rx="4" fill="url(#slat)" />
        ))}
      </g>

      {/* Round buttons — moved UP so the bottom latch can span the width */}
      <g transform="translate(56,448)">{/* left button */}
        <circle cx="24" cy="24" r="22" fill="url(#roundBrown)" filter="url(#softDrop)" />
      </g>
      <g transform="translate(168,448)">{/* right button */}
        <circle cx="24" cy="24" r="22" fill="url(#roundOrange)" filter="url(#softDrop)" />
      </g>

      {/* Full-width PUSH/OPEN latch (fills inner face bottom) */}
      <g transform="translate(12,520)">
        {/* matches inner face width (236) and hugs the bottom */}
        <rect x="0" y="0" width="236" height="30" rx="12"
              fill="#f3ddbb" stroke="#e2c38f" filter="url(#softDrop)"/>
        <rect x="4" y="4" width="228" height="22" rx="10" fill="url(#face)"/>
        <rect x="4" y="4" width="228" height="22" rx="10" fill="none" stroke="rgba(0,0,0,.08)"/>
        {/* grip slot */}
        <rect x="106" y="11" width="24" height="6" rx="3" fill="#d8b98a"/>
      </g>
    </svg>
  );
}


export default function Layout() {
  return (
    <div
      className="on-wood min-h-screen bg-cover bg-no-repeat flex flex-col items-center justify-center relative px-6 py-12 overflow-hidden"
      style={{ backgroundImage: "url('/woodenbgwalnut.png')" }}
    >
      {/* Header */}
      <header className="relative text-center mb-6 flex flex-col items-center leading-none">
        <img src="/chefmascot.png" alt="Chef mascot" className="w-56 h-auto -mb-1 -mt-2 animate-none" />
        <h1 className="dm-title--neon text-[clamp(40px,7vw,78px)] font-extrabold -mt-9 tracking-wide text-center">
          DishMuse
        </h1>
      </header>

      {/* Left decor */}
      <img src="/strawberrycake.png" alt="Cake" className="absolute top-8 left-12 w-32 md:w-40 lg:w-48 animate-bounceIn" />
      <img
        src="/utensilstand.png"
        alt="Hanging utensil rack"
        className="pointer-events-none select-none absolute z-[5] left-6 sm:left-8 md:left-10 top-1/2 -translate-y-1/2 w-40 sm:w-48 md:w-56 lg:w-64 drop-shadow-[0_10px_18px_rgba(0,0,0,0.18)] opacity-95"
      />

      {/* Right-side décor */}
      <div className="pointer-events-none absolute right-4 sm:right-6 lg:right-10 top-4 bottom-4 flex flex-col items-end justify-between gap-6">
        <img src="/fruits.png" alt="Fruits" className="w-28 sm:w-32 md:w-36 lg:w-40 xl:w-44 drop-shadow-lg" />
        <img src="/standmixer.png" alt="Stand mixer" className="w-32 sm:w-36 md:w-44 lg:w-52 xl:w-56 drop-shadow-xl" />
        <img src="/bowls.png" alt="Bowls" className="w-28 sm:w-32 md:w-36 lg:w-40 xl:w-44 drop-shadow-lg animate-float" />
      </div>

      {/* Veggie basket */}
      <div className="absolute bottom-6 left-6">
        <img src="/veggies1.png" alt="Veggie basket" className="w-56 md:w-64 h-auto animate-float" />
      </div>

      {/* Chat + Panel in GRID (panel fills vertically) */}
      <main className="relative flex flex-col items-center w-full">
        <div className="relative w-[min(96vw,1200px)]">
          <div
            className="
              grid grid-cols-[1fr_260px]
              h-[72svh] md:h-[74svh] lg:h-[76svh]
              rounded-[40px]
              bg-gradient-to-b from-[#fff8ec] to-[#fff3de]
              shadow-[0_10px_25px_rgba(0,0,0,0.15)]
              border-[3px] border-[#e8d4a3]
              overflow-hidden
            "
          >
            {/* Chat area */}
            <div className="relative px-6 pt-6 pb-10 flex flex-col h-full min-h-0">
              <ChatBot
                greeting="Welcome to DishMuse! Your recipe assistant. You can type your ingredients or just tap the 📎 paperclip icon to upload a photo of your fridge — I’ll spot what’s inside and suggest recipes!"
                typingIndicator={true}
                emojiReactions={true}
                sendButton={
                  <button className="dm-btn rounded-full p-2" title="Send">
                    <PaperAirplaneIcon className="h-5 w-5 text-white" />
                  </button>
                }
              />
            </div>

            {/* Panel area (fills column) */}
            <div className="relative">
              {SHOW_DIVIDER && (
                <div
                  className="absolute top-[60px] bottom-[60px] -left-[12px] w-[12px] rounded-full z-30"
                  style={{
                    background: "linear-gradient(180deg, #b07a4d 0%, #8a5a34 100%)",
                    boxShadow: "inset 0 1px 4px rgba(255,255,255,0.6), 0 2px 8px rgba(0,0,0,0.22)",
                    border: "1px solid rgba(255,255,255,0.35)",
                  }}
                />
              )}
              <MicrowavePanel className="h-full w-full" />
            </div>
          </div>

          {/* Footer pill */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[-0.25rem] z-20">
            <div
              className="bg-cream w-[clamp(260px,45vw,520px)] py-3 px-8 rounded-full border border-[rgba(242,187,113,0.35)] shadow-[0_6px_14px_rgba(0,0,0,0.12)] flex items-center justify-center gap-2 text-[0.95rem] font-medium text-[var(--panel-text)]"
              style={{ transform: "translateY(50%)" }}
            >
              <span role="img" aria-label="fire">🔥</span>
              <span>Cooking up creativity… wait for the ding!</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
