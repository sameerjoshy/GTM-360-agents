import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LAYERS, TOOL_CATALOG, getAgentsFor, getToolsFor, getTotalProcessCount } from '../data/framework'
import { AGENTS } from '../data/agents'

const statusMeta = {
  live: { label: 'live', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  demo: { label: 'demo', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  build: { label: 'to build', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
}

function liveAgentIds() {
  return new Set(AGENTS.map((a) => a.id))
}

function AgentBadge({ id }) {
  const slot = getAgentsFor({ agents: [id] })[0]
  if (!slot) return null
  const meta = statusMeta[slot.status] || statusMeta.build
  const live = liveAgentIds().has(id)
  if (live) {
    return (
      <Link
        to={`/agent/${id}`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${meta.cls} hover:opacity-80 transition-opacity`}
      >
        {slot.name}
        <span className={`w-1.5 h-1.5 rounded-full ${slot.status === 'live' ? 'bg-emerald-500' : slot.status === 'demo' ? 'bg-amber-500' : 'bg-slate-400'}`} />
      </Link>
    )
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${meta.cls}`}>
      {slot.name} · {meta.label}
    </span>
  )
}

function ToolChip({ id }) {
  const tool = TOOL_CATALOG[id]
  if (!tool) return null
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-600 group">
      {tool.name}
      {tool.alt?.length > 0 && (
        <span className="text-slate-300 group-hover:hidden">+{tool.alt.length}</span>
      )}
      {tool.alt?.length > 0 && (
        <span className="hidden group-hover:inline text-slate-400 font-normal">
          alt: {tool.alt.join(', ')}
        </span>
      )}
    </span>
  )
}

function ProcessDetail({ process }) {
  const agents = getAgentsFor(process)
  const tools = getToolsFor(process)
  return (
    <div className="mt-5 pt-5 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Workflow pipeline */}
      <div className="lg:col-span-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Workflow</p>
        <div className="flex flex-wrap items-center gap-2">
          {process.workflow.map((stage, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
                <span className="text-slate-300 font-mono">{i + 1}</span>
                {stage}
              </span>
              {i < process.workflow.length - 1 && <span className="text-slate-300">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Agents */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Agents</p>
        {agents.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {agents.map((a) => <AgentBadge key={a.id} id={a.id} />)}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No agent mapped yet — advisory service.</p>
        )}
      </div>

      {/* Tools */}
      <div className="lg:col-span-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Tools <span className="font-normal">· we use → alternates (hover)</span>
        </p>
        {tools.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tools.map((t) => <ToolChip key={t.id} id={t.id} />)}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No tools mapped yet.</p>
        )}
      </div>
    </div>
  )
}

function LayerCard({ layer }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => { setOpen(!open); setSelected(null) }}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <span
          className="w-2.5 h-12 rounded-full shrink-0"
          style={{ background: layer.color }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono font-bold text-slate-400">{layer.id}</p>
          <h3 className="text-lg font-bold text-slate-900">{layer.name}</h3>
          <p className="text-sm text-slate-500 line-clamp-2">{layer.blurb}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold text-slate-400">{layer.processes.length} processes</span>
          <span className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
          </span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {layer.processes.map((p) => (
              <button
                key={p.name}
                onClick={() => setSelected(selected === p.name ? null : p.name)}
                className={`text-left border rounded-lg p-4 transition-colors cursor-pointer ${
                  selected === p.name ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{p.name}</h4>
                  <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${selected === p.name ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {getAgentsFor(p).slice(0, 3).map((a) => (
                    <span key={a.id} className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusMeta[a.status]?.cls || statusMeta.build.cls}`}>
                      {a.name}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <ProcessDetail process={layer.processes.find((p) => p.name === selected)} />
          )}
        </div>
      )}
    </div>
  )
}

export function Framework() {
  const totalProcesses = getTotalProcessCount()
  const liveCount = AGENTS.filter((a) => a.status === 'live').length
  const toolCount = Object.keys(TOOL_CATALOG).length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="px-6 md:px-10 pt-8 pb-6 border-b border-slate-200 bg-white">
        <div className="max-w-5xl">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-500 mb-2">GTM-360 · The Framework</p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
            The operating model, mapped to agents and tools.
          </h1>
          <p className="text-slate-600 max-w-2xl leading-relaxed">
            We advise on the strategy, workflows, processes, and execution. And we help you build
            the stack and the AI engine that runs it. This is the map — every layer, every process,
            and the agents and tools that drive each one.
          </p>
          <div className="mt-6 flex flex-wrap gap-6">
            {[
              { v: LAYERS.length, l: 'Layers' },
              { v: totalProcesses, l: 'Processes' },
              { v: liveCount, l: 'Live agents' },
              { v: toolCount, l: 'Tools mapped' },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-2xl font-bold text-slate-900">{s.v}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Layers */}
      <div className="px-6 md:px-10 py-8">
        <div className="max-w-5xl space-y-3">
          {LAYERS.map((layer) => <LayerCard key={layer.id} layer={layer} />)}
        </div>

        <div className="max-w-5xl mt-8 p-5 bg-white border border-slate-200 rounded-xl flex items-start gap-3">
          <span className="text-slate-400 mt-0.5">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.5 5.5L20 10l-5.5 2.5L12 18l-2.5-5.5L4 10l5.5-2.5L12 2z" /></svg>
          </span>
          <p className="text-sm text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-700">Every process follows the same loop:</span>{' '}
            identify → collect/assess → prioritize → enrich → personalize → execute → optimize. Agents
            marked <span className="font-semibold">live</span> run today;{' '}
            <span className="font-semibold">to build</span> slots are where the engine grows next.
          </p>
        </div>
      </div>
    </div>
  )
}