import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { AGENTS, SWARM_META } from '../data/agents'

const statusMeta = {
  live:    { label: 'Live',        bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  demo:    { label: 'Demo',        bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  planned: { label: 'Coming Soon', bg: '#F9FAFB', color: '#94A3B8', border: '#E2E8F0' },
}

function AgentCard({ agent }) {
  const swarm = SWARM_META[agent.swarm]
  const s = statusMeta[agent.status]

  return (
    <Link to={`/agent/${agent.id}`}
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all duration-200 group overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-2xl">{agent.icon}</span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
            {s.label}
          </span>
        </div>
        <h3 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
          {agent.name}
        </h3>
        <p className="font-mono text-xs text-slate-400 mb-3">{agent.role}</p>
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{agent.tagline}</p>
      </div>
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex gap-3">
          <span className="font-mono text-[11px] text-slate-400">
            {agent.inputs?.length || 0} inputs
          </span>
          <span className="font-mono text-[11px] text-slate-300">·</span>
          <span className="font-mono text-[11px] text-slate-400">
            {agent.outputs?.length || 0} outputs
          </span>
          <span className="font-mono text-[11px] text-slate-300">·</span>
          <span className="font-mono text-[11px] text-slate-400">
            {agent.handoffs?.length || 0} handoffs
          </span>
        </div>
        <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
      </div>
    </Link>
  )
}

export function SwarmPage() {
  const { swarmId } = useParams()
  const swarm = SWARM_META[swarmId]
  if (!swarm) return <Navigate to="/" replace />

  const agents = AGENTS.filter(a => a.swarm === swarmId)
  const live = agents.filter(a => a.status === 'live').length

  return (
    <div className="p-6 lg:p-8 max-w-[1100px] fade-in">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-6">
        <ArrowLeft size={14} /> Dashboard
      </Link>

      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: swarm.bg }}>
          {swarmId === 'strategy' ? '🧭' : swarmId === 'sales' ? '⚡' : swarmId === 'marketing' ? '📣' : swarmId === 'cs' ? '💚' : '⚙️'}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{swarm.label} Swarm</h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
              {live}/{agents.length} live
            </span>
          </div>
          <p className="text-sm text-slate-500">{swarm.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  )
}
