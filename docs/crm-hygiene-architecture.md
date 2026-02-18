# CRM Hygiene Agent - Architecture Decisions

**Project:** GTM-360 CRM Immune System  
**Agent:** Company Hygiene Validator (v1.0)  
**Date:** 2026-02-18  
**Status:** APPROVED - Ready for Implementation

---

## **ARCHITECTURE DECISIONS**

### **1. Deployment Model**
- ✅ **Supabase Edge Function** (consistent with existing 14 agents)
- **Trigger:** Manual via API call (no cron yet)
- **Timeout:** 30 seconds max
- **Future:** Add Supabase Cron for daily runs in v2

**Rationale:** Start simple, manual testing phase first

---

### **2. Change Log Storage**
- ✅ **Supabase PostgreSQL Database**
- **Tables:** `crm_change_log`, `crm_flag_queue`, `agent_runs`
- **Schema:** See below

**Rationale:** Easy rollback, queryable, already have Supabase

---

### **3. Fuzzy String Matching**
- ✅ **npm: `fuzzball@2.1.2`** (Python fuzzywuzzy port)
- **Import:** `import fuzz from 'npm:fuzzball@2.1.2'`
- **Use for:** Company name normalization, variant detection

**Rationale:** Battle-tested, works in Deno, more features than alternatives

---

### **4. External Data Enrichment**
- ✅ **None for v1**
- **Future:** Add Clearbit/LinkedIn validation in v2

**Rationale:** Keep v1 simple, free, fast. Validate concept first.

---

### **5. Confidence Calibration**
- ✅ **Manual calibration** (1 week dry-run review)
- **Process:** 
  - Run dry-run mode
  - Review 100 proposed fixes
  - Tune confidence weights until 90% = 90% accurate
- **Output:** Calibration report included in agent response

**Rationale:** Need real data to tune. Can't guess weights accurately.

---

### **6. HubSpot Properties to Validate**
- ✅ **Hardcoded critical fields only (v1)**

**Company Fields:**
```typescript
const CRITICAL_COMPANY_FIELDS = [
  'name',              // Company name normalization
  'domain',            // Parent-child clustering
  'industry',          // Industry validation
  'annualrevenue',     // Firmographic sanity
  'numberofemployees'  // Firmographic sanity
]
```

**Future:** Add user-configurable field selection in v2

**Rationale:** 5 fields = focused, testable. Can expand after validation.

---

### **7. Batch Size & Rate Limits**
- ✅ **100 companies per run** (HubSpot limit: 100/request)
- **Rate limit handling:** Built-in (HubSpot MCP tools handle this)
- **Incremental:** Process only changed records (by `hs_lastmodifieddate`)

**Future:** Increase to 1,000/run with proper batching in v2

**Rationale:** Stay within edge function timeout, safe for v1

---

### **8. Launch Mode**
- ✅ **Dry-run ONLY for v1**
- **Flag:** `dry_run: true` (hardcoded in v1)
- **Behavior:** All confidence levels → Flag only (no auto-fix)

**Phase 2:** Enable auto-fix for ≥95% confidence after 1 week validation  
**Phase 3:** Lower to ≥90% confidence after 2 weeks

**Rationale:** Zero risk. Build trust. Tune confidence first.

---

### **9. User Interface**
- ✅ **No UI for v1** (JSON output only)
- **Access:** Via API call or agents.gtm-360.com agent card
- **Output:** JSON with flag_queue array

**Future v2:** Build approval dashboard at `/hygiene-companies/review`

**Rationale:** Focus on agent logic first. UI is Phase 2.

---

### **10. Rollback Mechanism**
- ✅ **Automatic rollback function** (Supabase Edge Function)
- **Endpoint:** `/rollback-hygiene-changes`
- **Input:** `agent_run_id` or `rollback_id`
- **Action:** Restore `old_value` from change log

**Rationale:** Safety net. Must be able to undo any auto-fix.

---

## **DATABASE SCHEMA**

