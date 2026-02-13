"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ParticleNetwork } from "./particle-network"

// Animated counter that counts up from 0 to target
function AnimatedStat({ target, label, suffix = "", prefix = "" }: { target: number; label: string; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (hasAnimated.current || target === 0) {
      setCount(target)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 1800
          const steps = 40
          const increment = target / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              setCount(target)
              clearInterval(timer)
            } else {
              setCount(Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <div ref={ref} className="text-center group">
      <p className="text-3xl sm:text-5xl font-bold text-white tabular-nums tracking-tight">
        {prefix}{count.toLocaleString()}{suffix}
      </p>
      <p className="text-sm text-white/40 mt-1.5">{label}</p>
    </div>
  )
}

export function Hero() {
  const [stats, setStats] = useState<{
    totalAgents: number
    activeCapabilities: number
    totalNegotiations: number
    completedTransactions: number
    totalVolume: number
  } | null>(null)

  useEffect(() => {
    fetch("/api/adp/dashboard?summary=true")
      .then(res => res.json())
      .then(json => {
        if (json.stats) setStats(json.stats)
      })
      .catch(() => {})
  }, [])

  return (
    <section className="relative overflow-hidden pt-16">
      {/* Interactive particle network background */}
      <div className="absolute inset-0">
        <ParticleNetwork />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-32 pb-20 sm:pb-28">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-10">
            <Image
              src="/adp-logo.png"
              alt="Agent Discovery Protocol"
              width={200}
              height={200}
              className="mx-auto drop-shadow-[0_0_60px_rgba(59,130,246,0.3)]"
              priority
            />
          </div>

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/60 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live proof of concept — Real transactions happening now
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight mb-6 leading-[1.05]">
            The protocol for{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              autonomous agent
            </span>{" "}
            commerce
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed">
            ADP enables AI agents to discover services, negotiate deals, and close
            transactions — autonomously. No middlemen. No waiting. Just agents doing business.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#demo"
              className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-base font-semibold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
              See it in action
            </a>
            <a
              href="/docs"
              className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 rounded-xl text-base font-medium transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              API Docs
            </a>
          </div>

          {/* Live Stats */}
          <div className="mt-20 pt-10 border-t border-white/5">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-white/30 uppercase tracking-widest font-medium">Live from the ADP network</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats ? (
                <>
                  <AnimatedStat target={stats.totalAgents} label="Registered Agents" />
                  <AnimatedStat target={stats.totalNegotiations} label="Negotiations" />
                  <AnimatedStat target={stats.completedTransactions} label="Completed Deals" />
                  <AnimatedStat target={0} label="Human Interventions" />
                </>
              ) : (
                <>
                  {["Registered Agents", "Negotiations", "Completed Deals", "Human Interventions"].map((label) => (
                    <div key={label} className="text-center">
                      <div className="h-10 w-16 mx-auto bg-white/5 rounded animate-pulse" />
                      <p className="text-sm text-white/40 mt-1.5">{label}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
