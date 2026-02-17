import { corsResponse, successResponse, errorResponse, llmCall, tavilySearch, scoreConfidence, detectGaps } from '../_shared/utils.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const payload = await req.json()
    const { account_name, health_score, utilisation, feature_notes, account_domain } = payload

    const gaps = detectGaps(payload, ['account_name', 'health_score', 'utilisation'])

    // Health gate: only Green accounts
    const healthScoreNum = health_score ? parseInt(health_score.toString().split('/')[0]) : 0
    if (healthScoreNum < 70) {
      return successResponse({
        confidence: 'n/a',
        blocked_reason: 'Expansion Radar only processes Green health accounts (score >70). This account is below threshold.',
        current_health: `${healthScoreNum}/100`,
        gaps: ['Account health must be >70 for expansion assessment'],
        _meta: { agent: 'expansion-radar', blocked: true, health_gate_failed: true }
      })
    }

    const utilisationNum = parseFloat(utilisation || 0)

    // Check for external hiring signal if domain provided
    let hiringSignal = null
    if (account_domain) {
      try {
        const domain = account_domain.replace(/https?:\/\//, '').replace(/\/$/, '')
        const searchResult = await tavilySearch(`${domain} hiring jobs growth ${new Date().getFullYear()}`, { maxResults: 2, depth: 'basic' })
        if (searchResult.results && searchResult.results.length > 0) {
          hiringSignal = searchResult.results[0].title
        }
      } catch {
        // Tavily failed, continue without external signal
      }
    }

    const confidence = scoreConfidence([
      { present: healthScoreNum >= 80, weight: 3 },
      { present: utilisationNum >= 85, weight: 4 },
      { present: !!feature_notes && feature_notes.length > 50, weight: 2 },
      { present: !!hiringSignal, weight: 1 },
    ])

    const SYSTEM = `You are an Expansion Readiness analyst at GTM-360.
Your job is to identify when accounts are ready to expand — before they ask.

EXPANSION READINESS CRITERIA:
- Health: Must be Green (>70)
- Utilisation: >85% seat utilisation OR 30-day spike in premium feature usage
- External signals: Hiring in buyer role at the account (optional but strong signal)

READINESS SCORE (1-5 stars):
⭐ - Below threshold
⭐⭐ - Early signals present
⭐⭐⭐ - Multiple signals aligned
⭐⭐⭐⭐ - Strong utilisation + external validation
⭐⭐⭐⭐⭐ - All signals aligned, timing is now

EXPANSION BRIEF STRUCTURE:
- Why now: specific signals that indicate readiness
- What product: which tier/SKU/module makes sense based on usage
- What framing: how to position the expansion based on their current usage patterns
- Timing: when to raise the conversation (now vs next QBR vs wait)

HARD RULES:
- No expansion brief if utilisation <85% AND no premium feature spike
- CSM can override with "Not expansion ready" flag — if present, suppress for 60 days
- This is an internal brief for the CSM, NOT a customer-facing proposal

Do NOT draft the proposal. Surface readiness and framing only.`

    const USER = `Account: ${account_name}
Health Score: ${health_score}
Seat Utilisation: ${utilisation}%
${feature_notes ? `Feature Adoption Notes:\n${feature_notes}\n` : 'Feature data: Not provided'}
${hiringSignal ? `External Hiring Signal: ${hiringSignal}` : 'No external hiring signals detected'}`

    const SCHEMA = {
      expansion_readiness_stars: "number 1-5",
      readiness_reasoning: "string — why this score",
      expansion_brief: {
        why_now: "string — specific signals",
        what_product: "string — which SKU/tier/module",
        what_framing: "string — how to position",
        timing_recommendation: "string — when to raise",
      },
      key_signals: "array of strings — utilisation, feature spikes, external hiring, etc.",
      gaps: "array of strings — what would strengthen the expansion case",
    }

    const synthesis = await llmCall({ system: SYSTEM, user: USER, schema: SCHEMA, temperature: 0.25 })

    return successResponse({
      confidence,
      account_name,
      expansion_readiness: `${'⭐'.repeat(synthesis.expansion_readiness_stars)} (${synthesis.expansion_readiness_stars}/5)`,
      readiness_reasoning: synthesis.readiness_reasoning,
      expansion_brief: synthesis.expansion_brief,
      key_signals: synthesis.key_signals,
      ...(hiringSignal && { external_signal: hiringSignal }),
      gaps: [...gaps, ...(synthesis.gaps || [])],
      note: 'This is an internal CSM brief. Proposal drafting is a separate step the CSM owns.',
      _meta: {
        agent: 'expansion-radar',
        health_score: healthScoreNum,
        utilisation: utilisationNum,
        readiness_stars: synthesis.expansion_readiness_stars,
        handoff_to_signals_scout: synthesis.expansion_readiness_stars >= 4,
      }
    })

  } catch (err) {
    console.error('Expansion Radar error:', err)
    return errorResponse(err.message)
  }
})
