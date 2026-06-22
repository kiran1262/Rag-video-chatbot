'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import axios from 'axios'
import { SparkIcon, SendIcon, YouTubeMark, InstagramMark } from './icons'

interface ChatPanelProps {
  sessionId: string
  apiUrl: string
}

interface Source {
  video_id: string
  chunk_id: string
  text: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
}

const SUGGESTIONS = [
  'Why did one get more engagement?',
  'Compare the hooks in the first 5 seconds',
  "Who's the creator and their follower count?",
  'Suggest improvements for the reel',
]

/* ---------- markdown-lite renderer (no deps, no dangerous HTML) ---------- */

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Split an (already-escaped) line into inline nodes: `code`, **bold**, *italic* / _italic_.
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let i = 0
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    const token = match[0]
    const key = `${keyPrefix}-${i++}`
    if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-ink/70 px-1.5 py-0.5 font-mono text-[0.82em] text-yt/90 ring-1 ring-line"
        >
          {token.slice(1, -1)}
        </code>,
      )
    } else if (token.startsWith('**')) {
      nodes.push(
        <strong key={key} className="font-semibold text-cream">
          {token.slice(2, -2)}
        </strong>,
      )
    } else {
      nodes.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>,
      )
    }
    lastIndex = pattern.lastIndex
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

// Render an escaped multiline block, preserving single newlines as <br>.
function renderTextBlock(raw: string, keyPrefix: string): ReactNode[] {
  const lines = raw.split('\n')
  const out: ReactNode[] = []
  lines.forEach((line, idx) => {
    if (idx > 0) out.push(<br key={`${keyPrefix}-br-${idx}`} />)
    out.push(...renderInline(line, `${keyPrefix}-l${idx}`))
  })
  return out
}

function renderMarkdown(input: string): ReactNode[] {
  const escaped = escapeHtml(input)
  const blocks = escaped.split(/\n[ \t]*\n/)
  const elements: ReactNode[] = []

  blocks.forEach((block, bIdx) => {
    const rawLines = block.split('\n')
    const listLines = rawLines.filter((l) => /^\s*[*-]\s+/.test(l))
    const isList = listLines.length > 0 && rawLines.every((l) => /^\s*[*-]\s+/.test(l) || l.trim() === '')

    if (isList) {
      elements.push(
        <ul key={`b-${bIdx}`} className="my-1 space-y-1 pl-1">
          {listLines.map((l, liIdx) => (
            <li key={`b-${bIdx}-li-${liIdx}`} className="flex gap-2">
              <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-yt" aria-hidden />
              <span>{renderInline(l.replace(/^\s*[*-]\s+/, ''), `b-${bIdx}-li-${liIdx}`)}</span>
            </li>
          ))}
        </ul>,
      )
    } else {
      elements.push(
        <p key={`b-${bIdx}`} className="leading-relaxed [&:not(:first-child)]:mt-2">
          {renderTextBlock(block, `b-${bIdx}`)}
        </p>,
      )
    }
  })

  return elements
}

/* ---------- source chips ---------- */

function platformOf(videoId: string): 'youtube' | 'instagram' | 'other' {
  if (videoId.endsWith(':youtube')) return 'youtube'
  if (videoId.endsWith(':instagram')) return 'instagram'
  return 'other'
}

function SourceChips({ sources }: { sources: Source[] }) {
  const seen = new Set<string>()
  const unique = sources.filter((s) => {
    if (seen.has(s.video_id)) return false
    seen.add(s.video_id)
    return true
  })
  if (unique.length === 0) return null

  return (
    <div className="mt-2.5 flex flex-wrap gap-2">
      {unique.map((s) => {
        const platform = platformOf(s.video_id)
        if (platform === 'youtube') {
          return (
            <span
              key={s.video_id}
              title={s.text}
              className="inline-flex items-center gap-1.5 rounded-full border border-yt/40 bg-yt/5 px-2.5 py-1 text-[0.7rem] font-medium text-yt transition-colors hover:border-yt/70"
            >
              <YouTubeMark className="h-3.5 w-3.5" />
              YouTube
            </span>
          )
        }
        if (platform === 'instagram') {
          return (
            <span
              key={s.video_id}
              title={s.text}
              className="inline-flex items-center gap-1.5 rounded-full border-ig-gradient px-2.5 py-1 text-[0.7rem] font-medium text-cream transition-opacity hover:opacity-80"
            >
              <InstagramMark className="h-3.5 w-3.5" />
              Instagram
            </span>
          )
        }
        return (
          <span
            key={s.video_id}
            title={s.text}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[0.7rem] font-medium text-fog"
          >
            Source
          </span>
        )
      })}
    </div>
  )
}

