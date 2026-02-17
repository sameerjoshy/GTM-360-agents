// GTM-360 Agent Registry — single source of truth
// Status: 'live' | 'demo' | 'planned'
// Every agent follows the 4-step chain: GATHER → VALIDATE → SYNTHESISE → VERIFY

export const SWARM_META = {
  strategy:  { id: 'strategy',  label: 'Strategy',         color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', description: 'Diagnose · Orient · Plan' },
  sales:     { id: 'sales',     label: 'Sales',            color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', description: 'Pipeline · Qualify · Close' },
  marketing: { id: 'marketing', label: 'Marketing',        color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', description: 'Signal · Create · Distribute' },
  cs:        { id: 'cs',        label: 'Customer Success', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', description: 'Retain · Expand · Advocate' },
  revops:    { id: 'revops',    label: 'RevOps',           color: '#475569', bg: '#F8FAFC', border: '#CBD5E1', description: 'Govern · Forecast · Enable' },
};

export const AGENTS = [

  // ── STRATEGY ──────────────────────────────────────────────────────────────

  {
    id: 'diagnostic',
    swarm: 'strategy',
    name: 'Diagnostic Agent',
    role: 'GTM Health Assessment',
    status: 'live',
    icon: '🔬',
    tagline: 'Surfaces where your GTM system is under strain. Produces clarity, not a task list.',
    whatItDoes: 'Runs the GTM-360 five-question planning cycle against your business context. Uses live web scraping to form an independent view of your market position, then compares it against what you tell it. Output is a structured state map — where you are, how you got here, where the friction is.',
    edgeFunction: 'agent-diagnostic',
    inputs: [
      { key: 'company_url',   label: 'Company Website',          type: 'url',    required: true,  placeholder: 'https://yourcompany.com', hint: 'Used to scrape live context via Tavily' },
      { key: 'revenue_stage', label: 'Current ARR Stage',        type: 'select', required: true,  options: ['$0–2M', '$2–10M', '$10–50M', '$50M+'] },
      { key: 'gtm_team_size', label: 'GTM Team Size',            type: 'number', required: true,  placeholder: '12', hint: 'Sales + Marketing + CS headcount' },
      { key: 'constraint',    label: 'Primary Growth Constraint', type: 'textarea', required: false, placeholder: 'In your own words — optional, sharpens output', hint: 'What feels hardest right now?' },
    ],
    outputs: [
      { name: 'State Summary',    format: 'Structured brief',    description: 'Where you are across the 5 planning cycle questions' },
      { name: 'Constraint Map',   format: 'JSON → visual',       description: 'Friction points by domain with confidence weighting' },
      { name: 'Confidence Level', format: 'high / medium / low', description: 'Quality of evidence available — always explicit' },
      { name: 'Handoff Brief',    format: 'Pre-filled context',  description: 'Passed automatically to Planning Cycle Agent' },
    ],
    logicGates: [
      { gate: 'Evidence threshold',  rule: 'If URL cannot be scraped, confidence drops to low and this is surfaced — agent does not guess' },
      { gate: 'Contradiction check', rule: 'If stated constraint conflicts with scraped signals, both are shown — agent does not resolve the conflict' },
      { gate: 'Stage mismatch',      rule: 'If behaviour does not match stated revenue stage, flagged explicitly' },
      { gate: 'Completeness gate',   rule: 'Minimum 2 of 4 inputs required. Missing inputs are named, not ignored' },
    ],
    handoffs: [
      { to: 'planning-cycle', trigger: 'auto',   condition: 'Always — State Summary pre-fills Planning Cycle context' },
      { to: 'icp-clarifier',  trigger: 'auto',   condition: 'If Constraint Map shows ICP drift signal' },
      { to: 'signals-scout',  trigger: 'manual', condition: 'If market focus is the flagged constraint' },
    ],
    faqs: [
      { q: 'How is this different from a consulting intake form?', a: 'It does not ask you to self-diagnose. It uses external signals to form an independent view, then compares it against what you have told it.' },
      { q: 'Will it tell me what to fix?', a: 'No. It surfaces state. The Planning Cycle Agent converts state into prioritised focus areas.' },
      { q: 'What if I disagree with the output?', a: 'Every finding links to its evidence source. You can override any finding — the override is logged, not discarded.' },
      { q: 'How long does it take?', a: '3 minutes of input, 30–60 seconds processing. Output is structured and scannable in under 2 minutes.' },
    ],
  },

  {
    id: 'planning-cycle',
    swarm: 'strategy',
    name: 'Planning Cycle Agent',
    role: 'Quarterly Operating Loop',
    status: 'live',
    icon: '🔄',
    tagline: 'Structures the quarterly loop. Aligns the team on what changed and why.',
    whatItDoes: 'Takes prior quarter targets and actuals and runs them through the GTM-360 planning cycle. Produces a structured retrospective and pressure-tested focus areas for the coming quarter. Does not write the plan — makes your plan better.',
    edgeFunction: 'agent-planning-cycle',
    inputs: [
      { key: 'prior_targets', label: 'Prior Quarter Targets', type: 'textarea', required: true,  placeholder: 'Revenue: $2M, New logos: 8, NRR: 105%', hint: 'Whatever metrics you track' },
      { key: 'prior_actuals', label: 'Prior Quarter Actuals', type: 'textarea', required: true,  placeholder: 'Revenue: $1.7M, New logos: 6, NRR: 102%' },
      { key: 'next_goals',    label: 'Proposed Next Quarter Goals', type: 'textarea', required: false, hint: 'Optional — agent pressure-tests these if provided' },
      { key: 'diagnostic_output', label: 'Diagnostic Output', type: 'auto', required: false, hint: 'Auto-filled if Diagnostic Agent ran first' },
    ],
    outputs: [
      { name: 'Retrospective Brief',    format: 'Structured markdown', description: 'What happened, why, what the system learned' },
      { name: 'Assumption Audit',       format: 'Table',               description: 'Which prior assumptions were correct vs wrong' },
      { name: 'Focus Areas',            format: 'Ranked list (top 3)', description: 'Highest leverage areas for next quarter with evidence' },
      { name: 'Pressure-Test Report',   format: 'Markdown',            description: 'If proposed goals provided — achievability and risks' },
    ],
    logicGates: [
      { gate: 'Sanity check',      rule: 'Actuals >50% above targets flagged for review — outliers distort retrospectives' },
      { gate: 'Missing actuals',   rule: 'Revenue and pipeline actuals required minimum — no Focus Areas without them' },
      { gate: 'Ambition gate',     rule: 'Proposed goals >2x prior actuals without rationale flagged as high-risk' },
      { gate: 'Cycle completeness', rule: 'Output marks which of the 5 planning questions have sufficient evidence and which do not' },
    ],
    handoffs: [
      { to: 'icp-clarifier',      trigger: 'auto',   condition: 'If win rate declined quarter-on-quarter' },
      { to: 'forecast-analyser',  trigger: 'auto',   condition: 'Focus Areas always fed to Forecast Analyser' },
    ],
    faqs: [
      { q: 'Do we need to run Diagnostic first?', a: 'No — works standalone. But Diagnostic first enriches context and improves Focus Areas.' },
      { q: 'What format should targets/actuals be in?', a: 'Plain numbers are fine. The agent does the maths. No spreadsheet required.' },
    ],
  },

  {
    id: 'icp-clarifier',
    swarm: 'strategy',
    name: 'ICP Clarifier',
    role: 'Ideal Customer Profile Sharpener',
    status: 'demo',
    icon: '🎯',
    tagline: 'Finds the gap between who you think you sell to and who actually buys.',
    whatItDoes: 'Analyses closed-won deal patterns to surface the actual ICP — the one your best customers reveal, not the one on your sales deck. Flags where the team pursues deals outside the real ICP and what it costs in win rate and cycle time.',
    edgeFunction: 'agent-icp-clarifier',
    inputs: [
      { key: 'crm_export',     label: 'CRM Deal Export (CSV)',  type: 'file',   required: true,  hint: 'Company size, industry, ACV, outcome, close date' },
      { key: 'stated_icp',     label: 'Stated ICP',             type: 'textarea', required: false, hint: 'Current definition — agent compares against it' },
      { key: 'lookback_period', label: 'Lookback Period',       type: 'select', required: true,  options: ['Last 6 months', 'Last 12 months', 'All time'] },
    ],
    outputs: [
      { name: 'Actual ICP Profile',  format: 'Structured card',    description: 'Highest win-rate, lowest cycle-time customer profile' },
      { name: 'ICP Drift Report',    format: 'Table',              description: 'Where pipeline deviates from actual ICP' },
      { name: 'Cost of Drift',       format: 'Metrics',            description: 'Win rate and cycle time delta: in-ICP vs out-of-ICP' },
      { name: 'Sharpened ICP Brief', format: 'One-pager markdown', description: 'One-page ICP definition ready for team alignment' },
    ],
    logicGates: [
      { gate: 'Sample size gate',        rule: 'Minimum 20 closed-won deals required. Below this, patterns marked as preliminary' },
      { gate: 'Outlier exclusion',        rule: 'Deals >3x or <0.2x average ACV treated as outliers, flagged separately' },
      { gate: 'Industry concentration',   rule: '>70% wins in one industry flagged as concentration risk, not just strength' },
      { gate: 'Recency weighting',        rule: 'Last 6 months weighted 2x — old wins may reflect a different product' },
    ],
    handoffs: [
      { to: 'signals-scout', trigger: 'auto',   condition: 'Sharpened ICP Brief becomes scoring criteria for Signals Scout' },
      { to: 'listener',      trigger: 'auto',   condition: 'ICP profile updates Marketing signal filter threshold' },
    ],
    faqs: [
      { q: 'What CRMs does it connect to?', a: 'HubSpot live sync in v2. CSV upload works for all CRMs now.' },
      { q: 'We have very few closed-won deals — is it useful?', a: 'Below 20 deals output is labelled preliminary. Patterns are still surfaced, just with lower confidence.' },
    ],
  },

  // ── SALES ──────────────────────────────────────────────────────────────────

  {
    id: 'signals-scout',
    swarm: 'sales',
    name: 'Signals Scout',
    role: 'Signal-to-Intent Owner',
    status: 'live',
    icon: '📡',
    tagline: 'Converts weak external signals into a human-reviewable intent judgment.',
    whatItDoes: 'Monitors the live web for signals that suggest a target account may be in a buying window: funding news, leadership hires, tech stack changes, competitive moves. Scores each signal against your ICP and produces a structured intent assessment — not a lead list.',
    edgeFunction: 'agent-signals-scout',
    inputs: [
      { key: 'target_domain',    label: 'Target Company / Domain', type: 'text',   required: true,  placeholder: 'acmecorp.com', hint: 'Single account or paste multiple domains comma-separated' },
      { key: 'icp_profile',      label: 'ICP Profile',             type: 'auto',   required: false, hint: 'Auto-filled from ICP Clarifier if available' },
      { key: 'lookback_days',    label: 'Signal Lookback',         type: 'select', required: true,  options: ['30 days', '60 days', '90 days'] },
      { key: 'hypothesis',       label: 'Hypothesis',              type: 'select', required: false, options: ['New Logo', 'Expansion', 'Churn Risk', 'No hypothesis'] },
    ],
    outputs: [
      { name: 'Intent Assessment', format: 'Structured card per account', description: 'Why Now score, signal summary, confidence level' },
      { name: 'Signal Evidence Log', format: 'JSON',                      description: 'Every signal found, source URL, confidence weight' },
      { name: 'Fit Tier',           format: 'A / B / C / D',              description: 'ICP match — A is perfect fit, D is disqualified' },
      { name: 'Outreach Brief',     format: 'Pre-filled context',         description: 'Passed to Sniper if intent is high enough' },
    ],
    logicGates: [
      { gate: 'Signal threshold',    rule: 'Single weak signal does not constitute intent. Two corroborating signals of different types required for medium confidence' },
      { gate: 'ICP gate',            rule: 'Below Fit Tier B not auto-routed to Sniper — human must override' },
      { gate: 'Recency gate',        rule: 'Signals older than lookback period excluded — no inference from stale data' },
      { gate: 'Contradiction gate',  rule: 'Opposing signals (e.g. layoffs AND expansion hiring) both surfaced, confidence reduced to low' },
    ],
    handoffs: [
      { to: 'sniper',   trigger: 'auto',   condition: 'Fit Tier A or B + medium/high confidence intent' },
      { to: 'listener', trigger: 'auto',   condition: 'All signals also fed to Marketing signal layer' },
      { to: 'deal-room', trigger: 'manual', condition: 'If account already exists in CRM pipeline' },
    ],
    faqs: [
      { q: 'How is this different from Apollo or ZoomInfo?', a: 'Those surface contacts and emails. This surfaces intent — the why now — tied to your specific ICP. It does not produce a lead list.' },
      { q: 'Does it find contact details?', a: 'No. Account-level intent only. Contact enrichment is a separate step.' },
      { q: 'How many accounts can I run at once?', a: 'Up to 50 comma-separated domains in a single run.' },
    ],
  },

  {
    id: 'qualifier',
    swarm: 'sales',
    name: 'Qualifier Agent',
    role: 'Deal Qualification Engine',
    status: 'live',
    icon: '🔎',
    tagline: 'Surfaces what you do not know about each deal — not what you think you know.',
    whatItDoes: 'Runs structured qualification against live deal data. Identifies missing information, flags stage-evidence mismatches, and produces a per-deal qualification brief. Does not move deals. Does not tell reps what to do.',
    edgeFunction: 'agent-qualifier',
    inputs: [
      { key: 'deal_context',   label: 'Deal Context',           type: 'textarea', required: true,  placeholder: 'Paste deal notes, email thread, or CRM summary', hint: 'The more context the sharper the output' },
      { key: 'deal_stage',     label: 'Current CRM Stage',      type: 'select',   required: true,  options: ['Prospecting', 'Discovery', 'Qualifying', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] },
      { key: 'deal_value',     label: 'Deal Value (ACV)',        type: 'number',   required: true,  placeholder: '45000' },
      { key: 'framework',      label: 'Qualification Framework', type: 'select',   required: true,  options: ['MEDDIC', 'SPICED', 'BANT'] },
      { key: 'close_date',     label: 'Expected Close Date',     type: 'date',     required: false },
    ],
    outputs: [
      { name: 'Qualification Scorecard', format: 'Per-criterion card',      description: 'Present / Partial / Missing for each criterion' },
      { name: 'Gap List',                format: 'Specific questions',       description: 'Exact questions to ask to fill each gap' },
      { name: 'Stage Integrity Check',   format: 'Pass / Flag / Fail',       description: 'Does evidence support the current stage?' },
      { name: 'Risk Flags',              format: 'Prioritised list',         description: 'Long silence, missing economic buyer, single-threaded' },
    ],
    logicGates: [
      { gate: 'Stage gate',            rule: 'Proposal stage with no economic buyer identified = hard flag, not a warning' },
      { gate: 'Activity recency',       rule: 'No activity in 14 days triggers stale flag regardless of stage' },
      { gate: 'Single-thread check',    rule: 'One contact engaged = deal risk flag at every stage above Discovery' },
      { gate: 'Completeness threshold', rule: 'Fewer than 3 of 6 MEDDIC criteria = cannot pass Stage Integrity Check' },
    ],
    handoffs: [
      { to: 'deal-room',          trigger: 'auto',   condition: 'Qualification Scorecard always fed into Deal Room' },
      { to: 'forecast-analyser',  trigger: 'auto',   condition: 'Stage Integrity Check feeds forecast confidence' },
      { to: 'sniper',             trigger: 'manual', condition: 'If multi-threading gaps identified' },
    ],
    faqs: [
      { q: 'Does it update my CRM?', a: 'Never automatically. It produces a suggestion log. Rep must approve any changes.' },
      { q: 'Can I use a custom framework?', a: 'MEDDIC, SPICED, BANT built-in. Custom frameworks configurable in settings.' },
    ],
  },

  {
    id: 'sniper',
    swarm: 'sales',
    name: 'Sniper',
    role: 'Precision Outreach Drafter',
    status: 'live',
    icon: '✉️',
    tagline: 'Drafts outbound messages grounded in signal, not templates.',
    whatItDoes: 'Takes a signal brief or deal context and drafts personalised outreach. Every message references a specific real signal. Self-critiques for relevance and tone before presenting for approval. Never sends.',
    edgeFunction: 'agent-sniper',
    inputs: [
      { key: 'signal_brief',  label: 'Signal or Intent Brief', type: 'textarea', required: true,  placeholder: 'Auto-filled from Signals Scout, or paste manually', hint: 'The richer the signal, the sharper the draft' },
      { key: 'target_persona', label: 'Target Persona',        type: 'text',     required: true,  placeholder: 'VP Sales, 200-person SaaS, recently raised Series B' },
      { key: 'objective',     label: 'Outreach Objective',     type: 'select',   required: true,  options: ['First touch', 'Follow-up', 'Re-engagement', 'Multi-thread'] },
      { key: 'channel',       label: 'Channel',                type: 'select',   required: true,  options: ['Email', 'LinkedIn DM', 'Call script'] },
      { key: 'style_guide',   label: 'Style Guide',            type: 'textarea', required: false, hint: 'Your voice, phrases to avoid, tone constraints' },
    ],
    outputs: [
      { name: 'Draft Message',       format: 'Text + subject line', description: 'Ready-to-review draft' },
      { name: 'Self-Critique',       format: 'Structured feedback', description: 'Agent scores its own draft: relevance, tone, signal usage, length' },
      { name: 'Alternative Variant', format: 'Text',                description: 'Different angle, same signal' },
      { name: 'Approval Prompt',     format: 'UI action',           description: 'Human must click Approve — no auto-send in any configuration' },
    ],
    logicGates: [
      { gate: 'Signal requirement',  rule: 'No specific signal = "insufficient context" output, not generic copy' },
      { gate: 'Tone canon check',    rule: 'Checked against GTM-360 tone canon — no urgency manufacturing, no false familiarity' },
      { gate: 'Length gate',         rule: 'First-touch email >120 words triggers length warning before approval' },
      { gate: 'Hallucination check', rule: 'Every factual claim must trace to signal brief — unverified claims marked [UNVERIFIED]' },
    ],
    handoffs: [
      { to: 'qualifier', trigger: 'manual', condition: 'If reply received and deal exists in CRM' },
    ],
    faqs: [
      { q: 'Does it send the message?', a: 'Never. You must click Approve. There is no auto-send in any configuration.' },
      { q: 'What if I have no signal?', a: 'It will tell you it lacks context rather than producing generic copy. This is by design.' },
      { q: 'Can I build sequences?', a: 'Multi-touch sequences supported. Each message requires individual approval.' },
    ],
  },

  {
    id: 'deal-room',
    swarm: 'sales',
    name: 'Deal Room',
    role: 'Live Deal Intelligence',
    status: 'demo',
    icon: '🏛️',
    tagline: 'One brief. Every deal. What you need before the call.',
    whatItDoes: 'Aggregates deal notes, email context, stakeholder data, and qualification scores into a single structured deal brief. Surfaces risk factors and suggested next actions. Replaces the 10-minute CRM scroll before every call.',
    edgeFunction: 'agent-deal-room',
    inputs: [
      { key: 'deal_context',    label: 'Deal Notes / Email Thread', type: 'textarea', required: true,  placeholder: 'Paste CRM notes, email thread, or call summary' },
      { key: 'stakeholders',    label: 'Known Stakeholders',        type: 'textarea', required: false, placeholder: 'John Smith, CFO — skeptical. Sarah Lee, VP Ops — champion.' },
      { key: 'call_transcript', label: 'Last Call Transcript',      type: 'textarea', required: false, hint: 'Paste transcript if available — enriches brief significantly' },
    ],
    outputs: [
      { name: 'Deal Brief',             format: 'Structured markdown', description: 'Deal summary, stakeholder map, key dates, open items' },
      { name: 'Buyer Readiness Score',  format: '1–10 + rationale',    description: 'Evidence-based assessment of where buyer actually is' },
      { name: 'Risk Log',               format: 'Prioritised list',     description: 'What could kill this deal — ordered by severity' },
      { name: 'Suggested Next Action',  format: 'Text',                 description: 'One concrete recommendation. Not prescriptive.' },
    ],
    logicGates: [
      { gate: 'Conflict detection', rule: 'Conflicting signals in notes vs emails — both surfaced, agent does not resolve' },
      { gate: 'Escalation gate',    rule: 'Economic buyer not mentioned in last 21 days = top of Risk Log' },
    ],
    handoffs: [
      { to: 'qualifier',         trigger: 'auto',   condition: 'Risk Log feeds qualification gap analysis' },
      { to: 'forecast-analyser', trigger: 'auto',   condition: 'Buyer Readiness Score contributes to deal forecast confidence' },
    ],
    faqs: [
      { q: 'How is this different from CRM\'s built-in summary?', a: 'CRM summaries surface what was entered. This surfaces what the data implies — including what is missing and what is risky.' },
    ],
  },

  // ── MARKETING ─────────────────────────────────────────────────────────────

  {
    id: 'listener',
    swarm: 'marketing',
    name: 'Listener',
    role: 'Market Signal Monitor',
    status: 'live',
    icon: '👂',
    tagline: 'Monitors 52 canonical GTM triggers. Surfaces only what merits a response.',
    whatItDoes: 'Continuously monitors the market for 52 canonical GTM trigger events. Validates each signal against ICP criteria and routes high-confidence signals to the relevant swarm. Produces a vetoed log — full transparency on what was excluded and why.',
    edgeFunction: 'agent-listener',
    inputs: [
      { key: 'icp_profile',       label: 'ICP Profile',         type: 'auto',   required: true,  hint: 'Auto-filled from ICP Clarifier if available' },
      { key: 'watch_list',        label: 'Companies to Watch',  type: 'textarea', required: true,  placeholder: 'One domain per line or comma-separated' },
      { key: 'signal_sensitivity', label: 'Signal Sensitivity', type: 'select', required: true,  options: ['Broad (all 52 triggers)', 'Focused (buying signals only)', 'Custom'] },
    ],
    outputs: [
      { name: 'Signal Digest',    format: 'Ranked list',        description: 'Validated signals for the period, ranked by confidence' },
      { name: 'Vetoed Signals',   format: 'Audit log',          description: 'Excluded signals with reason — full transparency' },
      { name: 'Content Brief',    format: 'Text',               description: 'For signals that merit a marketing response' },
    ],
    logicGates: [
      { gate: 'ICP validation',  rule: 'Every signal scored against ICP before routing — below threshold vetoed and logged' },
      { gate: 'Noise threshold', rule: 'Single-source signals require corroboration before passing' },
      { gate: 'Recency gate',    rule: 'Signals >72 hours old downgraded unless part of a sustained pattern' },
    ],
    handoffs: [
      { to: 'signals-scout',       trigger: 'auto',   condition: 'Buying intent signals above threshold' },
      { to: 'content-multiplier',  trigger: 'auto',   condition: 'Signals that warrant content response' },
      { to: 'competitor-intel',    trigger: 'auto',   condition: 'Any competitor mention' },
    ],
    faqs: [
      { q: 'What are the 52 triggers?', a: 'Funding events, C-suite changes, headcount surges, tech migrations, M&A activity, product launches, and more. Full list in signal configuration panel.' },
    ],
  },

  {
    id: 'content-multiplier',
    swarm: 'marketing',
    name: 'Content Multiplier',
    role: 'Signal-to-Content Engine',
    status: 'live',
    icon: '✏️',
    tagline: 'One signal. Four formats. Human edits required.',
    whatItDoes: 'Converts a single input — market signal, insight, or talking point — into a multi-format content brief. Enforces the GTM-360 tone canon on every output. Designed for teams that create good content but lack bandwidth to multiply it.',
    edgeFunction: 'agent-content-multiplier',
    inputs: [
      { key: 'source_input',    label: 'Source Input',      type: 'textarea', required: true,  placeholder: 'Signal brief, insight, or raw talking point', hint: 'Richer context = sharper output' },
      { key: 'target_audience', label: 'Target Audience',   type: 'text',     required: true,  placeholder: 'VP Sales at 100–500 person B2B SaaS' },
      { key: 'formats',         label: 'Formats Requested', type: 'multiselect', required: true, options: ['LinkedIn post', 'Email nurture snippet', 'Talk track', 'One-pager bullets'] },
      { key: 'style_guide',     label: 'Style Guide',       type: 'textarea', required: false, hint: 'Voice constraints, banned phrases, tone notes' },
    ],
    outputs: [
      { name: 'LinkedIn Post',         format: '250–400 words',    description: 'Hook-body-CTA structure, native LinkedIn format' },
      { name: 'Email Nurture Snippet', format: '80–120 words',     description: 'Designed to slot into existing sequence' },
      { name: 'Talk Track',            format: 'Structured script', description: 'Opening, proof points, bridge to next question' },
      { name: 'One-Pager Bullets',     format: '5–7 bullets',       description: 'Suitable for PDF or slide deck' },
    ],
    logicGates: [
      { gate: 'Tone canon check',    rule: 'All outputs checked — no scare tactics, no AI magic language, customer is hero' },
      { gate: 'Source traceability', rule: 'Factual claims must trace to source input — no fabricated statistics' },
      { gate: 'Format fit check',    rule: 'Input too thin for format = surfaced, not padded' },
    ],
    handoffs: [
      { to: 'sniper', trigger: 'manual', condition: 'Talk tracks and email snippets can be adapted for outbound' },
    ],
    faqs: [
      { q: 'Will it match my writing style?', a: 'Approximately, with a style guide. These are first drafts — human editing expected.' },
      { q: 'Can I give it a competitor signal?', a: 'Yes. Competitor intelligence outputs are valid input.' },
    ],
  },

  {
    id: 'competitor-intel',
    swarm: 'marketing',
    name: 'Competitor Intel',
    role: 'Competitive Intelligence Monitor',
    status: 'live',
    icon: '🔭',
    tagline: 'Four live sources. One structured brief. No noise.',
    whatItDoes: 'Monitors competitors across Tavily, Google News RSS, Hacker News, and company blog RSS. Surfaces announcements, hiring shifts, funding events, and product moves as a structured brief. Monthly automated reports to Slack. On-demand pulls anytime.',
    edgeFunction: 'competitor-intel',
    inputs: [
      { key: 'competitor_name',    label: 'Competitor Name',    type: 'text',   required: true,  placeholder: 'Acme Corp' },
      { key: 'competitor_website', label: 'Competitor Website', type: 'url',    required: true,  placeholder: 'https://acmecorp.com' },
    ],
    outputs: [
      { name: 'Intel Brief',        format: 'Structured markdown', description: '📢 News · 👥 Hires · 💰 Funding · ✍️ Blog · 🔥 HN · ⚠️ Implications' },
      { name: 'Source Attribution', format: 'Cited list',           description: 'Every claim linked to source' },
      { name: 'Source Badges',      format: 'UI indicators',        description: 'Which of 4 sources returned data' },
    ],
    logicGates: [
      { gate: 'Evidence requirement', rule: 'Every section must cite a source — sections with no data say "Nothing significant found"' },
      { gate: 'Source transparency',  rule: 'Source availability always shown — empty sources surfaced, not hidden' },
    ],
    handoffs: [
      { to: 'content-multiplier', trigger: 'manual', condition: 'Competitive signals that warrant content response' },
      { to: 'listener',           trigger: 'auto',   condition: 'Competitor signals fed into 52-trigger layer' },
    ],
    faqs: [
      { q: 'How fresh is the data?', a: 'On-demand pulls are live at time of request. Monthly reports use prior 30 days.' },
      { q: 'How many competitors can I track?', a: 'Unlimited — add or remove from the dashboard at any time.' },
    ],
  },

  // ── CS ────────────────────────────────────────────────────────────────────

  {
    id: 'health-monitor',
    swarm: 'cs',
    name: 'Health Monitor',
    role: 'Account Health Scoring',
    status: 'demo',
    icon: '❤️',
    tagline: 'A health score that explains itself. No black box.',
    whatItDoes: 'Builds a live health score using usage data, engagement signals, support history, and NPS. The score is secondary to the reasoning — every score comes with the evidence that produced it and what changed since last run.',
    edgeFunction: 'agent-health-monitor',
    inputs: [
      { key: 'account_name',    label: 'Account Name',         type: 'text',     required: true },
      { key: 'usage_summary',   label: 'Usage Summary',        type: 'textarea', required: false, hint: 'Sessions, feature usage, seat utilisation — paste or describe' },
      { key: 'support_history', label: 'Support Ticket Summary', type: 'textarea', required: false },
      { key: 'nps_score',       label: 'Last NPS Score',       type: 'number',   required: false, placeholder: '7' },
      { key: 'engagement_notes', label: 'Engagement Notes',    type: 'textarea', required: false, hint: 'Recent meeting frequency, exec involvement, responsiveness' },
    ],
    outputs: [
      { name: 'Health Score',        format: '0–100 + Green/Amber/Red', description: 'Weighted composite across 4 dimensions' },
      { name: 'Score Breakdown',     format: 'Per-dimension card',       description: 'Usage, Engagement, Support, NPS — each with evidence' },
      { name: 'Change Driver',       format: 'Text',                     description: 'What moved the score and why' },
      { name: 'Recommended CS Play', format: 'From CS playbook',         description: 'Suggested play based on score pattern — not a directive' },
    ],
    logicGates: [
      { gate: 'Data sufficiency', rule: 'Minimum 2 of 4 dimensions required — insufficient data = data gap, not a low score' },
      { gate: 'Trend weighting',  rule: 'Declining 80→60 treated differently from stable 60 — trajectory over absolute value' },
      { gate: 'NPS anchor',       rule: 'Detractor NPS (<6) in last 30 days forces Amber regardless of other dimensions' },
    ],
    handoffs: [
      { to: 'churn-predictor',  trigger: 'auto',   condition: 'Amber or Red scores trigger churn risk assessment' },
      { to: 'expansion-radar',  trigger: 'auto',   condition: 'Green scores >80 with high utilisation passed to Expansion Radar' },
    ],
    faqs: [
      { q: 'What if we don\'t have product usage data?', a: 'Score runs on available dimensions, clearly marked as partial. CRM engagement signals substitute for some usage signals.' },
    ],
  },

  {
    id: 'churn-predictor',
    swarm: 'cs',
    name: 'Churn Predictor',
    role: 'Retention Risk Engine',
    status: 'demo',
    icon: '⚠️',
    tagline: 'Risk tiers with evidence. Not a probability score without explanation.',
    whatItDoes: 'Identifies accounts with elevated churn risk using behavioural pattern matching. Produces a prioritised at-risk list with specific evidence behind each tier — no black-box scores.',
    edgeFunction: 'agent-churn-predictor',
    inputs: [
      { key: 'account_name',   label: 'Account Name',         type: 'text',     required: true },
      { key: 'health_data',    label: 'Health Score / Notes',  type: 'auto',     required: true,  hint: 'Auto-filled from Health Monitor' },
      { key: 'renewal_date',   label: 'Renewal Date',          type: 'date',     required: true },
      { key: 'contract_value', label: 'Contract Value (ACV)',   type: 'number',   required: true },
      { key: 'risk_signals',   label: 'Risk Signals',           type: 'textarea', required: false, hint: 'Any known red flags — exec departure, open escalation, budget cuts' },
    ],
    outputs: [
      { name: 'Risk Tier',              format: 'Watch / Intervene / Escalate', description: 'Three-tier with specific criteria for each' },
      { name: 'Risk Evidence',          format: 'Cited list',                   description: 'Specific signals that triggered the tier' },
      { name: 'Renewal Urgency Score',  format: 'Days to renewal + tier',       description: 'Near-renewal high-risk accounts surfaced first' },
      { name: 'CS Play Recommendation', format: 'From CS playbook',             description: 'Tier-appropriate response' },
    ],
    logicGates: [
      { gate: 'Tier thresholds',       rule: 'Watch: 1–2 signals. Intervene: 3+ OR any critical signal. Escalate: renewal <30 days + Intervene criteria' },
      { gate: 'New account exclusion', rule: 'Accounts <90 days excluded from Escalate tier — insufficient pattern history' },
      { gate: 'Override memory',       rule: 'CSM "engaged and healthy" flag in last 14 days noted alongside risk tier — not overridden' },
    ],
    handoffs: [
      { to: 'health-monitor', trigger: 'auto', condition: 'Intervene/Escalate accounts trigger full health refresh' },
    ],
    faqs: [
      { q: 'Can it be wrong?', a: 'Yes. Every output has a human review step. CSMs can override tiers — overrides logged for model improvement.' },
    ],
  },

  {
    id: 'expansion-radar',
    swarm: 'cs',
    name: 'Expansion Radar',
    role: 'Upsell Signal Detection',
    status: 'demo',
    icon: '📈',
    tagline: 'Identifies when accounts are ready to grow — before they ask.',
    whatItDoes: 'Monitors accounts for expansion signals: seat utilisation, feature adoption spikes, team growth, external hiring in buyer role. Produces an internal CSM brief — not a client-facing document.',
    edgeFunction: 'agent-expansion-radar',
    inputs: [
      { key: 'account_name',      label: 'Account Name',            type: 'text',     required: true },
      { key: 'health_score',      label: 'Health Score',            type: 'auto',     required: true,  hint: 'Auto-filled from Health Monitor — Green accounts only' },
      { key: 'utilisation',       label: 'Seat / Licence Utilisation', type: 'number', required: true,  placeholder: '87', hint: 'Percentage — the single strongest expansion signal' },
      { key: 'feature_notes',     label: 'Feature Adoption Notes',  type: 'textarea', required: false },
      { key: 'account_domain',    label: 'Account Domain',          type: 'url',      required: false, hint: 'Used to check external hiring signals via Tavily' },
    ],
    outputs: [
      { name: 'Expansion Readiness Score', format: '1–5 stars + rationale', description: 'Composite across utilisation, adoption, external signals' },
      { name: 'Expansion Brief',           format: 'Structured markdown',   description: 'Internal CSM brief: why now, what product, what framing' },
      { name: 'Timing Recommendation',     format: 'Text',                  description: 'When to raise the conversation based on signals' },
    ],
    logicGates: [
      { gate: 'Health gate',        rule: 'Only Green accounts (score >70) eligible — Amber and Red excluded' },
      { gate: 'Utilisation threshold', rule: '>85% seat utilisation OR 30-day spike in premium feature usage required' },
      { gate: 'Rep override',       rule: 'CSM "Not expansion ready" flag suppresses account for 60 days' },
    ],
    handoffs: [
      { to: 'signals-scout', trigger: 'manual', condition: 'Expansion involves new team or division (new logo opportunity)' },
    ],
    faqs: [
      { q: 'Does it draft the upsell proposal?', a: 'No. It produces an internal brief for the CSM. Proposal drafting is a separate step the CSM owns.' },
    ],
  },

  // ── REVOPS ────────────────────────────────────────────────────────────────

  {
    id: 'hygiene',
    swarm: 'revops',
    name: 'Hygiene Agent',
    role: 'CRM Data Integrity Monitor',
    status: 'live',
    icon: '🛡️',
    tagline: 'Finds what is broken in your CRM before it breaks your forecast.',
    whatItDoes: 'Audits CRM data for quality issues affecting pipeline reliability. Classifies issues by severity. Auto-fixes only safe non-critical fields — everything else requires explicit human approval.',
    edgeFunction: 'agent-hygiene',
    inputs: [
      { key: 'pipeline_data', label: 'Pipeline Data', type: 'textarea', required: true,  placeholder: 'Paste CRM export or deal list with stages, values, close dates, contacts', hint: 'CSV or structured text both work' },
      { key: 'audit_scope',   label: 'Audit Scope',   type: 'select',   required: true,  options: ['Full pipeline', 'Current quarter only', 'Specific stage range'] },
    ],
    outputs: [
      { name: 'Hygiene Report',          format: 'Structured table', description: 'Issues by severity: Blocker / Warning / Advisory' },
      { name: 'Fix Queue',               format: 'Actionable list',  description: 'Issues ordered by fix priority with suggested action' },
      { name: 'Forecast Impact Estimate', format: 'Metrics',          description: 'How many deals affected and clean vs raw pipeline value' },
    ],
    logicGates: [
      { gate: 'Severity classification', rule: 'Blocker = affects forecast. Warning = affects reporting. Advisory = affects hygiene only' },
      { gate: 'Stage gate rule',         rule: 'Proposal stage without identified contact + close date + deal value = Blocker' },
      { gate: 'Age gate',                rule: 'No activity in 30+ days at stage 3+ = stale flag regardless of close date' },
    ],
    handoffs: [
      { to: 'forecast-analyser', trigger: 'auto',   condition: 'Hygiene Report always runs before Forecast Analyser' },
      { to: 'qualifier',         trigger: 'auto',   condition: 'Blocker-level issues on open deals fed to Qualifier' },
    ],
    faqs: [
      { q: 'Will it change anything without asking?', a: 'Only contact format fields at >95% confidence. Deal data always requires approval.' },
      { q: 'How often should it run?', a: 'Weekly minimum. Daily before forecast calls.' },
    ],
  },

  {
    id: 'forecast-analyser',
    swarm: 'revops',
    name: 'Forecast Analyser',
    role: 'Forecast Confidence Engine',
    status: 'live',
    icon: '📊',
    tagline: 'Two numbers: what reps called and what the evidence supports.',
    whatItDoes: 'Evaluates evidence quality within each deal to produce a confidence-adjusted forecast. The gap between rep-called and evidence-adjusted number is the primary output — it tells you exactly where forecast risk lives and why.',
    edgeFunction: 'agent-forecast-analyser',
    inputs: [
      { key: 'pipeline_data',    label: 'Pipeline Data',          type: 'textarea', required: true,  placeholder: 'Deal name, stage, value, close date, last activity, contacts — one per line or CSV paste' },
      { key: 'hygiene_report',   label: 'Hygiene Report',         type: 'auto',     required: false, hint: 'Auto-filled from Hygiene Agent if run first' },
      { key: 'forecast_period',  label: 'Forecast Period',        type: 'select',   required: true,  options: ['Current quarter', 'Next 30 days', 'Next 60 days'] },
      { key: 'quota',            label: 'Quota / Target',         type: 'number',   required: false, placeholder: '500000', hint: 'Used to calculate coverage ratio' },
    ],
    outputs: [
      { name: 'Rep-Called Forecast',       format: 'Currency',             description: 'What CRM stages imply at face value' },
      { name: 'Evidence-Adjusted Forecast', format: 'Currency + range',    description: 'The number the evidence actually supports' },
      { name: 'Gap Analysis',              format: 'Deal-level breakdown', description: 'Every downward adjustment with deal and reason' },
      { name: 'Coverage Ratio',            format: 'Ratio',                description: 'Pipeline coverage vs target at adjusted number' },
    ],
    logicGates: [
      { gate: 'Evidence weighting',   rule: 'Each deal scored on: recency of activity, qualification completeness, stage-evidence alignment' },
      { gate: 'Overconfidence flag',   rule: 'Rep-called >30% above evidence-adjusted = warning at top of report' },
    ],
    handoffs: [
      { to: 'planning-cycle', trigger: 'auto',   condition: 'Forecast always fed into quarterly planning context' },
      { to: 'qualifier',      trigger: 'auto',   condition: 'Deals with largest downward adjustments queued for re-qualification' },
    ],
    faqs: [
      { q: 'Does this replace the forecast call?', a: 'No. It makes the call faster. The call still happens — it just starts from a pre-built evidence base.' },
      { q: 'What if I disagree with an adjustment?', a: 'Override any deal-level adjustment. Overrides logged and fed back into future calibration.' },
    ],
  },

  {
    id: 'workflow-builder',
    swarm: 'revops',
    name: 'Workflow Builder',
    role: 'RevOps Automation Architect',
    status: 'planned',
    icon: '🔧',
    tagline: 'Translates decisions into CRM specifications. Closes the strategy-to-implementation gap.',
    whatItDoes: 'Takes a plain-language description of a GTM process decision and produces a structured CRM workflow specification ready for the RevOps team to implement. Eliminates translation loss between what leadership decides and what ends up in the CRM.',
    edgeFunction: 'agent-workflow-builder',
    inputs: [
      { key: 'process_description', label: 'Process Description', type: 'textarea', required: true,  placeholder: 'When a deal moves to Proposal stage, automatically assign a CSM and set a 7-day follow-up task' },
      { key: 'crm_platform',        label: 'CRM Platform',        type: 'select',   required: true,  options: ['HubSpot', 'Salesforce (coming soon)'] },
      { key: 'affected_objects',    label: 'Affected Objects',    type: 'textarea', required: true,  placeholder: 'Deal, Contact, Company' },
    ],
    outputs: [
      { name: 'Workflow Spec',           format: 'Structured document', description: 'Trigger, conditions, actions, edge cases — implementation-ready' },
      { name: 'Conflict Report',         format: 'List',                description: 'Where proposed workflow conflicts with existing CRM logic' },
      { name: 'Change Impact Assessment', format: 'Metrics',             description: 'Records affected and downstream effects' },
    ],
    logicGates: [
      { gate: 'Ambiguity gate', rule: 'Ambiguous process description = clarifying questions surfaced, not guessed' },
    ],
    handoffs: [
      { to: 'hygiene', trigger: 'auto', condition: 'After implementation, Hygiene Agent re-runs to verify clean data output' },
    ],
    faqs: [
      { q: 'When is this available?', a: 'Coming in the next platform release. Sign up for early access.' },
      { q: 'Does it build in HubSpot directly?', a: 'No. It produces the spec for your RevOps team to build.' },
    ],
  },
];

// Helper functions
export const getAgentById = (id) => AGENTS.find(a => a.id === id);
export const getAgentsBySwarm = (swarmId) => AGENTS.filter(a => a.swarm === swarmId);
export const getLiveAgents = () => AGENTS.filter(a => a.status === 'live');
export const getSwarmMeta = (swarmId) => SWARM_META[swarmId];