```sql
-- Change log for all CRM modifications
CREATE TABLE crm_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id uuid NOT NULL REFERENCES agent_runs(id),
  object_type text NOT NULL,           -- 'company' | 'contact' | 'deal'
  record_id text NOT NULL,              -- HubSpot object ID
  field_name text NOT NULL,             -- 'name', 'industry', etc.
  old_value jsonb,                      -- Original value (for rollback)
  new_value jsonb,                      -- New value applied
  confidence_score integer NOT NULL,    -- 0-100
  action_type text NOT NULL,            -- 'auto_fix' | 'flag'
  applied_at timestamptz DEFAULT now(),
  rollback_at timestamptz,              -- When rolled back (if ever)
  rollback_by text,                     -- Who rolled back
  
  CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 100),
  CONSTRAINT valid_object_type CHECK (object_type IN ('company', 'contact', 'deal')),
  CONSTRAINT valid_action_type CHECK (action_type IN ('auto_fix', 'flag'))
);

-- Flag queue for manual review
CREATE TABLE crm_flag_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id uuid NOT NULL REFERENCES agent_runs(id),
  record_id text NOT NULL,
  object_type text NOT NULL,
  issue_description text NOT NULL,      -- What's wrong
  suggested_action text NOT NULL,       -- What to do
  confidence_score integer NOT NULL,    -- Why it wasn't auto-fixed
  severity text NOT NULL,               -- 'BLOCKER' | 'WARNING' | 'ADVISORY'
  pattern text,                         -- E.g., "Parent-Child Mismatch"
  flagged_at timestamptz DEFAULT now(),
  resolved_at timestamptz,              -- When user acted on it
  resolved_by text,                     -- Who resolved it
  resolution_action text,               -- 'applied' | 'dismissed' | 'modified'
  
  CONSTRAINT valid_severity CHECK (severity IN ('BLOCKER', 'WARNING', 'ADVISORY'))
);

-- Agent execution tracking
CREATE TABLE agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,             -- 'hygiene-companies'
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  records_audited integer DEFAULT 0,
  issues_found integer DEFAULT 0,
  auto_fixes_applied integer DEFAULT 0,
  flags_raised integer DEFAULT 0,
  dry_run boolean DEFAULT true,
  error_message text,                   -- If run failed
  
  -- Metadata
  user_id text,                         -- Who triggered run
  trigger_type text                     -- 'manual' | 'cron' | 'api'
);

-- Indexes for performance
CREATE INDEX idx_change_log_run ON crm_change_log(agent_run_id);
CREATE INDEX idx_change_log_record ON crm_change_log(record_id);
CREATE INDEX idx_flag_queue_run ON crm_flag_queue(agent_run_id);
CREATE INDEX idx_flag_queue_unresolved ON crm_flag_queue(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_agent_runs_date ON agent_runs(started_at DESC);
```

---

## **TECHNOLOGY STACK**

**Runtime:**
- Deno 1.x (Supabase Edge Function environment)
- TypeScript

**Dependencies:**
```typescript
import fuzz from 'npm:fuzzball@2.1.2'           // Fuzzy string matching
// HubSpot tools accessed via MCP (no npm package needed)
// Supabase client available in edge function context
```

