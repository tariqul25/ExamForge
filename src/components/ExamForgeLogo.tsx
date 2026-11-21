import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function ExamForgeLogo({ className = '', size = 36, showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* SVG Brand Icon */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="innerGlow" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Background rounded squircle */}
          <rect width="100" height="100" rx="26" fill="url(#lensGrad)" />

          {/* Outer Lens Optical Ring */}
          <circle cx="50" cy="50" r="34" stroke="white" strokeWidth="4" strokeOpacity="0.4" strokeDasharray="6 3" />

          {/* Precision Focus Brackets (Camera Lens view) */}
          <path d="M26 38 V26 H38" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M74 38 V26 H62" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M26 62 V74 H38" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M74 62 V74 H62" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Central Open Book & Focus Prism Core */}
          <path
            d="M50 42 C44 38 34 38 34 46 V66 C34 66 44 65 50 69 C56 65 66 66 66 66 V46 C66 38 56 38 50 42 Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path d="M50 42 V69" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />

          {/* Smart Spark Star (Top Right of Lens) */}
          <circle cx="68" cy="32" r="3.5" fill="#fde047" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400 bg-clip-text text-transparent">
              ExamForge
            </span>
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wide">
            Smart Competitive Exam & Note Prep
          </span>
        </div>
      )}
    </div>
  );
}
