import { corsResponse, successResponse, errorResponse, llmCall, scoreConfidence, detectGaps } from '../_shared/utils.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const payload = await req.json()
    const { account_name, health_data, renewal_date, contract_value, risk_signals } = payload

    const gaps = detectGaps(payload, ['account_name', 'health_data', 'renewal_date', 'contract_value'])

    const daysToRenewal = renewal_date 
      ? Math.floor((new Date(renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null

    const confidence = scoreConfidence([
      { present: !!health_data && health_data.length > 50, weight: 4 },
      { present: !!renewal_date, weight: 3 },
      { present: !!contract_value, weight: 2 },
      { present: !!risk_signals && risk_signals.length > 20, weight: 1 },
    ])

    const SYSTEM = `You are a Retention Risk analyst at GTM-360.
Your job is to classify churn risk into tiers with specific evidence — not to predict a probability.

RISK TIERS:
- Watch (1-2 risk signals): Standard monitoring
- Intervene (3+ signals OR any critical signal): Active CSM intervention needed
- Escalate (Intervene criteria + renewal <30 days): Executive escalation required

CRITICAL SIGNALS (any one triggers Intervene minimum):
- Exec departure at customer
- Open escalation ticket
- Detractor NPS (<6)
- No exec engagement in 60+ days
- Product usage dropped >40% month-over-month

TIER-SPECIFIC CS PLAYS:
- Watch: Standard QBR cadence
- Intervene: Schedule risk mitigation call, surface expansion as retention play
- Escalate: Executive engagement, contract terms review, emergency success plan

HARD RULES:
- Accounts <90 days old excluded from Escalate tier (insufficient pattern history)
- If CSM marked "engaged and healthy" in last 14 days, note this alongside risk tier (don't override)
- Every risk must be specific to this account, not a generic concern

Do NOT predict churn probability. Surface risk tier and evidence only.`

    const USER = `Account: ${account_name}
Contract Value: $${contract_value ? parseFloat(contract_value).toLocaleString() : 'not provided'}
Renewal Date: ${renewal_date || 'not provided'} (${daysToRenewal ? `${daysToRenewal} days away` : 'unknown'})

Health Data:
${health_data}

${risk_signals ? `Known Risk Signals:\n${risk_signals}` : 'No additional risk signals provided'}`

    const SCHEMA = {
      risk_tier: "'Watch', 'Intervene', or 'Escalate'",
      risk_evidence: "array of specific signals that triggered this tier",
      renewal_urgency: "string — combines days to renewal + risk tier",
      cs_play_recommendation: "string — tier-appropriate play",
      risk_score_breakdown: {
        engagement_risk: "number 0-10",
        product_risk: "number 0-10",
        exec_relationship_risk: "number 0-10",
        support_risk: "number 0-10",
      },
      mitigating_factors: "array of strings or null — anything that reduces risk",
    }

    const synthesis = await llmCall({ system: SYSTEM, user: USER, schema: SCHEMA, temperature: 0.2 })

    // Apply hard rules
    const accountAge = 100 // TODO: calculate from createdate if available
    let tier = synthesis.risk_tier
    if (tier === 'Escalate' && accountAge < 90) {
      tier = 'Intervene'
      synthesis.mitigating_factors = [
        ...(synthesis.mitigating_factors || []),
        'Account <90 days old — excluded from Escalate tier (insufficient pattern history)'
      ]
    }

    return successResponse({
      confidence,
      account_name,
      risk_tier: tier,
      risk_evidence: synthesis.risk_evidence,
      renewal_urgency: synthesis.renewal_urgency,
      cs_play_recommendation: synthesis.cs_play_recommendation,
      risk_breakdown: synthesis.risk_score_breakdown,
      ...(synthesis.mitigating_factors && { mitigating_factors: synthesis.mitigating_factors }),
      alert: tier === 'Escalate' 
        ? '🚨 Escalate: Executive engagement required'
        : tier === 'Intervene'
          ? '⚠️ Intervene: Active CSM intervention needed'
          : '👀 Watch: Standard monitoring',
      gaps,
      _meta: {
        agent: 'churn-predictor',
        days_to_renewal: daysToRenewal,
        handoff_to_health_monitor: tier === 'Intervene' || tier === 'Escalate',
      }
    })

  } catch (err) {
    console.error('Churn Predictor error:', err)
    return errorResponse(err.message)
  }
})
