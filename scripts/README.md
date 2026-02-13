# ADP Twitter Auto-Post Script

Posts tweets with live ADP network stats. Uses GPT-4o-mini (~€0.001/tweet) to generate varied, on-brand tweets.

## Setup

1. Create a `.env` file in the project root with:

```
OPENAI_API_KEY=sk-...

# Twitter API v2 (OAuth 1.0a — needs Read+Write access)
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
```

2. Get Twitter credentials:
   - Go to https://developer.twitter.com/en/portal/dashboard
   - Create a project + app (Free tier is fine for posting)
   - Under "Keys and tokens", generate:
     - **API Key and Secret** (Consumer Keys)
     - **Access Token and Secret** (with Read+Write permissions)

3. Get OpenAI API key:
   - Go to https://platform.openai.com/api-keys

## Usage

```bash
# Preview tweet without posting
node scripts/tweet-adp.mjs --dry-run

# Generate and ask for confirmation before posting
node scripts/tweet-adp.mjs --preview

# Generate and post immediately
node scripts/tweet-adp.mjs
```

## Cost

- **OpenAI**: ~€0.001 per tweet (GPT-4o-mini)
- **Twitter API**: Free tier allows 1,500 tweets/month
- **Total**: essentially free vs €2/tweet with Frits

## Automate (optional)

Add a cron job to post daily:

```bash
# Post every day at 10:00 AM
0 10 * * * cd /path/to/agentdiscovery.io && node scripts/tweet-adp.mjs >> /tmp/adp-tweets.log 2>&1
```