**APIs Used:**
- HubSpot MCP Tools (via Claude's built-in tools)
  - `HubSpot:search_crm_objects`
  - `HubSpot:get_crm_objects`
  - `HubSpot:manage_crm_objects` (only when auto-fix enabled)
- Supabase PostgreSQL (change log storage)

---

## **VALIDATION SCOPE (v1)**

### **Company Validations Implemented:**

1. **Name Normalization**
   - Fuzzy match against existing companies (>85% similarity)
   - Common typo detection ("Microsft" → "Microsoft")
   - Variant consolidation ("Microsoft Inc" vs "Microsoft Corporation")
   - Confidence: 90%+ for exact brand names, 70-89% for variants

2. **Parent-Child Structure**
   - Domain clustering (same domain = potential subsidiaries)
   - Regional variant detection (contains "India", "EMEA", "APAC")
   - Confidence: 85%+ for same domain, 70-84% for regional patterns

3. **Industry Validation**
   - Taxonomy enforcement (HubSpot valid industry codes)
   - Brand-based inference (Microsoft → COMPUTER_SOFTWARE)
   - Confidence: 95%+ for known brands, 60-70% for inference

4. **Firmographic Sanity**
   - Revenue-employee correlation check
   - Outlier detection (revenue >10x benchmark)
   - Confidence: 50-70% (statistical only, always FLAG not auto-fix)

### **NOT in v1 (Future):**
- Contact validations (separate agent)
- Deal validations (already have Hygiene Agent v2.0)
- Cross-object validations (v2)

---

## **OUTPUT FORMAT**

```typescript
interface CompanyHygieneOutput {
  // Summary
  summary: string,
  records_audited: number,
  issues_found: number,
  auto_fixes_applied: 0,              // Always 0 in dry-run
  flags_raised: number,
  
  // Flag queue (for manual review)
  flag_queue: {
    priority: number,
    record_id: string,
    company_name: string,
    issue: string,
    suggested_action: string,
    confidence: number,
    severity: 'BLOCKER' | 'WARNING' | 'ADVISORY',
    pattern: string | null
  }[],
  
  // Root cause analysis
  root_causes: {
    schema_issues: string[],
    training_issues: string[],
    automation_issues: string[]
  },
  
  // Calibration report
  calibration: {
    confidence_distribution: {
      '90-100': number,
      '70-89': number,
      '0-69': number
    },
    recommendation: string
  },
  
  // Metadata
  _meta: {
    agent: 'hygiene-companies',
    version: '1.0',
    dry_run: true,
    run_id: string,
    verification_score: number
  }
}
```

---

## **DEPLOYMENT PLAN**

### **Phase 1: Build & Test (Week 1)**
- [x] Architecture decisions finalized
- [ ] Create Supabase tables
- [ ] Build edge function
- [ ] Test with 10 companies (manual)
- [ ] Verify fuzzy matching accuracy

### **Phase 2: Dry-Run Validation (Week 2)**
- [ ] Deploy to production (dry-run: true)
- [ ] Process 100 companies
- [ ] Manually review all flags
- [ ] Tune confidence weights
- [ ] Document calibration results

### **Phase 3: Enable Auto-Fix (Week 3+)**
- [ ] Get RevOps approval
- [ ] Enable auto-fix for ≥95% confidence
- [ ] Monitor change log daily
- [ ] Lower to ≥90% after validation

---

## **SUCCESS CRITERIA**

**v1 Launch:**
- ✅ Processes 100 companies in <30 seconds
- ✅ Detects 3+ issue types (name, parent-child, industry, firmographic)
- ✅ Confidence scores calibrated (90% = 90% accurate)
- ✅ Zero false positives in manual review
- ✅ Full rollback capability tested

**Production Ready:**
- After 1 week dry-run with zero issues
- After manual review of 100+ flags
- After confidence calibration validated
- After RevOps sign-off

---

## **RISKS & MITIGATIONS**

| Risk | Mitigation |
|---|---|
| False positive auto-fixes | Dry-run only for v1 |
| Confidence mis-calibration | 1 week manual review period |
| API rate limits | Batch size limited to 100 |
| Edge function timeout | Process only 100 records/run |
| Data loss on rollback | Full before/after logging |
| HubSpot API changes | Error handling + graceful degradation |

---

## **FILE STRUCTURE**

```
/tmp/GTM-360-agents/
└── supabase/functions/
    ├── agent-hygiene-companies/
    │   ├── index.ts                    # Main entry point
    │   ├── validations/
    │   │   ├── nameNormalization.ts    # Name fuzzy matching
    │   │   ├── parentChild.ts          # Domain clustering
    │   │   ├── industry.ts             # Taxonomy validation
    │   │   └── firmographic.ts         # Revenue/employee checks
    │   ├── confidence/
    │   │   └── scorer.ts               # Confidence calculation
    │   └── utils/
    │       ├── fuzzyMatch.ts           # Fuzzball wrapper
    │       └── logger.ts               # Change log to Supabase
    │
    └── rollback-hygiene-changes/
        └── index.ts                    # Rollback endpoint
```

---

## **READY FOR IMPLEMENTATION**

All architectural decisions finalized. Ready to build in new thread.

**Next Steps:**
1. Create new thread: "CRM Hygiene Agent - Company Validator"
2. Create Supabase database tables
3. Build edge function following skill pattern
4. Test with 10 companies
5. Deploy in dry-run mode

---

**Approved by:** Sameer Joshi  
**Implementation start:** 2026-02-18
