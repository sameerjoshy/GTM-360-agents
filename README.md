# GTM-360 Agents

The GTM-360 Agent Swarm — 16 agents across Strategy, Sales, Marketing, CS, and RevOps.

## Stack
- **Frontend:** Vite + React + Tailwind CSS
- **Backend:** Supabase Edge Functions
- **Deployment:** Cloudflare Pages

## Local Development

```bash
npm install
cp .env.example .env.local  # add your Supabase keys
npm run dev
```

## Cloudflare Pages Setup (one-time)

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Click **Create a project → Connect to Git**
3. Select the `GTM-360-agents` repository
4. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Environment variables (Settings → Environment variables):
   - `VITE_SUPABASE_URL` = `https://uffuxawgzmqogzljjzbg.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click **Save and Deploy**

## Custom Domain (agents.gtm-360.com)

After first deploy:
1. In Cloudflare Pages → your project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter `agents.gtm-360.com`
4. Cloudflare auto-adds the DNS record if your domain is on Cloudflare (it is)

## Agent Architecture

Every live agent runs a 4-step chain:

```
GATHER → real data from Tavily / HubSpot / user input
VALIDATE → quality check, gap detection, confidence scoring
SYNTHESISE → LLM call (OpenRouter) with structured schema + self-critique
VERIFY → output checked against rules before returning
```

## Supabase Edge Functions

Edge functions live in `/supabase/functions/`. Each agent has its own function.
Deploy all functions:

```bash
supabase functions deploy --project-ref uffuxawgzmqogzljjzbg
```
