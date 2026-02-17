import { useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Play, Loader, CheckCircle, AlertCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { AGENTS, SWARM_META, getAgentById } from '../data/agents'
import { runAgent } from '../lib/supabase'

const statusMeta = {
  live:    { label: 'Live',        bg: '#ECFDF5', color: '#059669' },
  demo:    { label: 'Demo',        bg: '#FFFBEB', color: '#D97706' },
  planned: { label: 'Coming Soon', bg: '#F9FAFB', color: '#94A3B8' },
}

const handoffTriggerStyle = {
  auto:   { bg: '#ECFDF5', color: '#059669', label: 'Auto' },
  manual: { bg: '#FFF7ED', color: '#C2410C', label: 'Manual' },
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children, accent }) {
  return (
    <div className="mb-6">
      <div className="font-mono text-[11px] uppercase tracking-widest mb-3"
        style={{ color: accent || '#6B7280' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

// ── Input field ──────────────────────────────────────────────────────────────
function InputField({ input, value, onChange, disabled }) {
  const base = "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"

  if (input.type === 'auto') {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 text-sm border border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
        Auto-filled from previous agent
      </div>
    )
  }

  if (input.type === 'select') return (
    <select value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled}
      className={base + " cursor-pointer"}>
      <option value="">Select…</option>
      {input.options?.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  if (input.type === 'multiselect') return (
    <div className="flex flex-wrap gap-2">
      {input.options?.map(o => (
        <button key={o} type="button" disabled={disabled}
          onClick={() => {
            const arr = value || []
            onChange(arr.includes(o) ? arr.filter(x => x !== o) : [...arr, o])
          }}
          className="px-3 py-1.5 text-xs rounded-full border transition-all disabled:opacity-50"
          style={
            (value || []).includes(o)
              ? { background: '#EEF2FF', color: '#4F46E5', borderColor: '#C7D2FE' }
              : { background: 'white', color: '#64748B', borderColor: '#E2E8F0' }
          }>
          {o}
        </button>
      ))}
    </div>
  )

  if (input.type === 'textarea') return (
    <textarea value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled}
      placeholder={input.placeholder} rows={4}
      className={base + " resize-none"} />
  )

  if (input.type === 'file') return (
    <div className="border border-dashed border-slate-200 rounded-lg p-4 text-center text-sm text-slate-400 bg-slate-50">
      CSV upload — coming soon. Paste data in text field for now.
    </div>
  )

  return (
    <input type={input.type || 'text'} value={value || ''} onChange={e => onChange(e.target.value)}
      disabled={disabled} placeholder={input.placeholder}
      className={base} />
  )
}

// ── Output display ───────────────────────────────────────────────────────────
function OutputDisplay({ output, agentColor }) {
  if (!output) return null

  // Handle different output formats
  const renderContent = (content) => {
    if (typeof content === 'string') {
      // Convert markdown-like formatting
      return content.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-bold text-slate-800 mt-4 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-bold text-slate-900 mt-5 mb-2 text-base">{line.slice(3)}</h3>
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-slate-800 my-1">{line.slice(2, -2)}</p>
        if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="ml-4 text-slate-600 text-sm my-0.5">{line.slice(2)}</li>
        if (line.startsWith('→ ')) return (
          <div key={i} className="flex gap-2 my-1">
            <span className="text-indigo-400 flex-shrink-0 font-bold">→</span>
            <span className="text-slate-600 text-sm">{line.slice(2)}</span>
          </div>
        )
        if (!line.trim()) return <br key={i} />
        return <p key={i} className="text-slate-600 text-sm my-0.5 leading-relaxed">{line}</p>
      })
    }
    return <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono">{JSON.stringify(content, null, 2)}</pre>
  }

  return (
    <div className="space-y-4 fade-in">
      {/* Confidence badge */}
      {output.confidence && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider">Confidence</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded-full"
            style={{
              background: output.confidence === 'high' ? '#ECFDF5' : output.confidence === 'medium' ? '#FFFBEB' : '#FEF2F2',
              color: output.confidence === 'high' ? '#059669' : output.confidence === 'medium' ? '#D97706' : '#DC2626',
            }}>
            {output.confidence}
          </span>
        </div>
      )}

      {/* Main output sections */}
      {Object.entries(output).filter(([k]) => !['confidence', 'sources', 'gaps', 'handoffs'].includes(k)).map(([key, value]) => (
        <div key={key} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
              {key.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="px-4 py-3">
            {renderContent(value)}
          </div>
        </div>
      ))}

      {/* Sources */}
      {output.sources?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Sources</span>
          </div>
          <div className="px-4 py-3 space-y-1">
            {output.sources.map((src, i) => (
              <a key={i} href={src.url || '#'} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
                <ExternalLink size={10} className="flex-shrink-0" />
                {src.title || src.url}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Gaps / what I don't know */}
      {output.gaps?.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-amber-600 mb-2">
            What I don't know
          </div>
          <ul className="space-y-1">
            {output.gaps.map((gap, i) => (
              <li key={i} className="text-sm text-amber-700 flex gap-2">
                <span className="flex-shrink-0">·</span>{gap}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Main AgentPage ───────────────────────────────────────────────────────────
export function AgentPage() {
  const { agentId } = useParams()
  const agent = getAgentById(agentId)
  if (!agent) return <Navigate to="/" replace />

  const swarm = SWARM_META[agent.swarm]
  const s = statusMeta[agent.status]
  const [formData, setFormData] = useState({})
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState(null)
  const [error, setError] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)
  const [tab, setTab] = useState('run') // 'run' | 'spec'

  const handleRun = async () => {
    if (agent.status === 'planned') return
    setRunning(true)
    setError(null)
    setOutput(null)

    try {
      if (agent.status === 'demo') {
        // Demo mode — simulate a realistic delay then return mock output
        await new Promise(r => setTimeout(r, 2200))
        setOutput(generateDemoOutput(agent, formData))
      } else {
        const result = await runAgent(agent.edgeFunction, { ...formData, agent_id: agent.id })
        setOutput(result)
      }
    } catch (err) {
      setError(err.message || 'Agent run failed. Check inputs and try again.')
    } finally {
      setRunning(false)
    }
  }

  const requiredFilled = agent.inputs
    ?.filter(i => i.required && i.type !== 'auto')
    .every(i => formData[i.key] && formData[i.key] !== '')

  return (
    <div className="min-h-screen">
      {/* Agent header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 lg:px-8 py-4">
        <div className="max-w-[1100px] flex items-center gap-4">
          <Link to={`/swarm/${agent.swarm}`}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">{swarm.label}</span>
          </Link>
          <div className="w-px h-4 bg-slate-200 flex-shrink-0" />
          <span className="text-xl flex-shrink-0">{agent.icon}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-900 leading-tight truncate">{agent.name}</h1>
            <p className="font-mono text-xs text-slate-400 truncate">{agent.role}</p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: s.bg, color: s.color }}>{s.label}</span>
        </div>
      </div>

      <div className="max-w-[1100px] px-6 lg:px-8 py-6 fade-in">

        {/* Tagline */}
        <p className="text-slate-600 mb-6 max-w-2xl leading-relaxed border-l-4 border-indigo-200 pl-4 italic">
          {agent.tagline}
        </p>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-6">
          {['run', 'spec'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize"
              style={tab === t
                ? { background: 'white', color: '#0A192F', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                : { color: '#64748B' }}>
              {t === 'run' ? '▶ Run Agent' : '📋 Spec'}
            </button>
          ))}
        </div>

        {tab === 'run' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left: Input form */}
            <div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
                  style={{ background: swarm.bg }}>
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-wider mb-1"
                      style={{ color: swarm.color }}>Inputs</div>
                    <p className="text-xs text-slate-500">{agent.whatItDoes}</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {agent.inputs?.map(input => (
                    <div key={input.key}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <label className="text-sm font-medium text-slate-700">{input.label}</label>
                        {input.required && input.type !== 'auto' && (
                          <span className="text-xs text-red-400">*</span>
                        )}
                      </div>
                      <InputField
                        input={input}
                        value={formData[input.key]}
                        onChange={v => setFormData(prev => ({ ...prev, [input.key]: v }))}
                        disabled={running}
                      />
                      {input.hint && (
                        <p className="mt-1 text-xs text-slate-400">{input.hint}</p>
                      )}
                    </div>
                  ))}

                  {/* Run button */}
                  <div className="pt-2">
                    {agent.status === 'planned' ? (
                      <div className="w-full py-3 rounded-lg text-sm font-medium text-center bg-slate-100 text-slate-400 cursor-not-allowed">
                        Coming soon
                      </div>
                    ) : (
                      <button onClick={handleRun}
                        disabled={running || !requiredFilled}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: running || !requiredFilled ? '#94A3B8' : swarm.color }}>
                        {running ? (
                          <><Loader size={14} className="animate-spin" /> Running…</>
                        ) : (
                          <><Play size={14} /> Run {agent.name}</>
                        )}
                      </button>
                    )}
                    {!requiredFilled && !running && agent.status !== 'planned' && (
                      <p className="text-xs text-slate-400 text-center mt-2">Fill required fields to run</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Handoffs */}
              {agent.handoffs?.length > 0 && (
                <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-3">
                    Handoffs
                  </div>
                  <div className="space-y-2">
                    {agent.handoffs.map((h, i) => {
                      const targetAgent = AGENTS.find(a => a.id === h.to)
                      const ht = handoffTriggerStyle[h.trigger]
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                            style={{ background: ht.bg, color: ht.color }}>{ht.label}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-semibold text-slate-700">
                                {targetAgent?.name || h.to}
                              </span>
                              <ArrowRight size={10} className="text-slate-300 flex-shrink-0" />
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{h.condition}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Output */}
            <div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Output</div>
                  {output && <CheckCircle size={14} className="text-emerald-500" />}
                  {running && <Loader size={14} className="animate-spin text-indigo-400" />}
                  {error && <AlertCircle size={14} className="text-red-400" />}
                </div>
                <div className="p-5">
                  {!output && !running && !error && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-3xl mb-3 opacity-30">{agent.icon}</div>
                      <p className="text-sm text-slate-400">
                        {agent.status === 'planned' ? 'This agent is coming soon.' : 'Fill inputs and run the agent to see output here.'}
                      </p>
                    </div>
                  )}
                  {running && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Loader size={24} className="animate-spin text-indigo-400 mb-3" />
                      <p className="text-sm text-slate-500 font-medium">Running {agent.name}…</p>
                      <p className="text-xs text-slate-400 mt-1">Gathering → Validating → Synthesising → Verifying</p>
                    </div>
                  )}
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-600 font-medium mb-1">Agent run failed</p>
                      <p className="text-xs text-red-500">{error}</p>
                    </div>
                  )}
                  {output && !running && (
                    <OutputDisplay output={output} agentColor={swarm.color} />
                  )}
                </div>
              </div>
            </div>
          </div>

        ) : (
          // Spec tab
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">

              {/* Outputs spec */}
              <Section title="Outputs" accent={swarm.color}>
                <div className="space-y-2">
                  {agent.outputs?.map((out, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-800">{out.name}</div>
                        <div className="font-mono text-xs text-slate-400 mt-0.5">{out.format}</div>
                        <div className="text-xs text-slate-500 mt-1">{out.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Logic Gates */}
              <Section title="Logic Gates" accent={swarm.color}>
                <div className="space-y-2">
                  {agent.logicGates?.map((g, i) => (
                    <div key={i} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                      <div className="text-xs font-bold mb-1" style={{ color: swarm.color }}>{g.gate}</div>
                      <div className="text-sm text-slate-600 leading-relaxed">→ {g.rule}</div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            <div className="space-y-6">
              {/* What it does */}
              <Section title="What it does" accent={swarm.color}>
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 border-l-4"
                  style={{ borderLeftColor: swarm.color }}>
                  <p className="text-sm text-slate-600 leading-relaxed">{agent.whatItDoes}</p>
                </div>
              </Section>

              {/* FAQ */}
              <Section title="FAQ" accent={swarm.color}>
                <div className="space-y-2">
                  {agent.faqs?.map((faq, i) => (
                    <div key={i} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                      <button className="w-full flex items-center justify-between px-4 py-3 text-left"
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                        <span className="text-sm font-medium text-slate-800 pr-4">{faq.q}</span>
                        {openFaq === i
                          ? <ChevronUp size={14} className="text-slate-400 flex-shrink-0" />
                          : <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
                        }
                      </button>
                      {openFaq === i && (
                        <div className="px-4 pb-3 border-t border-slate-100">
                          <p className="text-sm text-slate-600 leading-relaxed pt-2">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Demo output generator ────────────────────────────────────────────────────
function generateDemoOutput(agent, formData) {
  const demos = {
    'diagnostic': {
      confidence: 'medium',
      state_summary: `Based on the context provided and live web scraping:\n\n**Where are we?**\nRevenue architecture shows classic Series A-to-B transition strain. Pipeline generation is working but conversion efficiency is inconsistent across reps and segments.\n\n**How did we get here?**\nEarly-stage GTM motion relied on founder-led sales and a narrow ICP. As the team scaled, that motion wasn't systematised — resulting in inconsistent qualification and forecast variance.\n\n**Where could we be?**\nWith a tightened ICP definition and structured qualification enforcement, win rate could recover 8–12 percentage points within two quarters.\n\n**How do we get there?**\nThree leverage points surfaced: ICP clarification, qualification framework adoption, and pipeline review cadence.\n\n**Are we getting there?**\nInsufficient data to assess — this is the first diagnostic run.`,
      constraint_map: `**Primary constraint:** Pipeline quality (not volume)\n→ Win rate declining despite pipeline growth\n→ Forecast variance >25% in last two quarters\n→ Single-threaded deals above Stage 3\n\n**Secondary constraint:** ICP drift\n→ 30% of pipeline outside original ICP\n→ Out-of-ICP deals taking 40% longer to close\n→ Win rate on out-of-ICP deals: 12% vs 34% in-ICP`,
      gaps: ['Product usage data not available — could sharpen constraint analysis', 'Prior quarter actuals not provided — planning cycle recommendations limited'],
      sources: [{ title: 'Web scrape: company homepage', url: '#' }, { title: 'Market signal: LinkedIn hiring data', url: '#' }]
    },
    'signals-scout': {
      confidence: 'high',
      intent_assessment: `**Account:** ${formData.target_domain || 'Target account'}\n\n**Why Now Score:** 8.2/10\n\n**Signal Summary:**\n→ Series B announcement ($18M) — 47 days ago\n→ VP Sales hire posted — LinkedIn, 23 days ago\n→ New HubSpot integration listed on tech stack — 31 days ago\n→ 3x headcount growth signal on LinkedIn\n\n**Interpretation:**\nFunding + VP Sales hire + CRM tooling change = active GTM investment cycle. High probability they are evaluating new vendors for the scaled sales motion.`,
      fit_tier: `**Tier: A**\n\nReasoning:\n→ Company size (180 employees) — within ICP\n→ Industry (B2B SaaS) — exact ICP match\n→ Tech stack signals consistent with ICP profile\n→ Funding stage (Series B) — highest-fit stage per closed-won analysis`,
      gaps: ['No direct contact identified at VP level — multi-thread via LinkedIn recommended', 'No pricing signal available — deal size estimate based on company size heuristic only'],
      sources: [{ title: 'Funding news: TechCrunch', url: '#' }, { title: 'LinkedIn: VP Sales job posting', url: '#' }, { title: 'BuiltWith: HubSpot detected', url: '#' }]
    },
    'competitor-intel': {
      confidence: 'high',
      latest_news: `→ Raised $24M Series B (3 weeks ago) — likely accelerating product and GTM\n→ Announced new enterprise tier with SSO and audit logs\n→ CEO quoted in Forbes: "We're going upmarket in 2026"`,
      hiring_signals: `→ 4 open enterprise sales roles (Director+ level)\n→ VP of Customer Success — new role, not a backfill\n→ Solutions Engineer x2 — signals complex deal motion`,
      funding_ma: `→ Series B: $24M led by Sequoia, closed Jan 2026\n→ No M&A activity detected in lookback period`,
      blog_posts: `→ "Why we rebuilt our data model" — product depth signal\n→ "Enterprise security at scale" — positioning toward compliance buyers\n→ "2026 product roadmap" — public roadmap, useful for competitive positioning`,
      strategic_implications: `**Watch:** Upmarket move is confirmed by three independent signals (funding, job posts, CEO quotes). Their enterprise motion will likely intersect with your deals at 200+ employee accounts.\n\n**Opportunity:** Their SMB product is likely to be deprioritised — displacement opportunity in that segment.\n\n**Risk:** They will have more sales capacity in H1 2026. Multi-threading your deals before they do is time-sensitive.`,
      gaps: ['LinkedIn post content not crawlable — missing personal thought leadership signal', 'Pricing page gated — no pricing change detected'],
      sources: [{ title: 'TechCrunch: Series B announcement', url: '#' }, { title: 'Company blog', url: '#' }, { title: 'LinkedIn: job postings', url: '#' }, { title: 'Forbes interview', url: '#' }]
    },
  }

  return demos[agent.id] || {
    confidence: 'medium',
    summary: `Demo output for ${agent.name}.\n\nThis agent is in demo mode — the UI, input/output structure, logic gates, and handoff chain are all live. Connect your data sources to activate real runs.`,
    what_was_analysed: `Input received and processed through the 4-step chain:\n→ Gather: Input data captured\n→ Validate: Structure verified\n→ Synthesise: Analysis complete\n→ Verify: Output checked against quality rules`,
    gaps: ['Real data source not connected — using demo mode', 'Connect HubSpot or paste live data to get actual output']
  }
}
