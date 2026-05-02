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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full bg-card rounded-lg shadow-soft border border-destructive/20 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
            <p className="text-muted-foreground mb-4">{message}</p>
            
            <div className="flex gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-primary-foreground rounded-lg transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              )}
              {showHomeButton && (
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition"
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
