'use client'

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

interface ChatPanelProps {
  sessionId: string
  apiUrl: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{
    video_id: string
    chunk_id: string
    text: string
  }>
}

export default function ChatPanel({ sessionId, apiUrl }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await axios.post(`${apiUrl}/api/chat`, {
        session_id: sessionId,
        message: input,
      })

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response,
        sources: response.data.sources,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Error: Could not process your message. Please try again.',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-t-lg">
        <h3 className="font-bold text-lg">💬 Chat</h3>
        <p className="text-sm text-gray-200">Ask questions about the videos</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p className="mb-2">👋 Start a conversation</p>
            <p className="text-sm">Ask about engagement, content comparison, or improvements</p>
          </div>
        )}

        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-700 text-gray-100 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 text-xs text-gray-300 border-t border-gray-600 pt-2">
                  <p className="font-semibold">Sources:</p>
                  {message.sources.map((source, i) => (
                    <p key={i} className="truncate">
                      • {source.video_id}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 px-4 py-2 rounded-lg rounded-bl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-700 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={loading}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-semibold transition text-sm"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}