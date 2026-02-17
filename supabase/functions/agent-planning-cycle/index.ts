import { corsResponse, successResponse, errorResponse, llmCall, selfCritique, scoreConfidence, detectGaps } from '../_shared/utils.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const payload = await req.json()
    const { prior_targets, prior_actuals, next_goals, diagnostic_output } = payload

    const gaps = detectGaps(payload, ['prior_targets', 'prior_actuals'])

    const confidence = scoreConfidence([
      { present: !!prior_targets && prior_targets.length > 50, weight: 4 },
      { present: !!prior_actuals && prior_actuals.length > 50, weight: 4 },
      { present: !!diagnostic_output, weight: 2 },
      { present: !!next_goals, weight: 1 },
    ])

    // Parse targets and actuals for sanity checks
    const sanityChecks = []
    const revenueMatch = prior_actuals.match(/revenue[:\s]+\$?([\d,]+)/i)
    const revenueTargetMatch = prior_targets.match(/revenue[:\s]+\$?([\d,]+)/i)
    
    if (revenueMatch && revenueTargetMatch) {
      const actual = parseInt(revenueMatch[1].replace(/,/g, ''))
      const target = parseInt(revenueTargetMatch[1].replace(/,/g, ''))
      if (actual > target * 1.5) {
        sanityChecks.push('⚠️ Actuals exceeded targets by >50% — outlier, may distort retrospective')
      }
    }

    const SYSTEM = `You are a GTM strategist at GTM-360 running the quarterly planning cycle.
Your job is to produce a structured retrospective and pressure-tested focus areas — not to write the plan.

GTM-360 PLANNING CYCLE (5 questions — structure your entire output around these):
1. Where are we, really?
2. How did we get here?
3. Where could we be?
4. How do we get there?
5. Are we getting there?

RETROSPECTIVE RULES:
- Assumption Audit: which assumptions from the prior quarter were correct vs wrong
- Be specific about what actually happened vs what was expected
- Surface learnings, not blame — this is a system review, not a performance review
- If diagnostic output is available, connect the dots between diagnostic findings and quarterly results

FOCUS AREAS RULES:
- Maximum 3 focus areas — more than 3 = no focus
- Each focus area must have: the leverage point, the evidence supporting it, and the constraint it addresses
- Rank by impact on the 5 planning questions, not by ease or urgency
- If proposed next quarter goals are provided, pressure-test them against the retrospective

PRESSURE-TEST RULES (if next goals provided):
- Goals >2x prior actuals without clear rationale = high-risk flag
- Check if goals address the constraints surfaced in the retrospective
- Surface the assumptions embedded in the goals

Do NOT recommend tactics. Surface focus areas as opportunities, not to-do lists.`

    const USER = `Prior Quarter Targets:
${prior_targets}

Prior Quarter Actuals:
${prior_actuals}

${next_goals ? `Proposed Next Quarter Goals:\n${next_goals}\n` : ''}
${diagnostic_output ? `Diagnostic Context:\n${diagnostic_output}\n` : ''}`

    const SCHEMA = {
      retrospective_brief: "string — structured brief covering: what happened, why it happened, what the system learned",
      assumption_audit: "array of objects: { assumption: string, was_correct: boolean, evidence: string }",
      focus_areas: "array of 3 objects: { area: string, leverage_point: string, evidence: string, constraint_addressed: string }",
      pressure_test: "string or null — if next goals provided, assess achievability and risks",
      strategic_observation: "string — one sharp, non-obvious observation from the quarter",
      recommended_next_agents: ["array of agent IDs to run next"],
    }

    const synthesis = await llmCall({ system: SYSTEM, user: USER, schema: SCHEMA, temperature: 0.3 })

    const verificationRules = [
      'Focus areas are limited to 3 maximum',
      'Each focus area has specific evidence cited, not generic observations',
      'Assumption audit has at least 3 entries if targets/actuals were provided',
      'If proposed goals >2x prior actuals, pressure test flags this explicitly',
      'Output does not prescribe tactics — surfaces focus areas only',
    ]
    const verification = await selfCritique(synthesis, verificationRules)

    return successResponse({
      confidence,
      retrospective_brief: synthesis.retrospective_brief,
      assumption_audit: synthesis.assumption_audit,
      focus_areas: synthesis.focus_areas,
      ...(synthesis.pressure_test && { pressure_test_report: synthesis.pressure_test }),
      strategic_observation: synthesis.strategic_observation,
      ...(sanityChecks.length > 0 && { sanity_checks: sanityChecks }),
      gaps,
      _meta: {
        agent: 'planning-cycle',
        recommended_handoffs: synthesis.recommended_next_agents || [],
        verification_score: verification.score,
        handoff_to_forecast: true,
      }
    })

  } catch (err) {
    console.error('Planning Cycle error:', err)
    return errorResponse(err.message)
  }
})
