import { corsResponse, successResponse, errorResponse, llmCall, scoreConfidence, detectGaps } from '../_shared/utils.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const payload = await req.json()
    const { source_input, target_audience, formats, style_guide } = payload

    const gaps = detectGaps(payload, ['source_input', 'target_audience', 'formats'])
    const selectedFormats = Array.isArray(formats) ? formats : [formats]

    const confidence = scoreConfidence([
      { present: source_input?.length > 100, weight: 4 },
      { present: !!target_audience, weight: 3 },
      { present: selectedFormats.length > 0, weight: 2 },
      { present: !!style_guide, weight: 1 },
    ])

    if (source_input?.length < 30) {
      return successResponse({
        confidence: 'low',
        blocked_reason: 'Source input is too thin to produce quality content. Provide a richer signal, insight, or talking point.',
        gaps: ['source_input needs more detail — paste the full signal or insight'],
        _meta: { agent: 'content-multiplier', blocked: true }
      })
    }

    const SYSTEM = `You are a content strategist at GTM-360.
You convert signals and insights into high-quality marketing content.

GTM-360 TONE CANON (non-negotiable):
- No scare tactics, no urgency manufacturing
- No "AI magic" or "revolutionary" language  
- No generic observations — every piece must have a specific, defensible point of view
- Customer is the hero — content serves the reader, not the brand
- Operators, not gurus — practical and grounded, never preachy
- Every factual claim must trace to the source input. Do not fabricate statistics.

FORMAT RULES:
- LinkedIn post: 250-400 words, hook-body-CTA, native format (no hashtag spam, max 3 hashtags)
- Email nurture snippet: 80-120 words, designed to slot into a sequence, clear single point
- Talk track: Opening (10 sec), 2-3 proof points, bridge question — NOT a script to read verbatim
- One-pager bullets: 5-7 bullets, each self-contained, suitable for a PDF or slide`

    // Generate all requested formats in parallel
    const formatPromises = selectedFormats.map(async (format) => {
      const formatInstructions = {
        'LinkedIn post': `Write a LinkedIn post (250-400 words). Hook first sentence. One clear insight. Call to action at end. Max 3 hashtags.`,
        'Email nurture snippet': `Write an email nurture snippet (80-120 words). This slots into an existing sequence — it's not a standalone email. One clear point. Soft CTA.`,
        'Talk track': `Write a talk track. Opening: one sentence that earns 10 more seconds. 2-3 proof points from the source. Bridge question to open dialogue.`,
        'One-pager bullets': `Write 5-7 bullets for a one-pager or slide. Each bullet is one complete, self-contained insight. No filler.`,
      }

      const output = await llmCall({
        system: SYSTEM,
        user: `Source Input:\n${source_input}\n\nTarget Audience: ${target_audience}\n${style_guide ? `Style Guide: ${style_guide}\n` : ''}\nFormat: ${format}\nInstructions: ${formatInstructions[format] || formatInstructions['LinkedIn post']}`,
        temperature: 0.55,
      })

      return { format, content: output }
    })

    const formatOutputs = await Promise.all(formatPromises)
    const result = {}
    formatOutputs.forEach(({ format, content }) => {
      result[format.toLowerCase().replace(/\s+/g, '_')] = content
    })

    // Tone check on all outputs combined
    const toneCheck = await llmCall({
      system: `You are a tone checker. Evaluate if content follows these rules: no scare tactics, no urgency manufacturing, no AI magic language, customer is hero, factual claims only. Return JSON: { passed: boolean, violations: string[] }`,
      user: Object.values(result).join('\n\n---\n\n'),
      schema: { passed: true, violations: [] },
      model: 'qwen/qwen-2.5-7b-instruct',
      temperature: 0.1,
    })

    return successResponse({
      confidence,
      ...result,
      tone_check: {
        passed: toneCheck.passed,
        ...(toneCheck.violations?.length > 0 && { violations: toneCheck.violations }),
      },
      approval_note: 'These are first drafts. Human editing expected before publishing.',
      gaps,
      _meta: {
        agent: 'content-multiplier',
        formats_produced: selectedFormats,
        tone_passed: toneCheck.passed,
      }
    })

  } catch (err) {
    console.error('Content Multiplier error:', err)
    return errorResponse(err.message)
  }
})
