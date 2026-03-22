"use client"

interface BotAvatarProps {
  seed: string
  size?: number
  className?: string
}

export default function BotAvatar({ seed, size = 32, className = "" }: BotAvatarProps) {
  const url = `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0d1a35`

  return (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      style={{ imageRendering: "auto" }}
    />
  )
}
