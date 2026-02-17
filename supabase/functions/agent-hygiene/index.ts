import { corsResponse, successResponse, errorResponse, llmCall, scoreConfidence, detectGaps } from '../_shared/utils.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const payload = await req.json()
    const { pipeline_data, audit_scope } = payload

    const gaps = detectGaps(payload, ['pipeline_data', 'audit_scope'])

    const confidence = scoreConfidence([
      { present: pipeline_data?.length > 100, weight: 4 },
      { present: pipeline_data?.length > 500, weight: 3 },
      { present: !!audit_scope, weight: 2 },
      { present: pipeline_data?.includes('close date') || pipeline_data?.includes('value'), weight: 1 },
    ])

    const SYSTEM = `You are a CRM Data Integrity auditor at GTM-360.
Your job is to find data quality issues that affect forecast accuracy and pipeline reliability.

SEVERITY CLASSIFICATION:
- BLOCKER: Directly affects forecast accuracy (missing close date, missing value, wrong stage evidence, no contact)
- WARNING: Affects reporting quality (missing fields that should be present at this stage)
- ADVISORY: Hygiene improvements that don't affect core metrics

HARD RULES (always apply these — no exceptions):
1. Any deal in Proposal stage or later with NO identified decision-maker = BLOCKER
2. Any deal with NO close date in the current forecast window = BLOCKER
3. Any deal with NO deal value = BLOCKER (excluded from forecast)
4. Any deal with no activity in 30+ days at Stage 3+ = WARNING (stale)
5. Deals with close date in the past but marked open = BLOCKER

FORECAST IMPACT:
Calculate approximate clean pipeline value = sum of non-BLOCKER deals
Calculate raw pipeline value = all deals
Difference = forecast risk from data quality issues

Do NOT recommend what to do beyond the fix queue. Surface state only.`

    const USER = `Pipeline Data:
${pipeline_data}

Audit Scope: ${audit_scope}`

    const SCHEMA = {
      issues: "array of { deal_name: string, severity: 'BLOCKER'|'WARNING'|'ADVISORY', field: string, issue: string, suggested_fix: string }",
      blocker_count: "number",
      warning_count: "number",
      advisory_count: "number",
      raw_pipeline_value: "number or null",
      clean_pipeline_value: "number or null",
      forecast_risk_from_hygiene: "number or null — raw minus clean",
      stale_deal_count: "number",
      summary: "string — 2-3 sentence plain-English summary of data quality state",
    }

    const synthesis = await llmCall({ system: SYSTEM, user: USER, schema: SCHEMA, temperature: 0.1 })

    // Build fix queue ordered by severity
    const fixQueue = (synthesis.issues || [])
      .sort((a, b) => {
        const order = { BLOCKER: 0, WARNING: 1, ADVISORY: 2 }
        return order[a.severity] - order[b.severity]
      })
      .map((issue, i) => ({
        priority: i + 1,
        deal: issue.deal_name,
        severity: issue.severity,
        issue: issue.issue,
        fix: issue.suggested_fix,
      }))

    return successResponse({
      confidence,
      hygiene_summary: synthesis.summary,
      blockers: synthesis.blocker_count || 0,
      warnings: synthesis.warning_count || 0,
      advisories: synthesis.advisory_count || 0,
      stale_deals: synthesis.stale_deal_count || 0,
      ...(synthesis.raw_pipeline_value && {
        pipeline_impact: {
          raw: `$${Number(synthesis.raw_pipeline_value).toLocaleString()}`,
          clean: `$${Number(synthesis.clean_pipeline_value || 0).toLocaleString()}`,
          at_risk: `$${Number(synthesis.forecast_risk_from_hygiene || 0).toLocaleString()}`,
        }
      }),
      fix_queue: fixQueue,
      auto_fix_note: 'No automatic CRM changes made. All fixes require explicit approval.',
      gaps,
      _meta: {
        agent: 'hygiene',
        audit_scope,
        handoff_to_forecast: true,
        handoff_to_qualifier: synthesis.blocker_count > 0,
      }
    })

  } catch (err) {
    console.error('Hygiene error:', err)
    return errorResponse(err.message)
  }
})
