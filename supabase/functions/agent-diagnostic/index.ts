import { corsResponse, successResponse, errorResponse, tavilySearch, llmCall, selfCritique, scoreConfidence, detectGaps } from '../_shared/utils.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const payload = await req.json()
    const { company_url, revenue_stage, gtm_team_size, constraint } = payload

    // ── STEP 1: GATHER ────────────────────────────────────────────────────────
    const gaps = detectGaps(payload, ['company_url', 'revenue_stage', 'gtm_team_size'])
    
    let webContext = ''
    let sources = []
    let tavilyFailed = false

    try {
      // Parallel Tavily searches for maximum context
      const domain = company_url.replace(/https?:\/\//, '').replace(/\/$/, '')
      const [companySearch, hiringSearch, newsSearch] = await Promise.allSettled([
        tavilySearch(`${domain} company overview customers product`, { depth: 'basic', maxResults: 3 }),
        tavilySearch(`${domain} hiring jobs team growth`, { depth: 'basic', maxResults: 3 }),
        tavilySearch(`${domain} news funding 2024 2025`, { depth: 'basic', maxResults: 3 }),
      ])

      const allResults = [
        ...(companySearch.status === 'fulfilled' ? companySearch.value.results || [] : []),
        ...(hiringSearch.status === 'fulfilled' ? hiringSearch.value.results || [] : []),
        ...(newsSearch.status === 'fulfilled' ? newsSearch.value.results || [] : []),
      ]

      sources = allResults.slice(0, 8).map(r => ({ title: r.title, url: r.url }))
      webContext = allResults.map(r => `[${r.title}]\n${r.content || r.snippet || ''}`).join('\n\n').slice(0, 4000)
    } catch (e) {
      tavilyFailed = true
      gaps.push('Web scraping failed — analysis based on provided inputs only')
    }

    // ── STEP 2: VALIDATE ──────────────────────────────────────────────────────
    const confidence = scoreConfidence([
      { present: !!company_url && !tavilyFailed, weight: 3 },
      { present: !!revenue_stage, weight: 2 },
      { present: !!gtm_team_size, weight: 2 },
      { present: !!constraint, weight: 1 },
      { present: sources.length > 3, weight: 2 },
    ])

    // ── STEP 3: SYNTHESISE ────────────────────────────────────────────────────
    const SYSTEM = `You are a senior GTM strategist at GTM-360.
Your role is to surface the state of a company's go-to-market system — not to recommend what to do.

TONE CANON (non-negotiable):
- Operators not gurus. No scare tactics. No urgency manufacturing.
- The customer is the hero. You surface clarity, not a to-do list.
- Every claim must be traceable to a signal. If you're not sure, say so.
- Use "surfaces", "flags", "indicates" — never "you must" or "you should".
- Fail loudly: if evidence is thin, say so explicitly.

GTM-360 PLANNING CYCLE (5 questions — structure your entire output around these):
1. Where are we, really?
2. How did we get here?
3. Where could we be?
4. How do we get there?
5. Are we getting there?

OUTPUT RULES:
- Produce a structured JSON object only.
- Be specific. Generic observations are worse than no observations.
- Every section in "constraint_map" must cite a specific signal or say "inferred from stage".
- "gaps" = things you could not assess due to missing data — be explicit.`

    const USER = `Company URL: ${company_url}
Revenue Stage: ${revenue_stage}
GTM Team Size: ${gtm_team_size}
Stated Constraint: ${constraint || 'Not provided'}

WEB CONTEXT:
${webContext || 'No web context available.'}

Produce a GTM state diagnostic. Be honest about confidence. Flag contradictions. Do not invent signals.`

    const SCHEMA = {
      state_summary: "string — answer each of the 5 planning cycle questions with 2-3 sentences each",
      constraint_map: "string — top 3 friction points with the specific signal that surfaced each",
      what_working: "string — what the data suggests is working, with signal citation",
      strategic_observation: "string — one sharp, non-obvious observation about this company's GTM state",
      recommended_next_agents: ["array of agent IDs from: planning-cycle, icp-clarifier, signals-scout, hygiene, forecast-analyser"],
      gaps: ["array of strings — what could not be assessed and why"],
    }

    const synthesis = await llmCall({ system: SYSTEM, user: USER, schema: SCHEMA, temperature: 0.3 })

    // ── STEP 4: VERIFY ────────────────────────────────────────────────────────
    const verificationRules = [
      'Every claim in constraint_map has a signal cited or says "inferred"',
      'No generic observations (e.g. "focus on pipeline" without specifics)',
      'Gaps section is populated if any data was missing',
      'Tone is neutral — no urgency manufacturing, no scare tactics',
      'Output does not recommend actions — it surfaces state only',
    ]
    const verification = await selfCritique(synthesis, verificationRules)

    // If critique flags issues, note them but still return output
    const qualityNote = !verification.passed
      ? `Note: Output quality score ${verification.score}/10. Potential issues: ${verification.issues.join('; ')}`
      : null

    return successResponse({
      confidence,
      state_summary: synthesis.state_summary,
      constraint_map: synthesis.constraint_map,
      what_working: synthesis.what_working,
      strategic_observation: synthesis.strategic_observation,
      ...(qualityNote && { quality_note: qualityNote }),
      gaps: [...(synthesis.gaps || []), ...gaps],
      sources,
      _meta: {
        agent: 'diagnostic',
        recommended_handoffs: synthesis.recommended_next_agents || [],
        verification_score: verification.score,
      }
    })

  } catch (err) {
    console.error('Diagnostic agent error:', err)
    return errorResponse(err.message)
  }
})