/* ---------- assistant avatar ---------- */

function AssistantAvatar() {
  return (
    <div className="ig-gradient shrink-0 rounded-full p-[1.5px] shadow-glow-ig">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface">
        <SparkIcon className="h-4 w-4 text-cream" />
      </div>
    </div>
  )
}

/* ---------- main component ---------- */

export default function ChatPanel({ sessionId, apiUrl }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const scrollAnchorRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  function resizeTextarea() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const max = 5 * 24 + 16 // ~5 rows
    el.style.height = `${Math.min(el.scrollHeight, max)}px`
  }

  function resetTextarea() {
    const el = textareaRef.current
    if (el) el.style.height = 'auto'
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setInput('')
    resetTextarea()
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setLoading(true)

    try {
      const response = await axios.post(`${apiUrl}/api/chat`, {
        session_id: sessionId,
        message: trimmed,
      })
      const data = response.data as { response: string; sources: Source[] }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response, sources: data.sources },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error: could not reach the lab. Try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(input)
    }
  }

  const canSend = input.trim().length > 0 && !loading

  return (
    <div className="flex h-full animate-fadeUp flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-panel">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        <div className="ig-gradient flex h-10 w-10 items-center justify-center rounded-xl shadow-glow-ig">
          <SparkIcon className="h-5 w-5 text-cream" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold leading-tight text-cream">Ask the Lab</h2>
          <p className="truncate text-xs text-fog">Grounded in the two videos</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-2 text-center">
            <div className="ig-gradient mb-4 flex h-14 w-14 animate-floaty items-center justify-center rounded-2xl shadow-glow-ig">
              <SparkIcon className="h-7 w-7 text-cream" />
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-fog">
              Ask anything about the two clips &mdash; I&apos;ll answer with receipts from the transcripts and metrics.
            </p>
            <div className="mt-6 grid w-full max-w-md grid-cols-1 gap-2.5 sm:grid-cols-2">
              {SUGGESTIONS.map((q, i) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
                  className={`group flex animate-fadeUp items-center gap-2 rounded-xl border border-line bg-surface2 px-3.5 py-3 text-left text-xs text-cream/90 transition-all hover:-translate-y-0.5 hover:border-ig-gradient delay-${i + 1}`}
                >
                  <SparkIcon className="h-3.5 w-3.5 shrink-0 text-fog transition-colors group-hover:text-yt" />
                  <span className="leading-snug">{q}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, idx) =>
            m.role === 'user' ? (
              <div key={idx} className="flex animate-fadeUp justify-end">
                <div className="max-w-[82%] rounded-2xl rounded-br-md bg-cream px-4 py-2.5 text-sm font-medium text-ink shadow-sm">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={idx} className="flex animate-fadeUp items-start gap-2.5">
                <AssistantAvatar />
                <div className="min-w-0 max-w-[85%]">
                  <div className="rounded-2xl rounded-bl-md bg-surface2 px-4 py-3 text-sm text-cream">
                    {renderMarkdown(m.content)}
                  </div>
                  {m.sources && m.sources.length > 0 && <SourceChips sources={m.sources} />}
                </div>
              </div>
            ),
          )
        )}

        {loading && (
          <div className="flex animate-fadeUp items-start gap-2.5">
            <AssistantAvatar />
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-surface2 px-4 py-4">
              <span className="h-2 w-2 animate-bob rounded-full bg-fog delay-1" />
              <span className="h-2 w-2 animate-bob rounded-full bg-fog delay-2" />
              <span className="h-2 w-2 animate-bob rounded-full bg-fog delay-3" />
            </div>
          </div>
        )}

        <div ref={scrollAnchorRef} />
      </div>

      {/* Input dock */}
      <form onSubmit={handleSubmit} className="border-t border-line px-3 py-3">
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-surface2 px-3 py-2 transition-colors focus-within:border-fog/50">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            disabled={loading}
            placeholder="Ask the lab…"
            onChange={(e) => {
              setInput(e.target.value)
              resizeTextarea()
            }}
            onKeyDown={handleKeyDown}
            className="max-h-[136px] flex-1 resize-none bg-transparent py-1.5 text-sm text-cream placeholder:text-fog/70 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className="ig-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cream shadow-glow-ig transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
