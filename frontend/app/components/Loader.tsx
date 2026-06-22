'use client'

import { useEffect, useState } from 'react'
import {
  PlayIcon,
  InstagramMark,
  SparkIcon,
} from './icons'

interface LoaderProps {
  className?: string
}

const STEPS = [
  'Fetching video metadata',
  'Pulling transcripts',
  'Chunking & cleaning',
  'Embedding with Gemini',
  'Indexing vectors',
] as const

export default function Loader({ className }: LoaderProps) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      // Advance through steps, then loop back to keep the "lab" alive.
      setActive((i) => (i + 1) % (STEPS.length + 1))
    }, 1300)
    return () => clearInterval(id)
  }, [])

  const finishing = active >= STEPS.length

  return (
    <div
      className={`relative flex w-full flex-col items-center justify-center overflow-hidden px-6 py-10 ${
        className ?? ''
      }`}
    >
      {/* faint grid backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/0 via-ink/0 to-ink" />

      <div className="relative flex w-full max-w-md flex-col items-center animate-fadeUp">
        {/* ── Dueling emblems ─────────────────────────────── */}
        <div className="flex items-center justify-center gap-7 sm:gap-10">
          {/* LEFT — YouTube */}
          <div className="relative flex h-24 w-24 items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-yt/40 animate-pulse-ring" />
            <span className="absolute inset-0 rounded-full border border-yt/25 animate-pulse-ring delay-3" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-yt shadow-glow-yt animate-floaty">
              <span className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/15 to-transparent" />
              <PlayIcon className="relative h-7 w-7 translate-x-[1px] text-cream" />
            </div>
          </div>

          {/* VS */}
          <span className="font-display text-lg font-bold tracking-[0.2em] text-fog select-none">
            VS
          </span>

          {/* RIGHT — Instagram */}
          <div className="relative flex h-24 w-24 items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-ig-gradient/40 animate-pulse-ring delay-2" />
            <span className="absolute inset-0 rounded-full ig-gradient opacity-20 animate-pulse-ring delay-4" />
            {/* spinning gradient ring */}
            <div className="absolute h-16 w-16 rounded-2xl ig-gradient shadow-glow-ig animate-spin-slow" />
            {/* static inner disc + upright mark */}
            <div className="relative flex h-[3.1rem] w-[3.1rem] items-center justify-center rounded-[0.95rem] bg-surface">
              <InstagramMark className="h-7 w-7 text-cream" />
            </div>
          </div>
        </div>

        {/* ── Pipeline status ─────────────────────────────── */}
        <ul className="mt-9 w-full space-y-2.5">
          {STEPS.map((label, i) => {
            const done = !finishing && i < active
            const isActive = !finishing && i === active
            const allDone = finishing
            return (
              <li
                key={label}
                className={`flex items-center gap-3 text-sm transition-colors duration-300 ${
                  isActive
                    ? 'text-cream'
                    : done || allDone
                    ? 'text-fog'
                    : 'text-fog/40'
                }`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {done || allDone ? (
                    <CheckGlyph />
                  ) : isActive ? (
                    <span className="relative flex h-3 w-3 items-center justify-center">
                      <span className="absolute h-3 w-3 rounded-full ig-gradient opacity-30 animate-pulse-ring" />
                      <span className="h-1.5 w-1.5 rounded-full ig-gradient animate-bob" />
                    </span>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-line" />
                  )}
                </span>
                <span className={isActive ? 'font-medium' : undefined}>{label}</span>
                {isActive && (
                  <SparkIcon className="ml-auto h-3.5 w-3.5 text-ig-pink animate-floaty" />
                )}
              </li>
            )
          })}
        </ul>

        {/* ── Indeterminate progress track ────────────────── */}
        <div className="mt-7 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
          <div className="h-full w-full rounded-full ig-gradient shimmer animate-shimmer" />
        </div>

        {/* ── Caption ─────────────────────────────────────── */}
        <p className="mt-4 text-center text-xs leading-relaxed text-fog">
          {finishing
            ? 'Finishing up — almost ready to chat.'
            : 'Crunching engagement signals — this takes a few seconds.'}
        </p>
      </div>
    </div>
  )
}

function CheckGlyph() {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full ig-gradient shadow-glow-ig">
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className="h-2.5 w-2.5 text-cream"
        aria-hidden="true"
      >
        <path
          d="M3.5 8.5l3 3 6-7"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
