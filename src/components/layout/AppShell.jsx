import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ExternalLink, ChevronRight } from 'lucide-react'
import { AgentsLogo } from '../ui/Logo'
import { SWARM_META, AGENTS } from '../../data/agents'

function StatusDot({ status }) {
  const colors = { live: '#10B981', demo: '#F59E0B', planned: '#94A3B8' }
  return (
    <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{ background: colors[status] || '#94A3B8' }} />
  )
}

function SwarmNavItem({ swarm }) {
  const agentCount = AGENTS.filter(a => a.swarm === swarm.id).length
  const liveCount = AGENTS.filter(a => a.swarm === swarm.id && a.status === 'live').length
  const location = useLocation()
  const isActive = location.pathname.startsWith(`/swarm/${swarm.id}`)

  return (
    <NavLink
      to={`/swarm/${swarm.id}`}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${
        isActive
          ? 'bg-white/10 text-white'
          : 'text-white/50 hover:text-white/80 hover:bg-white/5'
      }`}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
        style={{ background: isActive ? swarm.color : 'rgba(255,255,255,0.2)' }} />
      <span className="flex-1 truncate">{swarm.label}</span>
      <span className="font-mono text-xs px-1.5 py-0.5 rounded"
        style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }}>
        {liveCount}/{agentCount}
      </span>
    </NavLink>
  )
}

export function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => { setSidebarOpen(false) }, [location])

  const swarms = Object.values(SWARM_META)
  const liveTotal = AGENTS.filter(a => a.status === 'live').length

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F8FAFC' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-[240px] flex flex-col
        transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ background: '#0A192F' }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/8">
          <NavLink to="/">
            <AgentsLogo size="md" />
          </NavLink>
          <button onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/40 hover:text-white/70 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* System status */}
        <div className="px-5 py-3 border-b border-white/8">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse" />
            <span className="font-mono text-xs text-white/35">{liveTotal} agents live</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">

          {/* Overview */}
          <div className="px-3 pb-1">
            <span className="font-mono text-[10px] tracking-widest uppercase text-white/25">
              Overview
            </span>
          </div>
          <NavLink to="/"
            className={({ isActive }) => `
              flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
              ${isActive && location.pathname === '/'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'}
            `}>
            <span className="text-base">⬡</span>
            <span>Dashboard</span>
          </NavLink>

          {/* Swarms */}
          <div className="px-3 pt-4 pb-1">
            <span className="font-mono text-[10px] tracking-widest uppercase text-white/25">
              Swarms
            </span>
          </div>
          {swarms.map(swarm => (
            <SwarmNavItem key={swarm.id} swarm={swarm} />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/8 space-y-2">
          <a href="https://gtm-360.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors">
            <ExternalLink size={12} />
            Back to gtm-360.com
          </a>
          <a href="https://gtm-360.com/contact" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors">
            <ChevronRight size={12} />
            Request access / support
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
          <button onClick={() => setSidebarOpen(true)}
            className="text-slate-500 hover:text-slate-700 transition-colors">
            <Menu size={20} />
          </button>
          <AgentsLogo size="sm" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
