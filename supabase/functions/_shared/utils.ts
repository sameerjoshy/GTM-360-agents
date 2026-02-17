// Shared utilities for all GTM-360 agent edge functions

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function corsResponse() {
  return new Response('ok', { headers: CORS_HEADERS })
}

export function successResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    status: 200,
  })
}

export function errorResponse(message, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    status,
  })
}

// ── Tavily search ────────────────────────────────────────────────────────────
export async function tavilySearch(query, options = {}) {
  const TAVILY_KEY = Deno.env.get('TAVILY_API_KEY')
  if (!TAVILY_KEY) throw new Error('TAVILY_API_KEY not set')

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_KEY,
      query,
      search_depth: options.depth || 'basic',
      max_results: options.maxResults || 5,
      include_answer: options.includeAnswer !== false,
      include_raw_content: false,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Tavily error: ${err}`)
  }
  return res.json()
}

// ── OpenRouter LLM call ──────────────────────────────────────────────────────
export async function llmCall({ system, user, schema, model, temperature = 0.3 }) {
  const OPENROUTER_KEY = Deno.env.get('OPENROUTER_API_KEY')
  if (!OPENROUTER_KEY) throw new Error('OPENROUTER_API_KEY not set')

  // Model routing: use best free model per task type
  const selectedModel = model || 'qwen/qwen-2.5-7b-instruct'

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]

  // If schema requested, append JSON instruction
  if (schema) {
    messages[0].content += `\n\nCRITICAL: Respond ONLY with valid JSON matching this exact schema. No markdown, no code blocks, no preamble:\n${JSON.stringify(schema, null, 2)}`
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://agents.gtm-360.com',
      'X-Title': 'GTM-360 Agents',
    },
    body: JSON.stringify({
      model: selectedModel,
      messages,
      temperature,
      max_tokens: 2000,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LLM error: ${err}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty LLM response')

  // Parse JSON if schema was requested
  if (schema) {
    try {
      return JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
    } catch {
      throw new Error(`LLM returned invalid JSON: ${content.slice(0, 200)}`)
    }
  }

  return content
}

// ── Self-critique step ───────────────────────────────────────────────────────
// Every agent output passes through this before returning to frontend
export async function selfCritique(output, rules) {
  const critique = await llmCall({
    system: `You are a quality gate for a GTM intelligence agent. 
Your job is to score the output against the rules and return a structured assessment.
Rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}
Return JSON: { "passed": boolean, "score": 1-10, "issues": string[], "improvements": string[] }`,
    user: `Output to evaluate:\n${JSON.stringify(output, null, 2)}`,
    schema: { passed: true, score: 8, issues: [], improvements: [] },
    model: 'qwen/qwen-2.5-7b-instruct', // Fast + cheap for verification
    temperature: 0.1,
  })
  return critique
}

// ── Confidence scorer ────────────────────────────────────────────────────────
export function scoreConfidence(factors) {
  // factors: array of { present: boolean, weight: number }
  const total = factors.reduce((sum, f) => sum + f.weight, 0)
  const score = factors.reduce((sum, f) => sum + (f.present ? f.weight : 0), 0)
  const ratio = score / total
  if (ratio >= 0.75) return 'high'
  if (ratio >= 0.4) return 'medium'
  return 'low'
}

// ── Gap detector ─────────────────────────────────────────────────────────────
export function detectGaps(payload, requiredFields) {
  return requiredFields
    .filter(f => !payload[f] || payload[f] === '')
    .map(f => `${f.replace(/_/g, ' ')} not provided`)
}
