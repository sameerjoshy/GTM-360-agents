-- GTM-360 Agents: Core persistence schema
-- Run persistence, output storage, handoff chain tracking

-- Agent runs table
CREATE TABLE IF NOT EXISTS agent_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      TEXT NOT NULL,
  swarm_id      TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'running', -- running | completed | failed
  confidence    TEXT,                             -- high | medium | low
  input_payload JSONB,
  output        JSONB,
  error_message TEXT,
  duration_ms   INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

-- Handoff chain tracking (which run triggered which)
CREATE TABLE IF NOT EXISTS agent_handoffs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_run_id   UUID REFERENCES agent_runs(id),
  target_agent_id TEXT NOT NULL,
  trigger_type    TEXT NOT NULL, -- auto | manual
  condition       TEXT,
  data_passed     JSONB,
  status          TEXT DEFAULT 'pending', -- pending | accepted | dismissed
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Signal evidence log (for Signals Scout and Listener)
CREATE TABLE IF NOT EXISTS signal_evidence (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      UUID REFERENCES agent_runs(id),
  signal_type TEXT NOT NULL, -- FUNDING | EXEC_HIRE | PRODUCT_LAUNCH | TECH_STACK | EXPANSION
  domain      TEXT NOT NULL,
  title       TEXT,
  url         TEXT,
  excerpt     TEXT,
  confidence  REAL, -- 0.0-1.0
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor intel runs (reuse existing competitor_reports if present, else create)
CREATE TABLE IF NOT EXISTS competitor_intel_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_name TEXT NOT NULL,
  competitor_url  TEXT,
  run_type        TEXT DEFAULT 'manual', -- manual | scheduled
  output          JSONB,
  sources_found   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_id    ON agent_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at  ON agent_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status      ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_signal_evidence_domain ON signal_evidence(domain);
CREATE INDEX IF NOT EXISTS idx_handoffs_source_run    ON agent_handoffs(source_run_id);

-- RLS: allow all operations for now (anon key access)
ALTER TABLE agent_runs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_handoffs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_evidence      ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_intel_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on agent_runs"            ON agent_runs            FOR ALL USING (true);
CREATE POLICY "Allow all on agent_handoffs"        ON agent_handoffs        FOR ALL USING (true);
CREATE POLICY "Allow all on signal_evidence"       ON signal_evidence       FOR ALL USING (true);
CREATE POLICY "Allow all on competitor_intel_runs" ON competitor_intel_runs FOR ALL USING (true);
