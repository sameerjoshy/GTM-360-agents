import { corsResponse, successResponse, errorResponse, llmCall, selfCritique, scoreConfidence, detectGaps } from '../_shared/utils.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const payload = await req.json()
    const { signal_brief, target_persona, objective, channel, style_guide } = payload

    const gaps = detectGaps(payload, ['signal_brief', 'target_persona', 'objective', 'channel'])

    // ── STEP 2: VALIDATE ──────────────────────────────────────────────────────
    const hasSpecificSignal = signal_brief && signal_brief.length > 50
    if (!hasSpecificSignal) {
      return successResponse({
        confidence: 'low',
        draft_message: null,
        blocked_reason: 'Insufficient signal context. Provide a specific signal (funding news, job posting, product launch, etc.) to generate a relevant draft. Generic outreach is not supported.',
        gaps: ['signal_brief is too thin — paste the actual signal text or auto-fill from Signals Scout'],
        _meta: { agent: 'sniper', blocked: true }
      })
    }

    const confidence = scoreConfidence([
      { present: hasSpecificSignal, weight: 4 },
      { present: !!target_persona, weight: 3 },
      { present: !!objective, weight: 2 },
      { present: !!style_guide, weight: 1 },
    ])

    // ── STEP 3: SYNTHESISE — Draft A ──────────────────────────────────────────
    const SYSTEM = `You are a precision outreach specialist at GTM-360.
You write messages that are grounded in specific signals, not templates.

GTM-360 TONE CANON (non-negotiable):
- No urgency manufacturing ("Act now", "Don't miss out")
- No false familiarity ("I've been following your journey")
- No scare tactics
- No AI magic language ("leverage AI-powered")
- Customer is the hero — your message serves them, not the sender
- Be specific. One clear observation beats three vague ones.
- Short wins. First touch: under 100 words for email, under 80 for LinkedIn.

CHANNEL-SPECIFIC RULES:
- Email: Subject line required. Under 100 words body. One CTA.
- LinkedIn DM: Under 80 words. No formal greeting. Direct.
- Call script: Opening (15 sec), bridge statement, permission question.`

    const channelInstructions = {
      'Email': 'Write a subject line and email body. Body under 100 words.',
      'LinkedIn DM': 'Write a LinkedIn DM. Under 80 words. No "Dear" or formal greeting.',
      'Call script': 'Write a 15-second opening, a bridge to the signal, and a permission question.',
    }

    const USER_DRAFT_A = `Signal Brief:
${signal_brief}

Target Persona: ${target_persona}
Objective: ${objective}
Channel: ${channel}
${style_guide ? `Style Guide:\n${style_guide}` : ''}

Instructions: ${channelInstructions[channel] || channelInstructions['Email']}

Write Draft A. Reference the specific signal. Be precise. Do not be generic.`

    // Draft B — different angle, same signal
    const USER_DRAFT_B = `${USER_DRAFT_A}

Now write Draft B — a completely different angle using the same signal. 
If Draft A led with the signal as a trigger, Draft B should lead with the implication for the buyer.
Same channel and length constraints apply.`

    const SCHEMA_DRAFT = {
      subject_line: "string or null (email only)",
      message: "string — the actual draft",
      signal_used: "string — which specific part of the signal this message is anchored to",
      word_count: "number",
    }

    const [draftA, draftB] = await Promise.all([
      llmCall({ system: SYSTEM, user: USER_DRAFT_A, schema: SCHEMA_DRAFT, temperature: 0.5 }),
      llmCall({ system: SYSTEM, user: USER_DRAFT_B, schema: SCHEMA_DRAFT, temperature: 0.6 }),
    ])

    // ── STEP 3B: SELF-CRITIQUE ─────────────────────────────────────────────────
    const CRITIQUE_SYSTEM = `You are a quality reviewer for outbound sales messages.
Score the draft against these criteria and return structured JSON.`

    const CRITIQUE_SCHEMA = {
      relevance_score: "number 1-10 — how specifically is the signal used?",
      tone_score: "number 1-10 — does it follow the tone canon?",
      clarity_score: "number 1-10 — is the message clear and specific?",
      length_flag: "boolean — is it over the word limit for the channel?",
      issues: ["array of specific issues"],
      overall: "pass or flag"
    }

    const critiqueA = await llmCall({
      system: CRITIQUE_SYSTEM,
      user: `Channel: ${channel}\nDraft:\n${draftA.message}\nTone canon: No urgency manufacturing, no false familiarity, customer is hero, be specific.`,
      schema: CRITIQUE_SCHEMA,
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      temperature: 0.1,
    })

    // ── STEP 4: VERIFY ────────────────────────────────────────────────────────
    // Hard block: if length flag is set, warn before approve
    const lengthWarning = critiqueA.length_flag
      ? `⚠️ Draft A is over the recommended length for ${channel}. Consider trimming before sending.`
      : null

    return successResponse({
      confidence,
      draft_a: {
        ...(draftA.subject_line && { subject_line: draftA.subject_line }),
        message: draftA.message,
        signal_anchor: draftA.signal_used,
        word_count: draftA.word_count,
      },
      draft_b: {
        ...(draftB.subject_line && { subject_line: draftB.subject_line }),
        message: draftB.message,
        signal_anchor: draftB.signal_used,
        word_count: draftB.word_count,
      },
      self_critique: {
        relevance: `${critiqueA.relevance_score}/10`,
        tone: `${critiqueA.tone_score}/10`,
        clarity: `${critiqueA.clarity_score}/10`,
        verdict: critiqueA.overall,
        issues: critiqueA.issues,
      },
      approval_required: true,
      ...(lengthWarning && { length_warning: lengthWarning }),
      gaps,
      _meta: {
        agent: 'sniper',
        channel,
        objective,
        never_auto_sends: true,
      }
    })

  } catch (err) {
    console.error('Sniper error:', err)
    return errorResponse(err.message)
  }
})
