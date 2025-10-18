// src/components/Layout.jsx
import React from "react";
import "../index.css";
import ChatBot from "./ChatBot";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

/** Slim vertical handle between cavity and panel (matches mockup depth) */
const SideHandle = ({ className = "" }) => (
  <div
    aria-hidden="true"
    className={`rounded-full ${className}`}
    style={{
      width: 22,
      background:
        "linear-gradient(180deg,#DFB884 0%, #B57A49 48%, #A2663B 100%)",
      boxShadow:
        "inset 0 2px 3px rgba(255,255,255,.5), inset 0 -2px 3px rgba(0,0,0,.25), 0 8px 18px rgba(0,0,0,.20)",
      border: "1px solid rgba(255,255,255,.5)",
    }}
  />
);

/** Pixel-perfect SVG replica of the microwave control panel (right side) */
const MicrowavePanel = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 240 640"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Panel base */}
    <defs>
      <linearGradient id="panelBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFF6E4" />
        <stop offset="100%" stopColor="#F6E0AF" />
      </linearGradient>
      <linearGradient id="bezel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#EED7A9" />
        <stop offset="100%" stopColor="#DDC28D" />
      </linearGradient>
      <filter id="softDrop" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
        <feOffset dx="0" dy="2" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.25" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Keycap gradients */}
      <linearGradient id="keycap" x1="0.35" y1="0.25" x2="0.9" y2="0.95">
        <stop offset="0%" stopColor="#9B6A3A" />
        <stop offset="70%" stopColor="#7A4F28" />
      </linearGradient>
      <linearGradient id="keycapHilite" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(255,255,255,.55)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>

      {/* Screen greens */}
      <linearGradient id="screen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#B2E7A7" />
        <stop offset="100%" stopColor="#8FCE7E" />
      </linearGradient>
    </defs>

    {/* Outer bezel with rounded right side */}
    <rect
      x="0.5"
      y="0.5"
      width="239"
      height="639"
      rx="36"
      fill="url(#panelBg)"
      stroke="url(#bezel)"
      strokeWidth="3"
      filter="url(#softDrop)"
    />

    {/* Inset inner rim */}
    <rect
      x="8"
      y="8"
      width="224"
      height="624"
      rx="30"
      fill="none"
      stroke="rgba(255,255,255,.65)"
      strokeWidth="2"
    />

    {/* --- Screen --- */}
    <g transform="translate(24,28)">
      {/* recess */}
      <rect x="0" y="0" width="192" height="60" rx="12" fill="#1E1E1E" opacity=".18" />
      {/* screen bezel */}
      <rect x="8" y="8" width="176" height="44" rx="8" fill="#2A2A2A" />
      {/* glow */}
      <rect x="16" y="14" width="160" height="32" rx="6" fill="url(#screen)" />
      <rect x="16" y="14" width="160" height="32" rx="6" fill="rgba(255,255,255,.15)" />
    </g>

    {/* --- 3×3 keypad --- */}
    <g transform="translate(28,132)">
      {Array.from({ length: 9 }).map((_, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = col * 56;
        const y = row * 56;
        return (
          <g key={i} transform={`translate(${x},${y})`}>
            <rect
              x="0"
              y="0"
              width="44"
              height="44"
              rx="10"
              fill="url(#keycap)"
              filter="url(#softDrop)"
            />
            {/* highlight */}
            <rect x="4" y="4" width="36" height="14" rx="6" fill="url(#keycapHilite)" />
            {/* rim */}
            <rect
              x="0.5"
              y="0.5"
              width="43"
              height="43"
              rx="10"
              fill="none"
              stroke="rgba(0,0,0,.18)"
            />
          </g>
        );
      })}
    </g>

    {/* --- Vent module --- */}
    <g transform="translate(28,310)">
      <rect x="0" y="0" width="184" height="82" rx="10" fill="#F7ECD1" stroke="#E3CDA2" />
      <rect x="8" y="10" width="168" height="62" rx="8" fill="#FFF6E0" stroke="#EAD4A9" />
      {[0, 1, 2, 3, 4].map((r, idx) => (
        <rect
          key={idx}
          x="22"
          y={18 + idx * 10}
          width="136"
          height="6"
          rx="3"
          fill="#E1C18C"
          opacity="0.9"
        />
      ))}
      {/* light inset */}
      <rect x="8" y="10" width="168" height="12" rx="8" fill="rgba(255,255,255,.55)" />
    </g>

