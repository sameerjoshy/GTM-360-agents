import { corsResponse, successResponse, errorResponse, llmCall, scoreConfidence, detectGaps } from '../_shared/utils.ts'
import { getClosedWonDeals } from '../_shared/hubspot.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const payload = await req.json()
    const { stated_icp, lookback_period } = payload

    const lookbackMonths = lookback_period === 'Last 6 months' ? 6 : lookback_period === 'Last 12 months' ? 12 : 24

    // ── STEP 1: GATHER ────────────────────────────────────────────────────────
    const deals = await getClosedWonDeals(lookbackMonths)
    
    if (deals.length < 20) {
      return successResponse({
        confidence: 'low',
        preliminary_note: `Only ${deals.length} closed-won deals found in lookback period. Minimum 20 required for confident ICP analysis. Patterns below are preliminary.`,
        sample_size: deals.length,
        gaps: ['Sample size below 20 deals — patterns are preliminary only'],
        _meta: { agent: 'icp-clarifier', sample_size: deals.length }
      })
    }

    const gaps = detectGaps(payload, [])
    
    // ── STEP 2: VALIDATE ──────────────────────────────────────────────────────
    const confidence = scoreConfidence([
      { present: deals.length >= 20, weight: 4 },
      { present: deals.length >= 50, weight: 3 },
      { present: !!stated_icp, weight: 2 },
      { present: deals.filter(d => d.company).length > deals.length * 0.8, weight: 1 },
    ])

    // Calculate basic metrics for outlier detection
    const amounts = deals.map(d => parseFloat(d.properties.amount || 0)).filter(a => a > 0)
    const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length
    const outlierThreshold = avgAmount * 3

    // ── STEP 3: SYNTHESISE ────────────────────────────────────────────────────
    const SYSTEM = `You are an ICP analyst at GTM-360.
Your job is to find the ACTUAL ICP — the profile of customers who close fastest with the highest win rate — not validate what the stated ICP says.

DATA PROVIDED: ${deals.length} closed-won deals from the last ${lookbackMonths} months.

ANALYSIS RULES:
- Look for patterns in: company size (employees), industry, deal value, close time
- Find the "sweet spot" — the segment with best combination of win rate, deal size, and velocity
- Flag concentration risk if >70% of wins are in one industry (strength AND risk)
- Exclude outliers (deals >3x average ACV or <0.2x) from the core ICP — flag them separately
- Recency matters: weight deals from last 6 months 2x
- If stated ICP is provided, compare actual vs stated — surface drift explicitly
- Do NOT recommend what to do. Surface the data.

OUTPUT SCHEMA: Return structured JSON only.`

    const dealsData = deals.map(d => ({
      amount: d.properties.amount,
      close_date: d.properties.closedate,
      create_date: d.properties.createdate,
      company_name: d.company?.name,
      industry: d.company?.industry,
      employees: d.company?.numberofemployees,
      revenue: d.company?.annualrevenue,
    }))

    const USER = `Closed-won deals:
${JSON.stringify(dealsData, null, 2)}

${stated_icp ? `Stated ICP:\n${stated_icp}\n` : ''}

Average deal value: $${avgAmount.toFixed(0)}
Outlier threshold (>3x avg): $${outlierThreshold.toFixed(0)}`

    const SCHEMA = {
      actual_icp_profile: {
        company_size_range: "string (e.g., '50-200 employees')",
        industries: "array of top 3 industries with % of wins",
        deal_size_range: "string",
        avg_close_time_days: "number",
        sweet_spot_description: "string — 2-3 sentences describing the core ICP",
      },
      icp_drift: "string or null — if stated ICP provided, how does actual differ?",
      concentration_risks: "array of strings — any over-concentration flags (>70% in one dimension)",
      outlier_deals: "array — deals outside the core ICP pattern (>3x or <0.2x avg)",
      cost_of_drift: {
        in_icp_win_rate: "number (estimated %)",
        out_of_icp_win_rate: "number (estimated %)",
        in_icp_avg_cycle: "number (days)",
        out_of_icp_avg_cycle: "number (days)",
      },
      sharpened_icp_brief: "string — one-page ICP definition ready for team alignment",
    }

    const synthesis = await llmCall({ system: SYSTEM, user: USER, schema: SCHEMA, temperature: 0.25 })

    return successResponse({
      confidence,
      sample_size: deals.length,
      lookback_period: `${lookbackMonths} months`,
      actual_icp_profile: synthesis.actual_icp_profile,
      ...(synthesis.icp_drift && { icp_drift_report: synthesis.icp_drift }),
      concentration_risks: synthesis.concentration_risks || [],
      outliers: synthesis.outlier_deals?.slice(0, 5) || [],
      cost_of_drift: synthesis.cost_of_drift,
      sharpened_icp_brief: synthesis.sharpened_icp_brief,
      gaps,
      _meta: {
        agent: 'icp-clarifier',
        deals_analysed: deals.length,
        handoff_to_signals_scout: true,
        handoff_to_listener: true,
      }
    })

  } catch (err) {
    console.error('ICP Clarifier error:', err)
    return errorResponse(err.message)
  }
})
