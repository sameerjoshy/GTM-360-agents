import { corsResponse, successResponse, errorResponse, tavilySearch, llmCall, selfCritique, scoreConfidence, detectGaps } from '../_shared/utils.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const payload = await req.json()
    const { target_domain, icp_profile, lookback_days, hypothesis } = payload

    const gaps = detectGaps(payload, ['target_domain', 'lookback_days'])

    // ── STEP 1: GATHER ────────────────────────────────────────────────────────
    // Run 5 targeted searches to surface different signal types
    const domain = target_domain.replace(/https?:\/\//, '').replace(/\/$/, '').split(',')[0].trim()
    const lookback = lookback_days || '30 days'
    const year = new Date().getFullYear()

    const searches = await Promise.allSettled([
      tavilySearch(`${domain} funding investment raised ${year}`, { maxResults: 3 }),
      tavilySearch(`${domain} VP director executive hire leadership ${year}`, { maxResults: 3 }),
      tavilySearch(`${domain} new product feature launch announcement ${year}`, { maxResults: 3 }),
      tavilySearch(`${domain} technology stack CRM tools integration`, { maxResults: 3 }),
      tavilySearch(`${domain} expansion hiring growth team ${year}`, { maxResults: 3 }),
    ])

    const signalTypes = ['FUNDING', 'EXEC_HIRE', 'PRODUCT_LAUNCH', 'TECH_STACK', 'EXPANSION']
    const allSignals = []
    const sources = []

    searches.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value.results) {
        result.value.results.forEach(r => {
          sources.push({ title: r.title, url: r.url })
          allSignals.push({
            type: signalTypes[i],
            title: r.title,
            content: (r.content || r.snippet || '').slice(0, 300),
            url: r.url,
          })
        })
      }
    })

    if (allSignals.length === 0) {
      gaps.push('No signals found for this domain in the lookback period')
    }

    // ── STEP 2: VALIDATE ──────────────────────────────────────────────────────
    const uniqueSignalTypes = new Set(allSignals.map(s => s.type))
    const confidence = scoreConfidence([
      { present: allSignals.length >= 3, weight: 3 },
      { present: uniqueSignalTypes.size >= 2, weight: 3 }, // Corroboration requirement
      { present: !!icp_profile, weight: 2 },
      { present: allSignals.length >= 6, weight: 2 },
    ])

    // ── STEP 3: SYNTHESISE ────────────────────────────────────────────────────
    const SYSTEM = `You are a Signal-to-Intent analyst at GTM-360.
Your job is to assess whether a target account is in a buying window — not to qualify them.

CORE RULES:
- A single weak signal does not constitute intent. You need corroboration from at least 2 different signal types for medium confidence.
- You score Fit Tier (A/B/C/D) against the ICP. If no ICP provided, use B2B SaaS mid-market as default.
- "Why Now" score (1-10) represents urgency of the buying window, not fit.
- Surface contradictions explicitly — do not resolve them.
- Fail loudly if evidence is thin. A "low confidence" output is better than a confident guess.
- Never fabricate signals. Only use what is in the provided signal data.

FIT TIERS:
- A: Perfect ICP match, strong buying signals
- B: Good ICP match, 1-2 buying signals
- C: Partial ICP match or weak signals only  
- D: Outside ICP or disqualifying signals`

    const USER = `Target: ${domain}
ICP Profile: ${icp_profile || 'B2B SaaS, 50-500 employees, Series A-C'}
Hypothesis: ${hypothesis || 'None — open search'}
Lookback: ${lookback}

SIGNALS FOUND:
${allSignals.map(s => `[${s.type}] ${s.title}\n${s.content}`).join('\n\n')}`

    const SCHEMA = {
      why_now_score: "number 1-10",
      fit_tier: "A, B, C, or D",
      fit_tier_reasoning: "string — specific ICP match factors",
      intent_assessment: "string — what the signal pattern indicates about buying window, citing specific signals",
      strongest_signal: "string — the single most compelling signal and why",
      contradictions: "string or null — any conflicting signals",
      recommended_action: "string — specific next step for the sales team (not generic)",
      outreach_angle: "string — the specific angle to use based on signals, for the Sniper agent",
      gaps: ["array — what signals would strengthen or change this assessment"],
    }

    const synthesis = await llmCall({ system: SYSTEM, user: USER, schema: SCHEMA, temperature: 0.2 })

    // ── STEP 4: VERIFY ────────────────────────────────────────────────────────
    const verificationRules = [
      'Why Now score is corroborated by at least one specific signal cited',
      'Fit Tier has specific ICP criteria mentioned, not just a letter grade',
      'No signals were invented — all claims trace to the provided signal data',
      'Contradictions are surfaced if present',
      'Recommended action is specific, not generic ("reach out" is not acceptable)',
    ]
    const verification = await selfCritique(synthesis, verificationRules)

    return successResponse({
      confidence,
      why_now_score: `${synthesis.why_now_score}/10`,
      fit_tier: synthesis.fit_tier,
      fit_tier_reasoning: synthesis.fit_tier_reasoning,
      intent_assessment: synthesis.intent_assessment,
      strongest_signal: synthesis.strongest_signal,
      ...(synthesis.contradictions && { contradictions: synthesis.contradictions }),
      recommended_action: synthesis.recommended_action,
      outreach_angle: synthesis.outreach_angle,
      signal_evidence_log: allSignals.map(s => ({ type: s.type, title: s.title, url: s.url })),
      gaps: [...(synthesis.gaps || []), ...gaps],
      sources: sources.slice(0, 8),
      _meta: {
        agent: 'signals-scout',
        total_signals_found: allSignals.length,
        signal_types_found: [...uniqueSignalTypes],
        verification_score: verification.score,
        handoff_to_sniper: synthesis.fit_tier <= 'B' && synthesis.why_now_score >= 6,
      }
    })

  } catch (err) {
    console.error('Signals Scout error:', err)
    return errorResponse(err.message)
  }
})