/* --- Bottom round buttons (smaller) --- */
<g transform="translate(40,520)">
  {/* brown */}
  <circle cx="0" cy="0" r="22" fill="url(#keycap)" filter="url(#softDrop)" />
  <ellipse cx="-5" cy="-7" rx="9" ry="6" fill="rgba(255,255,255,.25)" />
  {/* orange */}
  <g transform="translate(160,0)">
    <radialGradient id="orangeBtn" cx="32%" cy="30%" r="80%">
      <stop offset="0%" stopColor="#FFA24D" />
      <stop offset="70%" stopColor="#F07A22" />
    </radialGradient>
    <circle cx="0" cy="0" r="22" fill="url(#orangeBtn)" filter="url(#softDrop)" />
    <ellipse cx="-5" cy="-7" rx="9" ry="6" fill="rgba(255,255,255,.28)" />
    {/* small slash icon */}
    <rect
      x="-4"
      y="-3"
      width="14"
      height="6"
      rx="3"
      fill="#9B5020"
      transform="rotate(-25)"
      opacity=".9"
    />
  </g>
</g>
  </svg>
);

export default function Layout() {
  return (
    <div
      className="on-wood min-h-screen bg-cover bg-no-repeat flex flex-col items-center justify-center relative px-6 py-12 overflow-hidden"
      style={{ backgroundImage: "url('/woodenbgwalnut.png')" }}
    >
      {/* Header */}
      <header className="relative text-center mb-6 flex flex-col items-center leading-none">
        <img
          src="/chefmascot.png"
          alt="Chef mascot"
          className="w-56 h-auto -mb-1 -mt-2 animate-none"
        />
        <h1 className="dm-title--neon text-[clamp(40px,7vw,78px)] font-extrabold -mt-9 tracking-wide text-center">
          DishMuse
        </h1>
      </header>

      {/* Cake (top-left) */}
      <img
        src="/strawberrycake.png"
        alt="Cake"
        className="absolute top-8 left-12 w-32 md:w-40 md:h-44 lg:w-48 lg:h-52 animate-bounceIn"
      />

      {/* Hanging utensil rack — centered on the left side (between cake & veggie basket) */}
      <img
        src="/utensilstand.png"
        alt="Hanging utensil rack"
        className="
          pointer-events-none select-none
          absolute z-[5]
          left-6 sm:left-8 md:left-10
          top-1/2 -translate-y-1/2
          w-40 sm:w-48 md:w-56 lg:w-64
          drop-shadow-[0_10px_18px_rgba(0,0,0,0.18)]
          opacity-95
        "
      />

      {/* Chat + Microwave frame (light background) */}
      <main className="relative flex flex-col items-center w-full">
        <div className="relative w-[min(96vw,1200px)]">
          <div
            className="
              relative flex flex-col justify-between
              h-[72svh] md:h-[74svh] lg:h-[76svh]
              rounded-[40px]
              bg-gradient-to-b from-[#fff8ec] to-[#fff3de]
              shadow-[0_10px_25px_rgba(0,0,0,0.15)]
              border-[3px] border-[#e8d4a3]
              overflow-hidden
              pr-[260px]  /* reserve space for handle + SVG panel */
            "
          >
            {/* Handle lives just inside panel edge */}
            <SideHandle className="absolute top-[64px] bottom-[64px] right-[238px]" />

            {/* The SVG control panel */}
            <MicrowavePanel className="absolute top-0 right-0 h-full w-[238px] z-20" />

            {/* Chat content */}
            <div className="relative z-10 px-6 pt-6 pb-10 flex flex-col justify-end h-full">
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
          </div>

          {/* Connected pill banner */}
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

      {/* Right-side décor (unchanged) */}
      <div className="pointer-events-none absolute right-4 sm:right-6 lg:right-10 top-4 bottom-4 flex flex-col items-end justify-between gap-6">
        <img src="/fruits.png" alt="Fruits" className="w-28 sm:w-32 md:w-36 lg:w-40 xl:w-44 drop-shadow-lg" />
        <img src="/standmixer.png" alt="Stand mixer" className="w-32 sm:w-36 md:w-44 lg:w-52 xl:w-56 drop-shadow-xl" />
        <img src="/bowls.png" alt="Bowls" className="w-28 sm:w-32 md:w-36 lg:w-40 xl:w-44 drop-shadow-lg animate-float" />
      </div>

      {/* Veggie basket (unchanged) */}
      <div className="absolute bottom-6 left-6">
        <img src="/veggies1.png" alt="Veggie basket" className="w-56 md:w-64 h-auto animate-float" />
      </div>
    </div>
  );
}
