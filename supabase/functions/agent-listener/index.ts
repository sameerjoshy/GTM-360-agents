import { corsResponse, successResponse, errorResponse, tavilySearch, llmCall, scoreConfidence, detectGaps } from '../_shared/utils.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const payload = await req.json()
    const { icp_profile, watch_list, signal_sensitivity } = payload

    const gaps = detectGaps(payload, ['icp_profile', 'watch_list', 'signal_sensitivity'])

    // Parse watch list (comma-separated or newline-separated domains)
    const domains = watch_list
      .split(/[\n,]+/)
      .map(d => d.trim().replace(/https?:\/\//, '').replace(/\/$/, ''))
      .filter(d => d.length > 0)
      .slice(0, 20) // Cap at 20 domains per run

    if (domains.length === 0) {
      return errorResponse('No valid domains in watch list', 400)
    }

    const confidence = scoreConfidence([
      { present: !!icp_profile && icp_profile.length > 50, weight: 3 },
      { present: domains.length >= 5, weight: 2 },
      { present: !!signal_sensitivity, weight: 1 },
    ])

    // Define the 52 canonical GTM triggers (subset for v1)
    const triggerTypes = {
      funding: ['funding', 'raised', 'investment', 'series'],
      leadership: ['VP', 'director', 'CEO', 'CFO', 'hire', 'appoint'],
      product: ['launch', 'release', 'new feature', 'beta'],
      expansion: ['hiring', 'team growth', 'office', 'expand'],
      tech: ['integration', 'API', 'CRM', 'tech stack'],
    }

    const year = new Date().getFullYear()
    const allSignals = []
    const vetoedSignals = []

    // Search each domain for each trigger type (parallel)
    for (const domain of domains.slice(0, 10)) { // Limit to 10 domains to avoid rate limits
      const searches = Object.entries(triggerTypes).map(async ([type, keywords]) => {
        try {
          const query = `${domain} ${keywords.join(' OR ')} ${year}`
          const result = await tavilySearch(query, { maxResults: 2, depth: 'basic' })
          
          if (result.results && result.results.length > 0) {
            return result.results.map(r => ({
              domain,
              type,
              title: r.title,
              url: r.url,
              excerpt: (r.content || r.snippet || '').slice(0, 200),
              found_at: new Date().toISOString(),
            }))
          }
          return []
        } catch {
          return []
        }
      })

      const domainResults = await Promise.all(searches)
      allSignals.push(...domainResults.flat())
    }

    // VALIDATE signals against ICP
    const SYSTEM = `You are a Signal Validator at GTM-360.
Your job is to validate each signal against the ICP and veto those that don't meet the threshold.

ICP Profile:
${icp_profile}

Signal Sensitivity: ${signal_sensitivity}

VALIDATION RULES:
- Score each signal 0-10 against ICP fit
- Broad mode: threshold 4+
- Focused mode: threshold 7+
- Signals below threshold = veto (with reason)
- Signals at/above threshold = pass (with confidence score)
- Noise threshold: single-source signals from press releases only = auto-veto

For each signal, return: pass (boolean), score (0-10), reason (string)`

    const signalValidation = await llmCall({
      system: SYSTEM,
      user: `Signals to validate:\n${JSON.stringify(allSignals.slice(0, 30), null, 2)}`,
      schema: {
        validated: "array of objects: { domain: string, type: string, title: string, passed: boolean, score: number, reason: string }"
      },
      temperature: 0.2,
    })

    const passedSignals = []
    signalValidation.validated?.forEach(v => {
      const original = allSignals.find(s => s.domain === v.domain && s.title === v.title)
      if (v.passed && original) {
        passedSignals.push({ ...original, icp_score: v.score, validation_reason: v.reason })
      } else if (original) {
        vetoedSignals.push({ ...original, veto_reason: v.reason })
      }
    })

    // Rank passed signals by ICP score
    passedSignals.sort((a, b) => b.icp_score - a.icp_score)

    // Generate content briefs for top signals
    const contentBriefs = passedSignals.slice(0, 3).map(signal => {
      return {
        signal_title: signal.title,
        domain: signal.domain,
        brief: `Signal: ${signal.type} at ${signal.domain}. ICP score: ${signal.icp_score}/10. Potential angle: ${signal.validation_reason}`,
      }
    })

    return successResponse({
      confidence,
      signal_digest: passedSignals.slice(0, 15).map(s => ({
        domain: s.domain,
        type: s.type,
        title: s.title,
        url: s.url,
        icp_score: `${s.icp_score}/10`,
        why_relevant: s.validation_reason,
      })),
      vetoed_signals: vetoedSignals.slice(0, 10).map(s => ({
        domain: s.domain,
        title: s.title,
        veto_reason: s.veto_reason,
      })),
      content_briefs: contentBriefs,
      summary: `Monitored ${domains.length} domains. Found ${allSignals.length} total signals. ${passedSignals.length} passed ICP validation. ${vetoedSignals.length} vetoed.`,
      gaps: [
        ...gaps,
        ...(domains.length < 5 ? ['Watch list has fewer than 5 domains — expand for better coverage'] : []),
      ],
      _meta: {
        agent: 'listener',
        domains_monitored: domains.length,
        total_signals_found: allSignals.length,
        signals_passed: passedSignals.length,
        signals_vetoed: vetoedSignals.length,
        handoff_to_signals_scout: passedSignals.filter(s => s.type === 'funding' || s.type === 'leadership').length > 0,
        handoff_to_content_multiplier: contentBriefs.length > 0,
      }
    })

  } catch (err) {
    console.error('Listener error:', err)
    return errorResponse(err.message)
  }
})
