import { corsResponse, successResponse, errorResponse, llmCall, scoreConfidence, detectGaps } from '../_shared/utils.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const payload = await req.json()
    const { account_name, usage_summary, support_history, nps_score, engagement_notes } = payload

    const gaps = detectGaps(payload, ['account_name'])

    // Count how many dimensions we have data for
    const dimensions = [
      { name: 'usage', present: !!usage_summary && usage_summary.length > 20 },
      { name: 'engagement', present: !!engagement_notes && engagement_notes.length > 20 },
      { name: 'support', present: !!support_history && support_history.length > 20 },
      { name: 'nps', present: nps_score !== null && nps_score !== undefined },
    ]

    const dimensionsPresent = dimensions.filter(d => d.present).length

    if (dimensionsPresent < 2) {
      return successResponse({
        confidence: 'low',
        blocked_reason: 'Minimum 2 of 4 data dimensions required (usage, engagement, support, NPS). Currently have ' + dimensionsPresent + '.',
        gaps: dimensions.filter(d => !d.present).map(d => `${d.name} data not provided`),
        _meta: { agent: 'health-monitor', blocked: true }
      })
    }

    const confidence = scoreConfidence([
      { present: dimensionsPresent >= 2, weight: 3 },
      { present: dimensionsPresent >= 3, weight: 3 },
      { present: dimensionsPresent === 4, weight: 2 },
      { present: usage_summary?.length > 100, weight: 2 },
    ])

    const SYSTEM = `You are an Account Health analyst at GTM-360.
Your job is to score account health and explain what moved the score — not to predict the future.

SCORING DIMENSIONS (weight each based on what's available):
- Usage (30%): session frequency, feature adoption, seat utilisation
- Engagement (30%): meeting frequency, exec involvement, responsiveness
- Support (20%): ticket volume, escalations, resolution time
- NPS (20%): most recent score and trend if available

HEALTH TIERS:
- Green (70-100): Strong health, low risk
- Amber (40-69): Watch closely, some risks present
- Red (0-39): High risk, intervention needed

CRITICAL RULES:
- Detractor NPS (<6) within last 30 days → Amber minimum, regardless of other dimensions
- Declining trend (e.g., 80→60) is different from stable 60 — call this out
- If data is partial (missing dimensions), mark health score as PARTIAL and list gaps
- Change driver: what moved the score since last assessment — be specific
- CS Play: recommend a play from the standard CS playbook, not a custom action

Do NOT predict churn probability. Surface health state only.`

    const USER = `Account: ${account_name}

${usage_summary ? `Usage Summary:\n${usage_summary}\n` : 'Usage data: Not provided'}
${engagement_notes ? `Engagement Notes:\n${engagement_notes}\n` : 'Engagement data: Not provided'}
${support_history ? `Support History:\n${support_history}\n` : 'Support data: Not provided'}
${nps_score !== null && nps_score !== undefined ? `NPS Score: ${nps_score}/10\n` : 'NPS data: Not provided'}

Dimensions available: ${dimensionsPresent}/4`

    const SCHEMA = {
      health_score: "number 0-100",
      health_tier: "'Green', 'Amber', or 'Red'",
      score_breakdown: {
        usage: "object or null: { score: number, evidence: string }",
        engagement: "object or null: { score: number, evidence: string }",
        support: "object or null: { score: number, evidence: string }",
        nps: "object or null: { score: number, evidence: string }",
      },
      change_driver: "string — what moved the score (or 'First assessment' if no prior baseline)",
      recommended_cs_play: "string — specific play from CS playbook",
      data_quality_note: "string or null — if score is PARTIAL due to missing dimensions",
    }

    const synthesis = await llmCall({ system: SYSTEM, user: USER, schema: SCHEMA, temperature: 0.2 })

    // Apply hard rule: Detractor NPS forces Amber
    let tier = synthesis.health_tier
    if (nps_score !== null && nps_score < 6 && tier === 'Green') {
      tier = 'Amber'
      synthesis.data_quality_note = (synthesis.data_quality_note || '') + ' | NPS <6 forces Amber tier minimum'
    }

    return successResponse({
      confidence,
      account_name,
      health_score: `${synthesis.health_score}/100`,
      health_tier: tier,
      score_breakdown: synthesis.score_breakdown,
      change_driver: synthesis.change_driver,
      recommended_cs_play: synthesis.recommended_cs_play,
      ...(synthesis.data_quality_note && { data_quality_note: synthesis.data_quality_note }),
      dimensions_used: `${dimensionsPresent}/4`,
      gaps: dimensions.filter(d => !d.present).map(d => `${d.name.charAt(0).toUpperCase() + d.name.slice(1)} data would improve accuracy`),
      _meta: {
        agent: 'health-monitor',
        handoff_to_churn_predictor: tier === 'Amber' || tier === 'Red',
        handoff_to_expansion_radar: tier === 'Green' && synthesis.health_score >= 80,
      }
    })

  } catch (err) {
    console.error('Health Monitor error:', err)
    return errorResponse(err.message)
  }
})
