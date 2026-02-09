"use client"

import { motion } from "framer-motion"
import { Star, MapPin, Clock, ChevronRight } from "lucide-react"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface MatchCardProps {
  match: any
  index: number
  onSelect: (match: any) => void
}

export default function MatchCard({ match, index, onSelect }: MatchCardProps) {
  const agent = match.agent || match.provider || {}
  const rawScore = match.matchScore ?? match.relevanceScore ?? 0
  const score = Math.round(rawScore * 100)
  const scoreColor = score >= 90 ? "text-green-400" : score >= 70 ? "text-yellow-400" : "text-white/40"
  const scoreBg = score >= 90 ? "bg-green-500/10 border-green-500/20" : score >= 70 ? "bg-yellow-500/10 border-yellow-500/20" : "bg-white/5 border-white/10"

  const price = (match.capability?.pricing || {}) as { askingPrice?: number; currency?: string }
  const priceDisplay = price?.askingPrice
    ? `€${(price.askingPrice / 100).toFixed(2)}`
    : "Op aanvraag"

  const reputation = parseFloat(agent.reputationScore || "0")

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => onSelect(match)}
      className="w-full text-left bg-[#111827] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{match.capability?.title}</h3>
          <p className="text-sm text-white/40 truncate">{agent.name}</p>
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-sm font-bold ${scoreBg} ${scoreColor}`}>
          {score}%
        </div>
      </div>

      {match.capability?.description && (
        <p className="text-sm text-white/50 mb-3 line-clamp-2">{match.capability.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-white/30">
        {reputation > 0 && (
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            {reputation.toFixed(1)}
            {agent.totalTransactions > 0 && (
              <span>({agent.totalTransactions})</span>
            )}
          </span>
        )}
        {match.distance !== undefined && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {match.distance < 1 ? "<1 km" : `${Math.round(match.distance)} km`}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Beschikbaar
        </span>
        <span className="ml-auto font-semibold text-white/60">{priceDisplay}</span>
        <ChevronRight className="w-4 h-4 text-white/20" />
      </div>
    </motion.button>
  )
}
