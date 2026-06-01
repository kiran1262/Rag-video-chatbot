'use client'

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import VideoCard from './components/VideoCard'
import ChatPanel from './components/ChatPanel'

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

export default function Home() {
  const [sessionId] = useState(`session_${Date.now()}`)
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
      const response = await axios.post(`${API_URL}/api/process-videos`, {
        youtube_url: youtubeUrl,
        instagram_url: instagramUrl,
        session_id: sessionId,
      })

      if (response.data.status === 'success') {
        setVideos(response.data.videos)
      } else {
        setError('Failed to process videos')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing videos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            RAG Video Chatbot 🎥
          </h1>
          <p className="text-gray-400">Compare social media videos and get AI-powered insights</p>
        </div>

        {/* Input Form */}
        {!videos && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
            <form onSubmit={handleProcessVideos} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">YouTube URL</label>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Instagram Reel URL</label>
                <input
                  type="text"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://www.instagram.com/reel/..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 font-semibold py-2 rounded-lg transition"
              >
                {loading ? 'Processing...' : 'Process Videos'}
              </button>
            </form>
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
        )}

        {/* Videos and Chat */}
        {videos && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Cards */}
            <div className="lg:col-span-2 space-y-6">
              {videos.youtube && (
                <VideoCard 
                  video={videos.youtube} 
                  platform="youtube"
                  title="YouTube Video"
                />
              )}
              {videos.instagram && (
                <VideoCard 
                  video={videos.instagram}
                  platform="instagram"
                  title="Instagram Reel"
                />
              )}
            </div>

            {/* Chat Panel */}
            <div className="lg:col-span-1">
              <ChatPanel 
                sessionId={sessionId}
                apiUrl={API_URL}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}