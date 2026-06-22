'use client'

import { useState } from 'react'
import axios from 'axios'
import VideoCard from './components/VideoCard'
import ChatPanel from './components/ChatPanel'
import Loader from './components/Loader'
import {
  YouTubeMark,
  InstagramMark,
  SparkIcon,
  ArrowRightIcon,
  BoltIcon,
} from './components/icons'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface VideoData {
  platform: string
  title: string
  views: number
  likes: number
  comments: number
  creator: string
  followers: number
  engagement_rate: number
  transcript_chunks: number
}

const newSession = () => `session_${Date.now()}`

export default function Home() {
  const [sessionId, setSessionId] = useState(newSession)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [videos, setVideos] = useState<{ youtube?: VideoData; instagram?: VideoData } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleProcessVideos = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API_URL}/api/process-videos`, {
        youtube_url: youtubeUrl,
        instagram_url: instagramUrl,
        session_id: sessionId,
      })
      if (res.data.status === 'success') {
        setVideos(res.data.videos)
      } else {
        setError('The lab could not process those URLs. Double-check them and try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing videos')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setVideos(null)
    setError('')
    setYoutubeUrl('')
    setInstagramUrl('')
    setSessionId(newSession())
  }

  return (
    <main className="relative min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-yt shadow-glow-yt ring-2 ring-ink">
                <YouTubeMark className="h-4 w-4 text-cream" />
              </span>
              <span className="ig-gradient flex h-9 w-9 items-center justify-center rounded-xl shadow-glow-ig ring-2 ring-ink">
                <InstagramMark className="h-4 w-4 text-cream" />
              </span>
            </div>
            <div className="leading-tight">
              <p className="font-display text-lg font-extrabold tracking-tight text-cream">
                Reel<span className="text-ig-gradient">Lab</span>
              </p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-fog">Engagement Analyzer</p>
            </div>
          </div>

          {videos && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs font-medium text-cream transition-colors hover:border-fog/60"
            >
              <SparkIcon className="h-3.5 w-3.5 text-ig-pink" />
              New comparison
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        {/* Hero + input form */}
        {!videos && !loading && (
          <section className="animate-fadeUp">
            <div className="mx-auto max-w-2xl text-center">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3.5 py-1.5 text-xs text-fog">
                <BoltIcon className="h-3.5 w-3.5 text-yt" />
                RAG-powered, grounded in real transcripts
              </span>
              <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-cream sm:text-6xl">
                <span className="text-yt">YouTube</span>{' '}
                <span className="text-fog">vs</span>{' '}
                <span className="text-ig-gradient">Instagram</span>
              </h1>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-fog">
                Drop one video from each platform. The lab pulls transcripts and metrics, then lets you
                interrogate why one out-performs the other.
              </p>
            </div>

            <form
              onSubmit={handleProcessVideos}
              className="mx-auto mt-10 max-w-2xl space-y-4 rounded-3xl border border-line bg-surface/70 p-6 shadow-panel backdrop-blur"
            >
              {/* YouTube field */}
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-fog">
                  <YouTubeMark className="h-4 w-4 text-yt" /> YouTube URL
                </span>
                <div className="flex items-center gap-3 rounded-xl border border-line bg-ink/60 px-4 transition-colors focus-within:border-yt/60">
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=…"
                    required
                    className="w-full bg-transparent py-3 text-sm text-cream placeholder:text-fog/60 focus:outline-none"
                  />
                </div>
              </label>

              {/* Instagram field */}
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-fog">
                  <InstagramMark className="h-4 w-4" /> Instagram URL
                </span>
                <div className="flex items-center gap-3 rounded-xl border border-line bg-ink/60 px-4 transition-colors focus-within:border-ig-pink/60">
                  <input
                    type="text"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://www.instagram.com/reel/…"
                    required
                    className="w-full bg-transparent py-3 text-sm text-cream placeholder:text-fog/60 focus:outline-none"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="ig-gradient group flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-display text-sm font-bold text-cream shadow-glow-ig transition-transform hover:scale-[1.01] disabled:opacity-50"
              >
                Analyze the matchup
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              {error && (
                <p className="rounded-xl border border-yt/30 bg-yt/10 px-4 py-3 text-sm text-yt">{error}</p>
              )}
            </form>
          </section>
        )}

        {/* Loading */}
        {loading && (
          <div className="animate-fadeUp rounded-3xl border border-line bg-surface/50 shadow-panel">
            <Loader className="min-h-[60vh]" />
          </div>
        )}

        {/* Results */}
        {videos && !loading && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {videos.youtube && (
                  <VideoCard video={videos.youtube} platform="youtube" title="YouTube" />
                )}
                {videos.instagram && (
                  <VideoCard video={videos.instagram} platform="instagram" title="Instagram" />
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 h-[calc(100vh-8rem)] min-h-[520px]">
                <ChatPanel sessionId={sessionId} apiUrl={API_URL} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
