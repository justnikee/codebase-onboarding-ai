'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
}

export default function CodeBlock({ code, language = 'text', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      {filename && (
        <div className="bg-card text-muted-foreground px-4 py-2 text-sm font-mono rounded-t-lg border-b border-border">
          {filename}
        </div>
      )}
      <div className="relative">
        <pre className={`bg-background text-foreground p-4 overflow-x-auto text-sm font-mono border border-border ${filename ? 'rounded-b-lg' : 'rounded-lg'}`}>
          <code className={`language-${language}`}>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 bg-card hover:bg-muted text-muted-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}

// Made with Bob
