#!/usr/bin/env node
/**
 * ADP Auto-Tweet Script
 * 
 * Fetches live stats from the ADP dashboard API, generates a tweet
 * using GPT-4o-mini (~€0.001/tweet), and posts it via Twitter API v2.
 *
 * Usage:
 *   node scripts/tweet-adp.mjs              # generate + post
 *   node scripts/tweet-adp.mjs --dry-run    # generate only, don't post
 *   node scripts/tweet-adp.mjs --preview    # show tweet and ask for confirmation
 *
 * Required env vars (in .env or exported):
 *   TWITTER_API_KEY
 *   TWITTER_API_SECRET
 *   TWITTER_ACCESS_TOKEN
 *   TWITTER_ACCESS_TOKEN_SECRET
 *   OPENAI_API_KEY
 */

import crypto from "node:crypto"

// ── Config ──────────────────────────────────────────────────────
const ADP_DASHBOARD_URL = "https://www.bidz.nl/api/adp/v1/dashboard?summary=true"
const OPENAI_URL = "https://api.openai.com/v1/chat/completions"
const TWITTER_TWEET_URL = "https://api.twitter.com/2/tweets"

// ── Load .env manually (no dependencies) ────────────────────────
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

try {
  const envPath = resolve(process.cwd(), ".env")
  const envFile = readFileSync(envPath, "utf-8")
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    // Remove surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
} catch {
  // No .env file, rely on exported env vars
}

const {
  TWITTER_API_KEY,
  TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_TOKEN_SECRET,
  OPENAI_API_KEY,
} = process.env

const dryRun = process.argv.includes("--dry-run")
const preview = process.argv.includes("--preview")

// ── Step 1: Fetch live ADP stats ────────────────────────────────
async function fetchADPStats() {
  console.log("📊 Fetching live ADP stats...")
  const res = await fetch(ADP_DASHBOARD_URL)
  if (!res.ok) throw new Error(`ADP API error: ${res.status}`)
  const json = await res.json()
  return json.stats
}

// ── Step 2: Generate tweet with GPT-4o-mini ─────────────────────
async function generateTweet(stats) {
  if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY")

  console.log("🤖 Generating tweet with GPT-4o-mini...")

  const prompt = `You are the social media voice for Agent Discovery Protocol (ADP) — an open protocol that lets AI agents discover services, negotiate deals, and complete transactions autonomously.

Write a single tweet (max 270 chars) based on these LIVE network stats:
- ${stats.totalAgents} registered agents
- ${stats.activeCapabilities} active services
- ${stats.totalNegotiations} negotiations processed
- ${stats.acceptedNegotiations || 0} deals closed
- ${stats.completedTransactions} completed transactions
- ${stats.totalVolume ? "€" + (stats.totalVolume / 100).toFixed(2) + " total volume" : "growing volume"}

Rules:
- Tone: confident, technical, slightly provocative. Think "protocol announcement" not "marketing".
- Include 1-2 relevant stats (not all).
- Vary the angle: sometimes focus on growth, sometimes on the tech, sometimes on what it means for AI.
- End with a link: https://agentdiscovery.io
- Use max 1-2 hashtags from: #ADP #AgentCommerce #AIAgents #AutonomousAgents #OpenProtocol
- NO emojis. NO "🚀". Keep it clean and sharp.
- Do NOT start with "Just" or "We just".
- Output ONLY the tweet text, nothing else.`

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 120,
      temperature: 0.9,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI error: ${res.status} ${err}`)
  }

  const json = await res.json()
  const tweet = json.choices[0].message.content.trim()

  // Token usage for cost tracking
  const usage = json.usage
  const cost = ((usage.prompt_tokens * 0.15 + usage.completion_tokens * 0.6) / 1_000_000).toFixed(6)
  console.log(`   Tokens: ${usage.prompt_tokens} in / ${usage.completion_tokens} out — cost: €${cost}`)

  return tweet
}

// ── Step 3: Post to Twitter via OAuth 1.0a ──────────────────────
function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase())
}

function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
  const sortedParams = Object.keys(params).sort().map(k => `${percentEncode(k)}=${percentEncode(params[k])}`).join("&")
  const baseString = `${method}&${percentEncode(url)}&${percentEncode(sortedParams)}`
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`
  const hmac = crypto.createHmac("sha1", signingKey)
  hmac.update(baseString)
  return hmac.digest("base64")
}

function generateOAuthHeader(method, url, body) {
  const oauthParams = {
    oauth_consumer_key: TWITTER_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: TWITTER_ACCESS_TOKEN,
    oauth_version: "1.0",
  }

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN_SECRET,
  )

  oauthParams.oauth_signature = signature

  const header = "OAuth " + Object.keys(oauthParams)
    .sort()
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(", ")

  return header
}

async function postTweet(text) {
  if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
    throw new Error("Missing Twitter API credentials. Set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET")
  }

  console.log("🐦 Posting to Twitter...")

  const authHeader = generateOAuthHeader("POST", TWITTER_TWEET_URL, { text })

  const res = await fetch(TWITTER_TWEET_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader,
    },
    body: JSON.stringify({ text }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Twitter API error: ${res.status} ${err}`)
  }

  const json = await res.json()
  return json.data
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  try {
    const stats = await fetchADPStats()
    console.log(`   Agents: ${stats.totalAgents} | Services: ${stats.activeCapabilities} | Deals: ${stats.completedTransactions}`)

    const tweet = await generateTweet(stats)
    console.log(`\n📝 Generated tweet (${tweet.length} chars):\n`)
    console.log(`   "${tweet}"\n`)

    if (dryRun) {
      console.log("⏭️  Dry run — not posting.")
      return
    }

    if (preview) {
      const readline = await import("node:readline")
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
      const answer = await new Promise(resolve => rl.question("Post this tweet? (y/n) ", resolve))
      rl.close()
      if (answer.toLowerCase() !== "y") {
        console.log("⏭️  Skipped.")
        return
      }
    }

    const result = await postTweet(tweet)
    console.log(`✅ Posted! Tweet ID: ${result.id}`)
    console.log(`   https://twitter.com/i/web/status/${result.id}`)
  } catch (err) {
    console.error(`❌ Error: ${err.message}`)
    process.exit(1)
  }
}

main()
