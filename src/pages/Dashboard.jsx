import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { AGENTS, SWARM_META } from '../data/agents'

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-sm">
      <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-2">{label}</div>
      <div className="text-3xl font-bold tracking-tight mb-1" style={{ color: color || '#0A192F' }}>{value}</div>
      <div className="text-xs text-slate-400">{sub}</div>
    </div>
  )
}

function AgentRow({ agent }) {
  const swarm = SWARM_META[agent.swarm]
  const statusMeta = {
    live:    { label: 'Live',        bg: '#ECFDF5', color: '#059669' },
    demo:    { label: 'Demo',        bg: '#FFFBEB', color: '#D97706' },
    planned: { label: 'Coming Soon', bg: '#F9FAFB', color: '#94A3B8' },
  }
  const s = statusMeta[agent.status]

  return (
    <Link to={`/agent/${agent.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-lg transition-colors group cursor-pointer">
      <span className="text-xl w-7 text-center flex-shrink-0">{agent.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
          {agent.name}
        </div>
        <div className="text-xs text-slate-400 truncate">{agent.role}</div>
      </div>
      <span className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
        style={{ background: s.bg, color: s.color }}>
        {s.label}
      </span>
      <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
    </Link>
  )
}

function SwarmCard({ swarm }) {
  const agents = AGENTS.filter(a => a.swarm === swarm.id)
  const liveCount = agents.filter(a => a.status === 'live').length

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100"
        style={{ background: swarm.bg }}>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full" style={{ background: swarm.color }} />
            <h3 className="text-sm font-bold" style={{ color: swarm.color }}>{swarm.label} Swarm</h3>
          </div>
          <p className="font-mono text-xs text-slate-400">{swarm.description}</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-xs text-slate-400">{liveCount}/{agents.length} live</div>
          <Link to={`/swarm/${swarm.id}`}
            className="font-mono text-xs hover:underline mt-0.5 block transition-colors"
            style={{ color: swarm.color }}>
            View all →
          </Link>
        </div>
      </div>
      <div className="divide-y divide-slate-50">
        {agents.slice(0, 3).map(agent => (
          <AgentRow key={agent.id} agent={agent} />
        ))}
        {agents.length > 3 && (
          <Link to={`/swarm/${swarm.id}`}
            className="flex items-center justify-center py-3 text-xs text-slate-400 hover:text-indigo-600 transition-colors">
            +{agents.length - 3} more agents →
          </Link>
        )}
      </div>
    </div>
  )
}

export function Dashboard() {
  const swarms = Object.values(SWARM_META)
  const live = AGENTS.filter(a => a.status === 'live').length
  const demo = AGENTS.filter(a => a.status === 'demo').length
  const planned = AGENTS.filter(a => a.status === 'planned').length

  return (
    <div className="p-6 lg:p-8 max-w-[1100px] fade-in">

      {/* Header */}
      <div className="mb-8">
        <div className="font-mono text-xs uppercase tracking-widest text-slate-400 mb-2">
          GTM-360 · Agent Swarm
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          The Commercial Engine
        </h1>
        <p className="text-sm text-slate-500 max-w-xl">
          {AGENTS.length} agents across {swarms.length} swarms. Each agent follows a four-step chain: gather real data, validate quality, synthesise with LLM, verify output. No vanity — every agent changes what you do next.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total Agents"  value={AGENTS.length} sub={`across ${swarms.length} swarms`} />
        <StatCard label="Live"          value={live}    sub="real API calls"   color="#059669" />
        <StatCard label="Demo"          value={demo}    sub="mock data, real UI" color="#D97706" />
        <StatCard label="Coming Soon"   value={planned} sub="in development"   color="#94A3B8" />
      </div>

      {/* How agents work */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-8">
        <div className="font-mono text-[11px] uppercase tracking-widest text-slate-400 mb-3">
          How every agent works
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: '01', label: 'Gather', desc: 'Real data pulled from web, CRM, or your input' },
            { step: '02', label: 'Validate', desc: 'Quality checked, gaps named, confidence set' },
            { step: '03', label: 'Synthesise', desc: 'LLM call with schema + self-critique instruction' },
            { step: '04', label: 'Verify', desc: 'Output checked against rules before returning' },
          ].map(({ step, label, desc }) => (
            <div key={step} className="flex gap-3">
              <span className="font-mono text-xs font-bold text-indigo-300 mt-0.5 flex-shrink-0">{step}</span>
              <div>
                <div className="text-sm font-semibold text-slate-700">{label}</div>
                <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Swarm grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {swarms.map(swarm => (
          <SwarmCard key={swarm.id} swarm={swarm} />
        ))}
      </div>
    </div>
  )
}
