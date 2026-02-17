import { corsResponse, successResponse, errorResponse, llmCall, selfCritique, scoreConfidence, detectGaps } from '../_shared/utils.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const payload = await req.json()
    const { pipeline_data, hygiene_report, forecast_period, quota } = payload

    const gaps = detectGaps(payload, ['pipeline_data', 'forecast_period'])

    const confidence = scoreConfidence([
      { present: pipeline_data?.length > 100, weight: 4 },
      { present: !!hygiene_report, weight: 3 },
      { present: !!quota, weight: 2 },
      { present: pipeline_data?.length > 500, weight: 1 },
    ])

    const SYSTEM = `You are a Revenue Operations analyst at GTM-360.
Your job is to produce an evidence-adjusted forecast — not validate what reps have entered.

CORE PRINCIPLE: The gap between rep-called and evidence-adjusted is the most important output.

CONFIDENCE MULTIPLIERS (apply to each deal):
- Activity in last 7 days: +0.15
- Activity in last 14 days: +0.10
- No activity in 14+ days: -0.25
- Economic buyer identified: +0.15
- Multi-threaded (2+ contacts): +0.10
- Single-threaded: -0.20
- Close date within 30 days: +0.10
- Stage matches evidence: +0.15
- Stage ahead of evidence: -0.30
- Missing deal value: deal excluded

HARD RULES:
- Deals with no value = excluded from forecast (surfaced in gaps)
- Deals with no close date in the period = excluded
- Stale deals (14+ days no activity) get max 0.4 multiplier

OVERCONFIDENCE FLAG: If rep-called > evidence-adjusted by >30%, flag prominently.
Do NOT recommend what reps should do. Surface numbers and evidence only.`

    const USER = `Pipeline Data:
${pipeline_data}

Hygiene Report: ${hygiene_report || 'Not provided — running without hygiene baseline'}
Forecast Period: ${forecast_period}
Quota/Target: ${quota ? `$${Number(quota).toLocaleString()}` : 'Not provided'}`

    const SCHEMA = {
      rep_called_total: "number — sum of all deal values in pipeline at face value",
      evidence_adjusted_total: "number — confidence-weighted total",
      adjustment_percentage: "number — % difference between rep-called and adjusted",
      confidence_range: "object with low and high numbers representing the realistic range",
      coverage_ratio: "string or null — pipeline vs quota if quota provided (e.g. '2.3x')",
      deal_adjustments: "array of objects: { deal_name: string, stage: string, rep_value: number, adjusted_value: number, confidence_multiplier: number, adjustment_reason: string }",
      overconfidence_flag: "boolean",
      top_risks: "array of 3 specific deals or patterns at most risk",
      forecast_summary: "string — 2-3 sentence plain-English summary of the forecast picture",
    }

    const synthesis = await llmCall({ system: SYSTEM, user: USER, schema: SCHEMA, temperature: 0.15 })

    const verificationRules = [
      'Evidence-adjusted total is always ≤ rep-called total (adjustments are always downward)',
      'Overconfidence flag is set if gap is >30%',
      'Deal adjustments have specific reasons, not generic ones',
      'Forecast summary does not recommend actions — surfaces numbers only',
    ]
    const verification = await selfCritique(synthesis, verificationRules)

    return successResponse({
      confidence,
      rep_called: `$${Number(synthesis.rep_called_total || 0).toLocaleString()}`,
      evidence_adjusted: `$${Number(synthesis.evidence_adjusted_total || 0).toLocaleString()}`,
      adjustment: `${synthesis.adjustment_percentage || 0}% downward`,
      confidence_range: synthesis.confidence_range,
      ...(synthesis.coverage_ratio && { coverage_ratio: synthesis.coverage_ratio }),
      ...(synthesis.overconfidence_flag && {
        overconfidence_warning: '⚠️ Rep-called exceeds evidence-adjusted by >30%. Review deal evidence before using this forecast in planning.'
      }),
      deal_adjustments: synthesis.deal_adjustments,
      top_risks: synthesis.top_risks,
      forecast_summary: synthesis.forecast_summary,
      gaps,
      _meta: {
        agent: 'forecast-analyser',
        period: forecast_period,
        verification_score: verification.score,
        handoff_to_qualifier: true,
      }
    })

  } catch (err) {
    console.error('Forecast Analyser error:', err)
    return errorResponse(err.message)
  }
})
