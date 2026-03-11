"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

export function CopyBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {label && (
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-white/40 uppercase tracking-widest">{label}</span>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      )}
      <div className="px-5 pb-4 pt-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
          {!label && (
            <div className="ml-auto">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        <pre className="font-mono text-sm text-white/60 leading-relaxed whitespace-pre overflow-x-auto">
          {code}
        </pre>
      </div>
    </div>
  )
}
