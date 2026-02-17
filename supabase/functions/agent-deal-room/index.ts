import { corsResponse, successResponse, errorResponse, llmCall, scoreConfidence } from '../_shared/utils.ts'
import { getDealDetails } from '../_shared/hubspot.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const payload = await req.json()
    const { deal_id } = payload

    if (!deal_id) {
      return errorResponse('deal_id required', 400)
    }

    // ── STEP 1: GATHER ────────────────────────────────────────────────────────
    const dealData = await getDealDetails(deal_id)
    const { deal, contacts, notes } = dealData

    const confidence = scoreConfidence([
      { present: !!deal, weight: 3 },
      { present: contacts.length > 0, weight: 3 },
      { present: notes.length > 0, weight: 2 },
      { present: contacts.length > 1, weight: 2 },
    ])

    // ── STEP 2: VALIDATE ──────────────────────────────────────────────────────
    const daysSinceLastUpdate = deal.hs_lastmodifieddate 
      ? Math.floor((Date.now() - parseInt(deal.hs_lastmodifieddate)) / (1000 * 60 * 60 * 24))
      : null

    const hasEconomicBuyer = contacts.some(c => 
      c.jobtitle && /VP|Director|CFO|CEO|Head|Chief/i.test(c.jobtitle)
    )

    const riskFlags = []
    if (!hasEconomicBuyer) riskFlags.push('🚨 No economic buyer identified in contacts')
    if (contacts.length === 1) riskFlags.push('⚠️ Single-threaded — only one contact engaged')
    if (daysSinceLastUpdate && daysSinceLastUpdate > 21) riskFlags.push('⚠️ Stale — no activity in 21+ days')
    if (!deal.closedate) riskFlags.push('⚠️ No close date set')

    // ── STEP 3: SYNTHESISE ────────────────────────────────────────────────────
    const SYSTEM = `You are a Deal Intelligence specialist at GTM-360.
Your job is to produce a structured deal brief — what the rep needs to know before the next call.

OUTPUT RULES:
- Deal summary: 3-4 sentences max — current state, not history
- Stakeholder map: who's engaged, who's missing, who's the economic buyer
- Risk log: specific risks ordered by severity, not generic concerns
- Next action: ONE concrete recommendation — not a list of 5 things
- Buyer Readiness: 1-10 score with specific reasoning based on engagement signals

BUYER READINESS SCORING:
1-3: Early stage, no clear buying process
4-6: Active evaluation, some stakeholders engaged
7-8: Decision phase, economic buyer engaged, timeline defined
9-10: Contract stage, legal/procurement involved

Do NOT recommend how to sell. Surface the deal state only.`

    const USER = `Deal: ${deal.dealname}
Stage: ${deal.dealstage}
Amount: $${deal.amount ? parseFloat(deal.amount).toLocaleString() : 'not set'}
Close Date: ${deal.closedate || 'not set'}
Last Updated: ${daysSinceLastUpdate ? `${daysSinceLastUpdate} days ago` : 'unknown'}

Contacts (${contacts.length}):
${contacts.map(c => `- ${c.firstname} ${c.lastname}, ${c.jobtitle || 'no title'}, ${c.email}`).join('\n')}

Recent Notes (${notes.length}):
${notes.slice(0, 5).map(n => `[${new Date(parseInt(n.hs_timestamp)).toLocaleDateString()}] ${n.hs_note_body?.slice(0, 200)}`).join('\n\n')}`

    const SCHEMA = {
      deal_summary: "string — 3-4 sentence current state summary",
      stakeholder_map: {
        economic_buyer: "string or 'Not identified'",
        champion: "string or 'Not identified'",
        engaged_contacts: "array of strings",
        missing_stakeholders: "array of strings",
      },
      buyer_readiness_score: "number 1-10",
      buyer_readiness_reasoning: "string",
      risk_log: "array of strings ordered by severity",
      key_dates: "array of objects: { date: string, event: string }",
      open_items: "array of strings — unresolved questions or gaps",
      next_action: "string — ONE specific recommendation",
    }

    const synthesis = await llmCall({ system: SYSTEM, user: USER, schema: SCHEMA, temperature: 0.2 })

    return successResponse({
      confidence,
      deal_brief: {
        deal_name: deal.dealname,
        stage: deal.dealstage,
        amount: deal.amount ? `$${parseFloat(deal.amount).toLocaleString()}` : 'Not set',
        close_date: deal.closedate || 'Not set',
        summary: synthesis.deal_summary,
      },
      stakeholder_map: synthesis.stakeholder_map,
      buyer_readiness: {
        score: `${synthesis.buyer_readiness_score}/10`,
        reasoning: synthesis.buyer_readiness_reasoning,
      },
      risk_log: [...riskFlags, ...(synthesis.risk_log || [])],
      key_dates: synthesis.key_dates || [],
      open_items: synthesis.open_items || [],
      next_action: synthesis.next_action,
      _meta: {
        agent: 'deal-room',
        deal_id,
        contacts_count: contacts.length,
        notes_analysed: notes.length,
        days_since_update: daysSinceLastUpdate,
        handoff_to_qualifier: true,
        handoff_to_forecast: true,
      }
    })

  } catch (err) {
    console.error('Deal Room error:', err)
    return errorResponse(err.message)
  }
})
