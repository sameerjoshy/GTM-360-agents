import { corsResponse, successResponse, errorResponse, llmCall, scoreConfidence, detectGaps, selfCritique } from '../_shared/utils.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const payload = await req.json()
    const { pipeline_data, audit_scope, include_heuristics = true } = payload

    // ── STEP 1: GATHER & PARSE ────────────────────────────────────────────
    const gaps = detectGaps(payload, ['pipeline_data'])
    
    // Parse pipeline data into structured format
    let deals = []
    let parseError = null
    
    try {
      // Try parsing as JSON first
      deals = typeof pipeline_data === 'string' 
        ? JSON.parse(pipeline_data) 
        : Array.isArray(pipeline_data) 
          ? pipeline_data 
          : []
    } catch {
      // If JSON parse fails, try to extract deal data from text
      parseError = 'Could not parse pipeline data as JSON. Attempting text extraction.'
    }

    const confidence = scoreConfidence([
      { present: deals.length >= 5, weight: 4 },
      { present: deals.length >= 10, weight: 3 },
      { present: !parseError, weight: 2 },
      { present: deals.some(d => d.amount || d.value), weight: 2 },
      { present: deals.some(d => d.closedate || d.close_date), weight: 1 },
    ])

    // ── STEP 2: PRE-ANALYSIS HEURISTICS ──────────────────────────────────
    // These run BEFORE LLM to catch obvious patterns
    
    const HEURISTICS = {
      // Stage integrity patterns
      proposalWithoutContact: deals.filter(d => 
        (d.stage?.toLowerCase().includes('proposal') || 
         d.stage?.toLowerCase().includes('contract')) &&
        (!d.contacts || d.contacts === 0 || d.num_contacts === 0)
      ).length,
      
      // Temporal patterns
      closeDateInPast: deals.filter(d => {
        const closeDate = new Date(d.closedate || d.close_date)
        return closeDate < new Date() && !d.stage?.toLowerCase().includes('closed')
      }).length,
      
      // Value patterns
      missingAmount: deals.filter(d => !d.amount && !d.value).length,
      
      // Activity patterns  
      staleDeals: deals.filter(d => {
        if (!d.last_activity && !d.lastmodifieddate) return false
        const lastActivity = new Date(d.last_activity || d.lastmodifieddate)
        const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceActivity > 30
      }).length,
      
      // Stage progression anomalies
      earlyStageHighValue: deals.filter(d => {
        const amount = Number(d.amount || d.value || 0)
        const isEarlyStage = d.stage?.toLowerCase().includes('discovery') || 
                            d.stage?.toLowerCase().includes('qualification') ||
                            d.stage?.toLowerCase().includes('appointment')
        return isEarlyStage && amount > 100000
      }).length,
      
      // Contact coverage
      singleThreaded: deals.filter(d => 
        (d.num_contacts === 1 || (d.contacts && d.contacts === 1)) &&
        !d.stage?.toLowerCase().includes('discovery')
      ).length,
    }

    // ── STEP 3: SYNTHESISE WITH LLM ─────────────────────────────────────
    const SYSTEM = `You are a world-class CRM Data Integrity auditor specializing in B2B SaaS pipelines.

Your analysis should be SHARP and SPECIFIC — not generic checklists.

# CORE PHILOSOPHY
Data quality issues are symptoms, not root causes. Your job is to:
1. Identify the data issue (symptom)
2. Infer what operational breakdown caused it (root cause)
3. Assess business impact (what breaks because of this)

# SEVERITY CLASSIFICATION

**BLOCKER** (Forecast Integrity Violation)
- Missing close date in current forecast window
- Missing deal value
- Deal at Proposal+ stage with 0 contacts identified
- Close date in past but stage = open
- Deal marked "Closed Won" with $0 value
→ These make the deal UNFORECASTABLE

**WARNING** (Reporting Quality Issue)
- No activity in 30+ days at Stage 3+
- Single-threaded at Decision Maker stage+
- Close date >90 days out but stage = Contract Sent
- Stage/value mismatch (e.g., Discovery stage with $500K value)
→ These suggest process breakdown but deal is still forecastable

**ADVISORY** (Hygiene Improvement)
- Missing optional fields (lead source, competitor, industry)
- Inconsistent naming conventions
- Duplicate company entries
→ These are nice-to-have fixes, not urgent

# ADVANCED HEURISTICS (Apply these patterns)

**Pattern 1: The Overconfident AE**
Signal: Early-stage deal (Discovery/Qual) with >$100K value
Diagnosis: AE is anchoring on company size, not qualification evidence
Impact: Inflates pipeline, creates false coverage

**Pattern 2: The Zombie Pipeline**
Signal: 30+ days no activity at Stage 3+
Diagnosis: Deal is dead but AE hasn't updated stage (avoids "lost" metric)
Impact: Forecast bloat, wasted rep capacity on dead deals

**Pattern 3: The Stage Jumper**
Signal: Deal at Proposal/Contract with 0-1 contacts
Diagnosis: AE skipped qualification, jumped to demo/proposal to hit activity metrics
Impact: Late-stage falloff, wasted demo/proposal effort

**Pattern 4: The Time Traveler**
Signal: Close date in past, stage = open
Diagnosis: Deal slipped, AE didn't update (or forgot deal exists)
Impact: Forecast credibility collapse

**Pattern 5: The Spray and Pray**
Signal: >40% of pipeline in earliest 2 stages
Diagnosis: Weak qualification discipline, volume over quality
Impact: Low conversion rates, long cycles

# OUTPUT REQUIREMENTS

For each issue, provide:
- deal_name: Exact deal name
- severity: BLOCKER | WARNING | ADVISORY
- field: Which field has the issue
- issue: SPECIFIC description (not "missing close date" — say "Deal at Contract Sent with no close date suggests slippage not captured in CRM")
- suggested_fix: ACTIONABLE fix (not "add close date" — say "Ask AE: When did this slip? Update close date to new commit or mark as Closed Lost")
- pattern_flag: Which heuristic pattern this matches (if any)

# FORECAST IMPACT CALCULATION

Raw Pipeline = Sum of all deal values
Clean Pipeline = Sum of non-BLOCKER deal values  
At Risk = Raw - Clean

If At Risk >30% of Raw: FLAG as "Forecast Credibility Crisis"

# CRITICAL RULES

1. Every issue must cite SPECIFIC deal name
2. Severity must match definition exactly (no judgment calls)
3. suggested_fix must be ACTIONABLE (not "improve data quality")
4. If you see a pattern (3+ deals with same issue), call it out explicitly
5. summary should be SHARP, not diplomatic (this is internal tooling)

# GOOD vs BAD OUTPUT EXAMPLES

❌ BAD:
{
  "deal_name": "Acme Corp",
  "severity": "WARNING", 
  "issue": "Missing close date",
  "suggested_fix": "Add close date"
}

✅ GOOD:
{
  "deal_name": "Acme Corp - Enterprise",
  "severity": "BLOCKER",
  "field": "closedate", 
  "issue": "Deal at Contract Sent stage with no close date. This suggests either (a) contract is stalled and AE hasn't updated stage, or (b) AE is avoiding commitment. Either way, unforecastable.",
  "suggested_fix": "Call AE: 'What's blocking signature? If nothing, commit to close date. If something, move back to Decision Maker stage.'",
  "pattern_flag": "The Time Traveler"
}

# FEW-SHOT EXAMPLES

Input: "Stripe - Growth Plan, $85K, Proposal stage, 0 contacts, close date Feb 15"
Output: 
{
  "severity": "BLOCKER",
  "issue": "Zero contacts identified at Proposal stage. AE likely jumped to demo without proper discovery. This is unqualified pipeline masquerading as late-stage.",
  "suggested_fix": "Require AE to identify: Economic Buyer, Technical Buyer, Champion. If none exist, move back to Qualification.",
  "pattern_flag": "The Stage Jumper"
}

Input: "DataCo - Enterprise, $125K, Contract Sent, last activity 45 days ago, close date March 1"
Output:
{
  "severity": "WARNING", 
  "issue": "45 days no activity at Contract Sent. Deal is likely dead or blocked. Stage suggests imminent close but activity pattern suggests abandonment.",
  "suggested_fix": "Emergency call to champion: 'What's blocking signature?' If no clear path in 48h, move to Closed Lost.",
  "pattern_flag": "The Zombie Pipeline"
}

Now analyze the pipeline data provided.`

    const USER = `Pipeline Data (${deals.length} deals):
${pipeline_data}

Audit Scope: ${audit_scope || 'Full pipeline'}

Pre-Analysis Heuristics Detected:
- Proposal+ deals with 0 contacts: ${HEURISTICS.proposalWithoutContact}
- Deals with past close dates (still open): ${HEURISTICS.closeDateInPast}
- Deals missing amount: ${HEURISTICS.missingAmount}
- Stale deals (30+ days no activity): ${HEURISTICS.staleDeals}
- Early stage deals >$100K: ${HEURISTICS.earlyStageHighValue}
- Single-threaded deals (beyond Discovery): ${HEURISTICS.singleThreaded}

${parseError ? `Note: ${parseError}` : ''}`

    const SCHEMA = {
      issues: [{
        deal_name: "Exact deal name",
        severity: "BLOCKER",
        field: "Field with issue",
        issue: "Specific diagnosis with inferred root cause",
        suggested_fix: "Actionable next step",
        pattern_flag: "Which heuristic pattern or null"
      }],
      blocker_count: 3,
      warning_count: 5,
      advisory_count: 2,
      raw_pipeline_value: 450000,
      clean_pipeline_value: 320000,
      forecast_risk_from_hygiene: 130000,
      stale_deal_count: 4,
      summary: "Sharp 2-3 sentence diagnosis of what's broken and what it means",
      pattern_analysis: "If 3+ deals match a heuristic pattern, call it out here",
      credibility_flag: "true if at-risk >30% of raw, else false",
      top_operational_breakdown: "Single most important process issue causing data quality problems"
    }

    const synthesis = await llmCall({ 
      system: SYSTEM, 
      user: USER, 
      schema: SCHEMA, 
      temperature: 0.1 
    })

    // ── STEP 4: VERIFY & CRITIQUE ──────────────────────────────────────
    const verificationRules = [
      'Every issue has a specific deal name (not generic)',
      'Severity matches definition (BLOCKER = unforecastable)',
      'Suggested fixes are actionable (not "improve quality")',
      'If 3+ deals have same issue, pattern_analysis calls it out',
      'Summary is sharp and diagnostic (not diplomatic)',
      'At-risk >30% triggers credibility_flag = true',
    ]
    
    const verification = await selfCritique(JSON.stringify(synthesis), verificationRules)

    // Build enhanced fix queue with pattern grouping
    const fixQueue = (synthesis.issues || [])
      .sort((a, b) => {
        const order = { BLOCKER: 0, WARNING: 1, ADVISORY: 2 }
        return order[a.severity] - order[b.severity]
      })
      .map((issue, i) => ({
        priority: i + 1,
        deal: issue.deal_name,
        severity: issue.severity,
        field: issue.field,
        diagnosis: issue.issue,
        action: issue.suggested_fix,
        pattern: issue.pattern_flag || null,
      }))

    // Group by pattern for easy batch fixes
    const patternGroups = fixQueue.reduce((acc, item) => {
      if (item.pattern) {
        acc[item.pattern] = acc[item.pattern] || []
        acc[item.pattern].push(item.deal)
      }
      return acc
    }, {})

    return successResponse({
      confidence,
      hygiene_summary: synthesis.summary,
      operational_breakdown: synthesis.top_operational_breakdown,
      
      // Counts
      blockers: synthesis.blocker_count || 0,
      warnings: synthesis.warning_count || 0,
      advisories: synthesis.advisory_count || 0,
      stale_deals: synthesis.stale_deal_count || 0,
      
      // Impact
      ...(synthesis.raw_pipeline_value && {
        pipeline_impact: {
          raw: `$${Number(synthesis.raw_pipeline_value).toLocaleString()}`,
          clean: `$${Number(synthesis.clean_pipeline_value || 0).toLocaleString()}`,
          at_risk: `$${Number(synthesis.forecast_risk_from_hygiene || 0).toLocaleString()}`,
          at_risk_percentage: `${Math.round((synthesis.forecast_risk_from_hygiene / synthesis.raw_pipeline_value) * 100)}%`,
        }
      }),
      
      // Alerts
      ...(synthesis.credibility_flag && {
        forecast_credibility_alert: 'CRITICAL: >30% of pipeline is unforecastable due to data quality issues'
      }),
      
      // Patterns
      ...(synthesis.pattern_analysis && {
        pattern_diagnosis: synthesis.pattern_analysis
      }),
      
      ...(Object.keys(patternGroups).length > 0 && {
        pattern_groups: patternGroups
      }),
      
      // Fix queue
      fix_queue: fixQueue,
      
      // Heuristics
      ...(include_heuristics && {
        heuristics_detected: HEURISTICS
      }),
      
      // Quality
      verification_score: verification.score,
      ...(verification.score < 8 && {
        quality_note: `Output quality: ${verification.score}/10. Issues: ${verification.issues.join('; ')}`
      }),
      
      auto_fix_note: 'No automatic CRM changes made. All fixes require explicit approval via Hygiene → Apply Fixes workflow.',
      
      gaps,
      
      _meta: {
        agent: 'hygiene',
        version: '2.0',
        audit_scope: audit_scope || 'full',
        deals_analyzed: deals.length,
        handoff_to_forecast: true,
        handoff_to_qualifier: synthesis.blocker_count > 3,
        verification_passed: verification.passed,
      }
    })

  } catch (err) {
    console.error('Hygiene v2 error:', err)
    return errorResponse(err.message)
  }
})
