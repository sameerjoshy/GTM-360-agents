import { corsResponse, successResponse, errorResponse, llmCall, selfCritique, scoreConfidence, detectGaps } from '../_shared/utils.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const payload = await req.json()
    const { deal_context, deal_stage, deal_value, framework, close_date } = payload

    const gaps = detectGaps(payload, ['deal_context', 'deal_stage', 'deal_value', 'framework'])

    // ── STEP 1 + 2: GATHER + VALIDATE ─────────────────────────────────────────
    const daysSinceActivity = extractDaysSinceActivity(deal_context)
    const contactCount = extractContactCount(deal_context)
    const hasEconomicBuyer = /economic buyer|CFO|CEO|VP|decision maker|budget holder/i.test(deal_context)
    const hasCloseDate = !!close_date
    const hasDealValue = !!deal_value

    const confidence = scoreConfidence([
      { present: deal_context.length > 200, weight: 3 },
      { present: !!deal_stage, weight: 2 },
      { present: hasDealValue, weight: 2 },
      { present: hasCloseDate, weight: 1 },
      { present: hasEconomicBuyer, weight: 2 },
    ])

    // ── STEP 3: SYNTHESISE ────────────────────────────────────────────────────
    const frameworkCriteria = {
      MEDDIC: ['Metrics', 'Economic Buyer', 'Decision Criteria', 'Decision Process', 'Identify Pain', 'Champion'],
      SPICED: ['Situation', 'Pain', 'Impact', 'Critical Event', 'Decision'],
      BANT: ['Budget', 'Authority', 'Need', 'Timeline'],
    }
    const criteria = frameworkCriteria[framework] || frameworkCriteria.MEDDIC

    const SYSTEM = `You are a deal qualification specialist at GTM-360.
Your job is to surface what is missing or at risk in a deal — not to coach the rep on how to sell.

FRAMEWORK: ${framework}
CRITERIA TO EVALUATE: ${criteria.join(', ')}

SCORING RULES:
- present: explicit evidence exists in the notes
- partial: implied but not confirmed
- missing: no evidence found
- Do NOT infer "present" from vague language. "They seem interested" ≠ present Champion.

STAGE INTEGRITY RULES:
- Pass: evidence fully supports the stage
- Flag: 1-2 significant gaps for this stage
- Fail: critical gaps that mean the deal should not be at this stage

LOGIC GATES (apply these hard rules):
- If stage is Proposal or later and no economic buyer: Fail
- If no activity in 14+ days at any stage above Discovery: Flag (stale)
- If only 1 contact engaged at stage 3+: Flag (single-threaded risk)
- If <3 of 6 MEDDIC criteria (or equivalent) present at Proposal+: Fail

Output structured JSON only.`

    const USER = `Deal Stage: ${deal_stage}
Deal Value: $${deal_value?.toLocaleString() || 'not provided'}
Close Date: ${close_date || 'not provided'}
Days Since Last Activity: ${daysSinceActivity || 'unknown'}
Contact Count: ${contactCount || 'unknown'}

Deal Context:
${deal_context}`

    const SCHEMA = {
      scorecard: "object with each framework criterion as key, value is { status: 'present'|'partial'|'missing', evidence: 'string or null' }",
      stage_integrity: "'pass', 'flag', or 'fail'",
      stage_integrity_reason: "string — specific reason for the integrity verdict",
      risk_flags: ["array of specific risk strings, ordered by severity"],
      gap_list: ["array of specific questions the rep should ask to fill each gap"],
      stale_flag: "boolean",
      single_thread_flag: "boolean",
      summary: "string — 2-3 sentence summary of deal health",
    }

    const synthesis = await llmCall({ system: SYSTEM, user: USER, schema: SCHEMA, temperature: 0.2 })

    // ── STEP 4: VERIFY ────────────────────────────────────────────────────────
    const verificationRules = [
      'Stage integrity verdict is consistent with the scorecard — Fail if <3 criteria present at Proposal+',
      'Risk flags are specific to this deal, not generic sales advice',
      'Gap questions are specific and actionable, not generic ("find the economic buyer" requires more specificity)',
      'Stale flag is set if no recent activity is detectable',
    ]
    const verification = await selfCritique(synthesis, verificationRules)

    return successResponse({
      confidence,
      qualification_scorecard: synthesis.scorecard,
      stage_integrity: synthesis.stage_integrity,
      stage_integrity_reason: synthesis.stage_integrity_reason,
      risk_flags: synthesis.risk_flags,
      gap_list: synthesis.gap_list,
      summary: synthesis.summary,
      alerts: [
        ...(synthesis.stale_flag ? ['⚠️ Stale deal — no activity detected in 14+ days'] : []),
        ...(synthesis.single_thread_flag ? ['⚠️ Single-threaded — only one contact engaged'] : []),
        ...(!hasEconomicBuyer && ['Proposal', 'Negotiation'].includes(deal_stage) ? ['🚨 No economic buyer identified at this stage'] : []),
      ],
      gaps,
      _meta: {
        agent: 'qualifier',
        framework,
        verification_score: verification.score,
        handoff_to_deal_room: true,
        handoff_to_forecast: true,
      }
    })

  } catch (err) {
    console.error('Qualifier error:', err)
    return errorResponse(err.message)
  }
})

function extractDaysSinceActivity(text) {
  const match = text.match(/(\d+)\s*days?\s*(ago|since|last)/i)
  return match ? parseInt(match[1]) : null
}

function extractContactCount(text) {
  const contacts = text.match(/\b(contacted|spoke|met|emailed|called)\s+(\w+)/gi)
  return contacts ? contacts.length : null
}
