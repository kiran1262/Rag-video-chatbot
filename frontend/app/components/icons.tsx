import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

/* Brand marks ---------------------------------------------------------- */

export function YouTubeMark({ className = 'w-5 h-5', ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...p}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
    </svg>
  )
}

/* Instagram mark — uses its own gradient so it reads on any background */
export function InstagramMark({ className = 'w-5 h-5', ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden {...p}>
      <defs>
        <linearGradient id="ig-mark" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEDA77" />
          <stop offset="0.4" stopColor="#DD2A7B" />
          <stop offset="0.7" stopColor="#8134AF" />
          <stop offset="1" stopColor="#515BD4" />
        </linearGradient>
      </defs>
      <rect x="2.2" y="2.2" width="19.6" height="19.6" rx="5.5" stroke="url(#ig-mark)" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" stroke="url(#ig-mark)" strokeWidth="1.8" />
      <circle cx="17.4" cy="6.6" r="1.3" fill="url(#ig-mark)" />
    </svg>
  )
}

/* Metric + UI glyphs (stroke style) ------------------------------------ */

export function PlayIcon({ className = 'w-5 h-5', ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...p}>
      <path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z" />
    </svg>
  )
}

export function EyeIcon({ className = 'w-5 h-5', ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden {...p}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function HeartIcon({ className = 'w-5 h-5', ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden {...p}>
      <path d="M12 20s-7.5-4.7-9.7-9.2C.9 7.9 2.4 5 5.4 5c2 0 3.3 1.1 4.1 2.3.4.6.6.9.5.9s.1-.3.5-.9C11.3 6.1 12.6 5 14.6 5c3 0 4.5 2.9 3.1 5.8C19.5 15.3 12 20 12 20Z" />
    </svg>
  )
}

export function CommentIcon({ className = 'w-5 h-5', ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden {...p}>
      <path d="M21 12a8 8 0 0 1-8 8H6l-3 3v-3a8 8 0 1 1 18-8Z" />
    </svg>
  )
}

export function UsersIcon({ className = 'w-5 h-5', ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden {...p}>
      <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" />
      <circle cx="10" cy="8" r="3.2" />
      <path d="M20 19v-1.4a3.5 3.5 0 0 0-2.6-3.4M15.5 5.2a3.2 3.2 0 0 1 0 6" />
    </svg>
  )
}

export function BoltIcon({ className = 'w-5 h-5', ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...p}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  )
}

export function SparkIcon({ className = 'w-5 h-5', ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...p}>
      <path d="M12 2c.5 4.5 2.5 6.5 7 7-4.5.5-6.5 2.5-7 7-.5-4.5-2.5-6.5-7-7 4.5-.5 6.5-2.5 7-7Z" />
      <path d="M19 13c.3 2.3 1.2 3.2 3.5 3.5-2.3.3-3.2 1.2-3.5 3.5-.3-2.3-1.2-3.2-3.5-3.5 2.3-.3 3.2-1.2 3.5-3.5Z" opacity=".7" />
    </svg>
  )
}

export function SendIcon({ className = 'w-5 h-5', ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden {...p}>
      <path d="m4 12 16-8-6 16-3.5-6L4 12Z" />
    </svg>
  )
}

export function LinkIcon({ className = 'w-5 h-5', ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden {...p}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" />
    </svg>
  )
}

export function ArrowRightIcon({ className = 'w-5 h-5', ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}
