'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  ArrowLeft,
  Sparkles,
  FileText,
  AlertCircle
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  relevantFiles?: string[]
  confidence?: 'high' | 'medium' | 'low'
}

export default function Chat() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const contextId = searchParams?.get('contextId')
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contextId) {
      router.push('/')
      return
    }

    fetchSuggestions()
  }, [contextId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/suggestions/${contextId}`
      )
      if (response.ok) {
        const result = await response.json()
        setSuggestions(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    }
  }

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contextId,
            question,
            conversationHistory: messages.slice(-10), // Last 10 messages for context
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const result = await response.json()
      const assistantMessage: Message = {
        role: 'assistant',
        content: result.data.answer,
        timestamp: new Date().toISOString(),
        relevantFiles: result.data.relevantFiles,
        confidence: result.data.confidence,
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/dashboard?contextId=${contextId}`)}
                className="text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  AI Assistant
                </h1>
                <p className="text-sm text-gray-500">Ask questions about the repository</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              Context-aware
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                How can I help you?
              </h2>
              <p className="text-gray-600 mb-8">
                Ask me anything about this repository
              </p>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="max-w-2xl mx-auto">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Suggested questions:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-left p-4 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition group"
                      >
                        <span className="text-gray-700 group-hover:text-blue-700">
                          {suggestion}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <MessageBubble key={index} message={message} />
              ))}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the repository..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-gray-200' : 'bg-blue-100'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-gray-600" />
        ) : (
          <Bot className="w-5 h-5 text-blue-600" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'flex justify-end' : ''}`}>
        <div className={`rounded-lg p-4 ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-white border border-gray-200'
        }`}>
          <p className={`whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-800'}`}>
            {message.content}
          </p>

          {/* Relevant Files */}
          {message.relevantFiles && message.relevantFiles.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <FileText className="w-4 h-4" />
                <span className="font-medium">Relevant files:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {message.relevantFiles.map((file, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono"
                  >
                    {file}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Confidence Indicator */}
          {message.confidence && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              {message.confidence === 'high' && (
                <span className="text-green-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  High confidence
                </span>
              )}
              {message.confidence === 'medium' && (
                <span className="text-yellow-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Medium confidence
                </span>
              )}
              {message.confidence === 'low' && (
                <span className="text-gray-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Low confidence
                </span>
              )}
            </div>
          )}

          {/* Timestamp */}
          <p className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  )
}

// Made with Bob
