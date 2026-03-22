#!/usr/bin/env node
/**
 * ADP Auto-Tweet Script — X Algorithm Optimized
 * 
 * Generates engagement-focused tweets using GPT-4o-mini (~€0.001/tweet)
 * and posts via Twitter API v2. Link goes in a reply (not main tweet)
 * because X suppresses tweets with external links by ~50%.
 *
 * Usage:
 *   node scripts/tweet-adp.mjs              # generate + post + reply with link
 *   node scripts/tweet-adp.mjs --dry-run    # generate only, don't post
 *   node scripts/tweet-adp.mjs --preview    # show tweet and ask for confirmation
 *   node scripts/tweet-adp.mjs --no-reply   # post without link reply
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
const ADP_DASHBOARD_URL = `${process.env.ADP_BASE_URL || "https://www.agentdiscovery.io"}/api/adp/dashboard?summary=true`
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
const noReply = process.argv.includes("--no-reply")

// ── Tweet style rotation ────────────────────────────────────────
// X rewards variety. We rotate between different tweet styles.
const TWEET_STYLES = [
  "hot_take",       // Bold opinion about AI agents / autonomous commerce
  "stat_highlight", // Focus on one impressive stat with context
  "question",       // Ask the audience a question to drive replies
  "comparison",     // Compare ADP to traditional approaches
  "milestone",      // Celebrate a network milestone
  "builder_call",   // Call to action for developers/builders
]

function pickStyle() {
  // Use day-of-year to rotate styles predictably (different style each day)
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  return TWEET_STYLES[dayOfYear % TWEET_STYLES.length]
}

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

  const style = pickStyle()
  console.log(`🤖 Generating tweet (style: ${style})...`)

  const styleInstructions = {
    hot_take: `Write a bold, slightly provocative take about why AI agents need their own commerce protocol. Use the stats as proof. Make people want to reply — agree or disagree. Example tone: "Everyone's building AI chatbots. Meanwhile, ${stats.totalAgents} agents on ADP are closing real deals without any human in the loop."`,
    stat_highlight: `Pick the SINGLE most impressive stat and make it the star. Add context that makes it meaningful. Example: "X negotiations. Zero human interventions. That's not a demo — that's a live protocol."`,
    question: `Ask a thought-provoking question about AI agent commerce that invites replies. Weave in 1 stat naturally. Example: "If AI agents can negotiate and close deals autonomously, what's the role of a marketplace? ${stats.completedTransactions} transactions say: optional."`,
    comparison: `Compare how things work today (manual, slow, middlemen) vs how ADP works (autonomous, instant, direct). Use 1 stat. Example: "Traditional B2B: weeks of emails, calls, proposals. ADP: ${stats.totalNegotiations} negotiations completed by autonomous agents. No inbox required."`,
    milestone: `Frame a stat as a milestone worth noting. Keep it understated — confidence, not hype. Example: "${stats.totalAgents} agents now live on the ADP network. No VC funding. No launch event. Just an open protocol doing its thing."`,
    builder_call: `Speak directly to developers and AI builders. Make ADP sound like the obvious infrastructure choice. Example: "Building an AI agent? It can already discover services, negotiate prices, and close deals via ADP. Open protocol. ${stats.totalAgents} agents and growing."`,
  }

  const prompt = `You are @Agent_Discovery on X/Twitter — the voice of Agent Discovery Protocol (ADP), an open protocol for autonomous AI agent commerce.

LIVE network stats:
- ${stats.totalAgents} registered agents
- ${stats.activeCapabilities} active services
- ${stats.totalNegotiations} negotiations processed
- ${stats.acceptedNegotiations || 0} deals closed autonomously
- ${stats.completedTransactions} completed transactions
- ${stats.totalVolume ? "€" + (stats.totalVolume / 100).toFixed(2) + " total volume" : "growing volume"}

STYLE FOR THIS TWEET: ${style}
${styleInstructions[style]}

CRITICAL RULES:
- Max 260 characters (shorter is better — X rewards concise tweets)
- NO links (the link goes in a separate reply — X suppresses tweets with links)
- NO emojis. NO rocket ships. Clean and sharp.
- Max 1 hashtag. Prefer no hashtags if the tweet is strong without them.
- Do NOT start with "Just", "We just", "Exciting", or "Introducing"
- Write like a confident builder, not a marketer
- The tweet should make someone want to reply, quote-tweet, or click your profile
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
      max_tokens: 100,
      temperature: 0.95,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI error: ${res.status} ${err}`)
  }

  const json = await res.json()
  let tweet = json.choices[0].message.content.trim()
  // Remove wrapping quotes if the model adds them
  if (tweet.startsWith('"') && tweet.endsWith('"')) tweet = tweet.slice(1, -1)

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

function generateOAuthHeader(method, url) {
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

async function postTweet(text, replyToId = null) {
  if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
    throw new Error("Missing Twitter API credentials. Set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET")
  }

  const authHeader = generateOAuthHeader("POST", TWITTER_TWEET_URL)

  const body = { text }
  if (replyToId) {
    body.reply = { in_reply_to_tweet_id: replyToId }
  }

  const res = await fetch(TWITTER_TWEET_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Twitter API error: ${res.status} ${err}`)
  }

  const json = await res.json()
  return json.data
}

// ── Link reply templates ────────────────────────────────────────
const REPLY_TEMPLATES = [
  "Open protocol. Open source.\nagentdiscovery.io",
  "Read the spec, try the API, or just watch it work:\nagentdiscovery.io",
  "Live dashboard + full API docs:\nagentdiscovery.io",
  "See the live network:\nagentdiscovery.io/dashboard",
  "agentdiscovery.io — open protocol, zero cost to join.",
  "Docs + live demo:\nagentdiscovery.io/docs",
]

function pickReplyTemplate() {
  return REPLY_TEMPLATES[Math.floor(Math.random() * REPLY_TEMPLATES.length)]
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  try {
    const stats = await fetchADPStats()
    console.log(`   Agents: ${stats.totalAgents} | Services: ${stats.activeCapabilities} | Deals: ${stats.completedTransactions}\n`)

    const tweet = await generateTweet(stats)
    const replyText = pickReplyTemplate()

    console.log(`\n📝 Main tweet (${tweet.length} chars):\n`)
    console.log(`   "${tweet}"\n`)
    if (!noReply) {
      console.log(`💬 Reply (with link):\n`)
      console.log(`   "${replyText}"\n`)
    }

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

    // Post main tweet (no link = better reach)
    console.log("🐦 Posting main tweet...")
    const result = await postTweet(tweet)
    console.log(`✅ Posted! Tweet ID: ${result.id}`)
    console.log(`   https://x.com/Agent_Discovery/status/${result.id}`)

    // Post reply with link (drives traffic without hurting main tweet reach)
    if (!noReply) {
      // Small delay to look natural
      await new Promise(r => setTimeout(r, 2000))
      console.log("💬 Posting reply with link...")
      const reply = await postTweet(replyText, result.id)
      console.log(`✅ Reply posted! ID: ${reply.id}`)
    }

    console.log("\n🎯 Done! Main tweet has no link (better reach), link is in the reply.")
  } catch (err) {
    console.error(`❌ Error: ${err.message}`)
    process.exit(1)
  }
}

main()
