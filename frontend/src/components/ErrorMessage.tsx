import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  showHomeButton?: boolean
}

export default function ErrorMessage({ 
  title = 'Error',
  message, 
  onRetry,
  showHomeButton = true
}: ErrorMessageProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-red-200 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            
            <div className="flex gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              )}
              {showHomeButton && (
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Made with Bob
