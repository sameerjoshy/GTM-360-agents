import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Framework } from './pages/Framework'
import { Dashboard } from './pages/Dashboard'
import { ToolIndex } from './pages/ToolIndex'
import { SwarmPage } from './pages/SwarmPage'
import { AgentPage } from './pages/AgentPage'

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Framework />} />
          <Route path="/agents" element={<Dashboard />} />
          <Route path="/tools" element={<ToolIndex />} />
          <Route path="/swarm/:swarmId" element={<SwarmPage />} />
          <Route path="/agent/:agentId" element={<AgentPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}