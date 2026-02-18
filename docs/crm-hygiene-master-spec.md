# CRM HYGIENE AGENT — MASTER SPECIFICATION

**Project:** GTM-360 CRM Immune System  
**Version:** 1.0  
**Status:** APPROVED - Ready for Build  
**Last Updated:** 2026-02-18  

---

## 🎯 EXECUTIVE SUMMARY

**What:** AI agent that audits, validates, and corrects CRM data quality across HubSpot Companies, Contacts, and Deals.

**Why:** Bad CRM data creates false forecasts, missed opportunities, and broken sales processes. Manual cleanup is slow and incomplete.

**How:** Automated daily scans that detect issues with high confidence, auto-fix safe changes (≥90% confidence), and flag everything else for human review.

**Outcome:** 100% trustworthy CRM that protects revenue decisions from bad data.

---

## 📋 TABLE OF CONTENTS

1. [Role & Purpose](#role--purpose)
2. [Core Objective](#core-objective)
3. [Operating Principles](#operating-principles)
4. [Scope & Objects](#scope--objects)
5. [Task Definitions](#task-definitions)
6. [Confidence & Action Policy](#confidence--action-policy)
7. [Architecture & Technology](#architecture--technology)
8. [Tools & Integrations](#tools--integrations)
9. [Output Format](#output-format)
10. [Deployment Strategy](#deployment-strategy)
11. [Success Metrics](#success-metrics)

---

## 1️⃣ ROLE & PURPOSE

### **Role**

You are a **CRM Hygiene & Data Quality Agent** operating on a HubSpot CRM.

You behave like a **senior RevOps / Sales Admin** whose sole responsibility is to audit, validate, correct, and protect CRM data quality.

### **What You Are NOT**

- ❌ You do not sell, forecast, or create new records (unless explicitly instructed)
- ❌ You do not make strategic recommendations
- ❌ You do not generate reports or dashboards
- ❌ You do not train users or create documentation

### **What You ARE**

- ✅ The CRM immune system
- ✅ A data quality enforcer
- ✅ An automated RevOps auditor
- ✅ A protective layer between users and bad data

### **Purpose**

Ensure the CRM is:
1. **Accurate** — Data reflects reality
2. **Consistent** — Fields follow naming conventions
3. **Deduplicated** — No redundant records
4. **Structurally sound** — Relationships (parent-child, contact-company) are correct

---

## 2️⃣ CORE OBJECTIVE

**Maintain a 100% trustworthy CRM** by:

1. **Detecting** incorrect, inconsistent, or improbable data
2. **Validating** records using internal logic and external signals
3. **Auto-correcting** only when confidence is high (≥90%)
4. **Flagging** and escalating when confidence is medium or low (<90%)
5. **Preventing** future data degradation through pattern analysis

### **Target Outcomes**

| Metric | Target | Measurement |
|---|---|---|
| Data Accuracy | >95% | % of records with no blockers |
| Duplicate Rate | <2% | Duplicates per 1,000 records |
| Forecast Reliability | >85% | Deals with all required fields |
| Time to Clean Data | <10 min/week | Manual cleanup time saved |
| False Positive Rate | <5% | Auto-fixes that were wrong |

---

## 3️⃣ OPERATING PRINCIPLES (CRITICAL)

### **Sacred Rules (NEVER VIOLATE)**

1. **Never fabricate data** — If you don't know, FLAG (don't guess)
2. **Never delete records** — Mark as archived instead
3. **Never overwrite human-entered notes** — Append only
4. **Never merge records without preserving history** — Keep all associations
5. **Always log every action taken** — Full audit trail required
6. **Prefer flagging over guessing** — Conservative > aggressive
7. **If uncertain → FLAG, DO NOT FIX**

### **Confidence-First Approach**

```
High Confidence (≥90%)  → Auto-fix + Log
Medium Confidence (70-89%) → Flag + Recommend
Low Confidence (<70%)   → Flag Only
```

### **Safety Gates**

- **Dry-run mode** (v1): No auto-fixes, only flags
- **Rollback capability**: Every change can be undone
- **Human approval**: Bulk operations (>100 changes) require confirmation
- **Rate limits**: Max 1,000 auto-fixes per day

---

## 4️⃣ SCOPE & OBJECTS

### **Objects in Scope**

You operate on:
- ✅ **Companies** (primary focus for v1)
- ✅ **Contacts** (v2)
- ✅ **Deals** (v2 - already have Hygiene Agent v2.0)

You may read (but not modify):
- 📖 Owners (for validation)
- 📖 Pipelines (for stage validation)
- 📖 Activities (for freshness checks)

### **v1 Scope (Company Hygiene Only)**

**Fields Validated:**
- `name` — Company name normalization
- `domain` — Parent-child clustering
- `industry` — Industry taxonomy validation
- `annualrevenue` — Firmographic sanity checks
- `numberofemployees` — Firmographic sanity checks

**Batch Size:** 100 companies per run  
**Trigger:** Manual (API call or UI button)  
**Mode:** Dry-run only (all confidence levels → flag, no auto-fix)

---

## 5️⃣ TASK DEFINITIONS

### **1️⃣ COMPANY RECORD TASKS**

#### **1.1 Company Name Accuracy**

**Audit for:**
- Typos (e.g., "Microsft" → "Microsoft")
- Variants ("Microsoft Inc", "Microsoft Corporation", "Microsoft – US")
- Location-polluted names ("Microsoft India Office")
- Abbreviations used inconsistently ("Corp" vs "Corporation")

**Validation Logic:**
```typescript
// Fuzzy string matching (using fuzzball library)
const similarity = fuzz.ratio(name1, name2)

if (similarity >= 95) {
  confidence = 90  // High - likely typo
} else if (similarity >= 85) {
  confidence = 75  // Medium - variant detected
} else {
  confidence = 50  // Low - flag for review
}

// Domain-name match validation
if (domain === "microsoft.com" && name.includes("Microsft")) {
  confidence = 95  // Very high - clear typo
}
```

**Actions:**
- **≥90% confidence:** Normalize name to canonical form
- **70-89%:** Flag as variant, suggest merge
- **<70%:** Flag for manual review

**Examples:**
| Old Value | New Value | Confidence | Action |
|---|---|---|---|
| Microsft | Microsoft | 95% | Auto-fix |
| Microsoft Inc | Microsoft Corporation | 85% | Flag + suggest canonical |
| Microsoft India | Microsoft | 75% | Flag (may be subsidiary) |

---

#### **1.2 Parent–Child Account Structure**

**Audit for:**
- Same domain across multiple companies
- Regional names ("Microsoft India", "Microsoft EMEA", "Microsoft APAC")
- Enterprise-sized companies treated as standalone SMBs

**Validation Logic:**
```typescript
// Group companies by domain
const companiesByDomain = groupBy(companies, 'domain')

for (const [domain, comps] of companiesByDomain) {
  if (comps.length > 1) {
    // Check for regional patterns
    const hasRegional = comps.some(c => 
      c.name.includes('India') || 
      c.name.includes('EMEA') || 
      c.name.includes('APAC')
    )
    
    if (hasRegional) {
      confidence = 85  // Likely parent-child
      action = 'RECOMMEND_PARENT_CHILD_LINK'
    }
  }
}
```

**Actions:**
- **≥90%:** Auto-create parent-child association (if not exists)
- **70-89%:** Flag with recommended parent
- **<70%:** Flag for legal/structural review

**Examples:**
| Company A | Company B | Pattern | Confidence | Action |
|---|---|---|---|---|
| Microsoft | Microsoft India | Same domain + regional | 85% | Flag + suggest parent-child |
| Acme Corp | Acme Inc | Same domain + variant | 75% | Flag (may be legal entities) |

---

#### **1.3 Industry & Category Validation**

**Audit for:**
- Illogical categories (e.g., Microsoft → "Home Improvement")
- Overuse of "Other" (>20% of companies)
- Inconsistent taxonomy usage

**Validation Logic:**
```typescript
// Brand recognition (known companies)
const KNOWN_BRANDS = {
  'microsoft.com': 'COMPUTER_SOFTWARE',
  'salesforce.com': 'COMPUTER_SOFTWARE',
  'stripe.com': 'FINANCIAL_SERVICES',
  // ... etc
}

if (KNOWN_BRANDS[domain] && industry !== KNOWN_BRANDS[domain]) {
  confidence = 95  // Very high - known brand mismatch
  action = 'AUTO_FIX'
}

// Industry taxonomy validation
const VALID_INDUSTRIES = [
  'COMPUTER_SOFTWARE',
  'INFORMATION_TECHNOLOGY_AND_SERVICES',
  'FINANCIAL_SERVICES',
  // ... HubSpot's full industry list
]

if (!VALID_INDUSTRIES.includes(industry)) {
  confidence = 100  // Invalid enum value
  action = 'AUTO_FIX_TO_OTHER'
}
```

**Actions:**
- **≥90%:** Auto-correct to correct industry
- **70-89%:** Flag with suggested industry
- **<70%:** Flag for manual classification

**Examples:**
| Company | Current Industry | Domain | Suggested | Confidence | Action |
|---|---|---|---|---|---|
| Microsoft | Home Improvement | microsoft.com | COMPUTER_SOFTWARE | 95% | Auto-fix |
| Acme Corp | Other | acmecorp.com | ? | 40% | Flag only |

---

#### **1.4 Firmographic Sanity Checks**

**Audit for:**
- Revenue improbabilities (e.g., Microsoft with $100M ARR)
- Free-text revenue fields ("~$5M" instead of structured)
- Employee count inconsistencies (1 employee, $50M revenue)

**Validation Logic:**
```typescript
// Revenue-Employee correlation benchmarks
const BENCHMARKS = {
  '1-50': { minRevenue: 0, maxRevenue: 5000000 },
  '51-200': { minRevenue: 1000000, maxRevenue: 50000000 },
  '201-1000': { minRevenue: 10000000, maxRevenue: 500000000 },
  '1001+': { minRevenue: 50000000, maxRevenue: 10000000000 }
}

const employeeRange = getRange(numberofemployees)
const benchmark = BENCHMARKS[employeeRange]

if (annualrevenue > benchmark.maxRevenue * 3) {
  confidence = 65  // Medium - possible outlier
  action = 'FLAG_OUTLIER'
}
```

**Actions:**
- **≥90%:** Convert free-text to structured (rare)
- **70-89%:** Flag as outlier
- **<70%:** Flag for verification

**Examples:**
| Company | Employees | Revenue | Issue | Confidence | Action |
|---|---|---|---|---|
| Microsoft | 150 | $100M | Revenue too low for brand | 70% | Flag outlier |
| Startup Inc | 5 | $50M | Revenue too high for size | 75% | Flag outlier |
| Acme Corp | 200 | "~$10M" | Free-text format | 85% | Flag + suggest structured |

---

### **2️⃣ CONTACT RECORD TASKS** (v2 — Future)

#### **2.1 Contact–Company Alignment**
- Email domain ↔ company domain mismatch
- Personal emails (gmail.com) on company record
- Contacts tied to duplicate companies

#### **2.2 Job Title & Role Normalization**
- "CEO" vs "Chief Executive Officer" vs "ceo"
- Junk titles ("N/A", "Employee", "User")
- Extract seniority (C-level, VP, Director, Manager, IC)

#### **2.3 Contact Duplication**
- Same email across multiple records
- Name + company fuzzy match
- Preserve engagement history on merge

#### **2.4 Contact Freshness**
- No activity >180 days
- Invalid/bounced emails
- Job change detection (LinkedIn signal)

---

### **3️⃣ DEAL RECORD TASKS** (Already covered by Hygiene Agent v2.0)

See existing agent at: `/tmp/GTM-360-agents/supabase/functions/agent-hygiene-v2/`

---

### **4️⃣ CROSS-OBJECT CHECKS** (v3 — Future)

- Customers (lifecycle stage = "customer") in outbound prospecting sequences
- Vendors/partners misclassified as prospects
- Deals with no assigned owner
- Records owned by inactive users
- Conflicting lifecycle stages (contact = "lead", company = "customer")

---

## 6️⃣ CONFIDENCE & ACTION POLICY

### **Confidence Scoring Framework**

```typescript
const CONFIDENCE_WEIGHTS = {
  exact_match: 100,        // Email/domain exact match
  fuzzy_high: 90,          // >95% string similarity
  fuzzy_medium: 70,        // 80-95% similarity
  heuristic_match: 85,     // Domain + name match
  external_signal: 75,     // LinkedIn, Clearbit validation
  inference: 60,           // Job title → seniority mapping
  statistical: 50          // Outlier detection only
}

function calculateConfidence(validations: Validation[]): number {
  return validations.reduce((acc, v) => 
    acc + (CONFIDENCE_WEIGHTS[v.type] * v.matchStrength), 0
  ) / validations.length
}
```

### **Action Policy**

| Confidence Range | Action | Logging | User Notification |
|---|---|---|---|
| **≥ 90%** | Auto-fix + log | Full audit trail | Silent (unless bulk >100) |
| **70-89%** | Flag + recommend | Issue queue | Daily digest |
| **< 70%** | Flag only | Issue queue | Weekly rollup |

### **v1 Override (Dry-Run Mode)**

**ALL confidence levels → Flag only (no auto-fix)**

This ensures:
- Zero risk of incorrect changes
- Build user trust through review period
- Calibrate confidence weights with real data
- Validate before enabling auto-fix in v2

---

## 7️⃣ ARCHITECTURE & TECHNOLOGY

### **Deployment Model**

```
┌─────────────────────────────────────────┐
│  User triggers agent via:               │
│  - API call                             │
│  - UI button (agents.gtm-360.com)      │
│  - Manual run (Postman/curl)           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Supabase Edge Function                 │
│  (agent-hygiene-companies)              │
│  - Timeout: 30 seconds                  │
│  - Batch size: 100 companies            │
│  - Runtime: Deno 1.x + TypeScript       │
└──────────────┬──────────────────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌──────────┐    ┌──────────────┐
│ HubSpot  │    │  Supabase DB │
│   CRM    │    │  (change log)│
│ (via MCP)│    │  3 tables    │
└──────────┘    └──────────────┘
```

### **Technology Stack**

**Runtime:**
- Deno 1.x (Supabase Edge Function)
- TypeScript 5.x

**Dependencies:**
```typescript
import fuzz from 'npm:fuzzball@2.1.2'  // Fuzzy string matching
// HubSpot MCP tools (built-in to Claude)
// Supabase client (built-in to edge functions)
```

**Database:**
- PostgreSQL (Supabase)
- 3 tables: `crm_change_log`, `crm_flag_queue`, `agent_runs`

**APIs:**
- HubSpot API (via Claude MCP tools)
- Supabase PostgreSQL

---

## 8️⃣ TOOLS & INTEGRATIONS

### **HubSpot MCP Tools Used**

#### **1. Read Operations**

```typescript
// Search for companies
const companies = await HubSpot.search_crm_objects({
  objectType: 'companies',
  properties: ['name', 'domain', 'industry', 'annualrevenue', 'numberofemployees'],
  filterGroups: [{
    filters: [{
      propertyName: 'hs_lastmodifieddate',
      operator: 'GT',
      value: lastRunTimestamp  // Incremental processing
    }]
  }],
  limit: 100
})

// Get specific companies by ID
const company = await HubSpot.get_crm_objects({
  objectType: 'companies',
  objectIds: [companyId],
  properties: ['name', 'domain', 'industry']
})
```

#### **2. Write Operations** (v2+ only, after dry-run validation)

```typescript
// ALWAYS capture before state first
const before = await HubSpot.get_crm_objects({
  objectType: 'companies',
  objectIds: [companyId],
  properties: ['name']
})

// Apply fix
await HubSpot.manage_crm_objects({
  confirmationStatus: 'CONFIRMED',
  updateRequest: {
    objects: [{
      objectType: 'companies',
      objectId: companyId,
      properties: {
        name: 'Microsoft'  // Corrected from 'Microsft'
      }
    }]
  }
})

// Capture after state
const after = await HubSpot.get_crm_objects({
  objectType: 'companies',
  objectIds: [companyId],
  properties: ['name']
})

// Log to Supabase
await logChange({
  record_id: companyId,
  object_type: 'company',
  field: 'name',
  old_value: before[0].properties.name,
  new_value: after[0].properties.name,
  confidence: 95
})
```

### **Supabase Database Schema**

```sql
-- Change log for audit trail and rollback
CREATE TABLE crm_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id uuid NOT NULL REFERENCES agent_runs(id),
  object_type text NOT NULL CHECK (object_type IN ('company', 'contact', 'deal')),
  record_id text NOT NULL,
  field_name text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  confidence_score integer NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  action_type text NOT NULL CHECK (action_type IN ('auto_fix', 'flag')),
  applied_at timestamptz DEFAULT now(),
  rollback_at timestamptz,
  rollback_by text
);

-- Flag queue for manual review
CREATE TABLE crm_flag_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id uuid NOT NULL REFERENCES agent_runs(id),
  record_id text NOT NULL,
  object_type text NOT NULL,
  issue_description text NOT NULL,
  suggested_action text NOT NULL,
  confidence_score integer NOT NULL,
  severity text NOT NULL CHECK (severity IN ('BLOCKER', 'WARNING', 'ADVISORY')),
  pattern text,  -- e.g., "Typo", "Parent-Child Mismatch", "Industry Mismatch"
  flagged_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by text,
  resolution_action text  -- 'applied' | 'dismissed' | 'modified'
);

-- Agent execution tracking
CREATE TABLE agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  records_audited integer DEFAULT 0,
  issues_found integer DEFAULT 0,
  auto_fixes_applied integer DEFAULT 0,
  flags_raised integer DEFAULT 0,
  dry_run boolean DEFAULT true,
  error_message text,
  user_id text,
  trigger_type text  -- 'manual' | 'cron' | 'api'
);

-- Indexes for performance
CREATE INDEX idx_change_log_run ON crm_change_log(agent_run_id);
CREATE INDEX idx_change_log_record ON crm_change_log(record_id);
CREATE INDEX idx_flag_queue_unresolved ON crm_flag_queue(resolved_at) WHERE resolved_at IS NULL;
```

---

## 9️⃣ OUTPUT FORMAT

### **Standard Agent Response**

```typescript
interface CompanyHygieneOutput {
  // Summary
  summary: string,                    // 2-3 sentence diagnosis
  records_audited: number,
  issues_found: number,
  auto_fixes_applied: number,         // Always 0 in dry-run mode
  flags_raised: number,
  
  // Flag queue (for manual review)
  flag_queue: {
    priority: number,                  // 1 = highest
    record_id: string,                 // HubSpot company ID
    company_name: string,
    issue: string,                     // Specific diagnosis
    suggested_action: string,          // What to do
    confidence: number,                // Why it wasn't auto-fixed
    severity: 'BLOCKER' | 'WARNING' | 'ADVISORY',
    pattern: string | null             // e.g., "Typo", "Parent-Child"
  }[],
  
  // Change log (only in v2+ when auto-fix enabled)
  change_log: {
    record_id: string,
    company_name: string,
    field: string,
    old_value: string | null,
    new_value: string,
    confidence: number,
    timestamp: string,
    rollback_id: string
  }[],
  
  // Root cause analysis
  root_causes: {
    schema_issues: string[],           // Missing fields, wrong types
    training_issues: string[],         // Process not followed
    automation_issues: string[]        // Workflow bugs, import errors
  },
  
  // Calibration report (for tuning confidence weights)
  calibration: {
    confidence_distribution: {
      '90-100': number,
      '70-89': number,
      '0-69': number
    },
    recommendation: string              // e.g., "Tune fuzzy match threshold"
  },
  
  // Metadata
  _meta: {
    agent: 'hygiene-companies',
    version: '1.0',
    dry_run: boolean,
    run_id: string,
    verification_score: number,         // Self-critique 0-10
    execution_time_ms: number
  }
}
```

### **Example Output**

```json
{
  "summary": "Audited 100 companies. Found 12 issues: 3 name typos, 5 industry mismatches, 4 parent-child structure opportunities. All flagged for review (dry-run mode).",
  "records_audited": 100,
  "issues_found": 12,
  "auto_fixes_applied": 0,
  "flags_raised": 12,
  
  "flag_queue": [
    {
      "priority": 1,
      "record_id": "298087488228",
      "company_name": "Microsft Corporation",
      "issue": "Company name contains typo. 95% fuzzy match to 'Microsoft Corporation'. Domain confirms: microsoft.com",
      "suggested_action": "Auto-fix: Change name to 'Microsoft Corporation'",
      "confidence": 95,
      "severity": "WARNING",
      "pattern": "Typo"
    },
    {
      "priority": 2,
      "record_id": "298132149956",
      "company_name": "TechFlow India",
      "issue": "Same domain (techflow.io) as 'TechFlow Solutions'. Regional name pattern detected. Likely parent-child relationship.",
      "suggested_action": "Link 'TechFlow India' as child of 'TechFlow Solutions' (parent)",
      "confidence": 85,
      "severity": "ADVISORY",
      "pattern": "Parent-Child Mismatch"
    }
  ],
  
  "change_log": [],
  
  "root_causes": {
    "schema_issues": [],
    "training_issues": [
      "Name typos suggest manual data entry without validation"
    ],
    "automation_issues": []
  },
  
  "calibration": {
    "confidence_distribution": {
      "90-100": 3,
      "70-89": 5,
      "0-69": 4
    },
    "recommendation": "Confidence well-distributed. Ready for auto-fix at ≥90% after manual review."
  },
  
  "_meta": {
    "agent": "hygiene-companies",
    "version": "1.0",
    "dry_run": true,
    "run_id": "550e8400-e29b-41d4-a716-446655440000",
    "verification_score": 9,
    "execution_time_ms": 8473
  }
}
```

---

## 🔟 DEPLOYMENT STRATEGY

### **Phase 1: Build & Test (Week 1)**

**Goals:**
- ✅ Build working edge function
- ✅ Create Supabase tables
- ✅ Test with 10 sample companies
- ✅ Verify fuzzy matching accuracy

**Deliverables:**
- Edge function at `supabase/functions/agent-hygiene-companies/`
- Database tables created
- Test results documented

**Success Criteria:**
- Processes 10 companies in <5 seconds
- Detects at least 2 different issue types
- Zero crashes or errors
- All flags have specific suggested actions

---

### **Phase 2: Dry-Run Validation (Week 2)**

**Goals:**
- ✅ Deploy to production (dry-run: true)
- ✅ Process 100 real companies from HubSpot
- ✅ Manually review all flags
- ✅ Tune confidence weights

**Process:**
1. Run agent on 100 companies
2. Export flag_queue to CSV
3. Manually review each flag (mark as correct/incorrect)
4. Calculate actual accuracy per confidence bucket
5. Adjust confidence weights if needed
6. Re-run and validate

**Deliverables:**
- Calibration report showing accuracy by confidence level
- Updated confidence weights (if needed)
- Documentation of false positives/negatives

**Success Criteria:**
- 90% confidence bucket = >85% actual accuracy
- 70-89% bucket = >65% actual accuracy
- <5% false positives
- Zero data corruption

---

### **Phase 3: Enable Auto-Fix (Week 3+)**

**Goals:**
- ✅ Get RevOps sign-off
- ✅ Enable auto-fix for ≥95% confidence
- ✅ Monitor change log daily
- ✅ Lower to ≥90% after validation

**Process:**
1. Present Phase 2 results to RevOps
2. Get approval to enable auto-fix
3. Deploy with `dry_run: false` and `auto_fix_threshold: 95`
4. Monitor for 3 days
5. Review all auto-fixes (sample 20%)
6. Lower threshold to 90 if no issues

**Deliverables:**
- Auto-fix enabled in production
- Daily monitoring dashboard
- Weekly calibration reviews

**Success Criteria:**
- <2% rollback rate
- Zero complaints from sales team
- >80% of flags resolved automatically

---

## 1️⃣1️⃣ SUCCESS METRICS

### **Data Quality Metrics**

| Metric | Baseline | Target | Measurement |
|---|---|---|---|
| **Duplicate Company Rate** | TBD | <2% | Duplicates per 1,000 records |
| **Missing Critical Fields** | TBD | <5% | % records missing name/domain/industry |
| **Name Typo Rate** | TBD | <1% | % companies with name typos |
| **Industry Accuracy** | TBD | >95% | % companies in correct industry |
| **Parent-Child Coverage** | TBD | >80% | % subsidiaries linked to parent |

### **Operational Metrics**

| Metric | Target | Measurement |
|---|---|---|
| **Processing Speed** | <30s per 100 records | Execution time |
| **False Positive Rate** | <5% | Auto-fixes that were wrong |
| **Flag Resolution Rate** | >70% | Flags acted on within 7 days |
| **Manual Cleanup Time** | <10 min/week | Time saved for RevOps |
| **Agent Uptime** | >99% | Successful runs / total runs |

### **Business Impact Metrics**

| Metric | Target | Measurement |
|---|---|---|
| **Forecast Accuracy** | +10% improvement | Close rate vs predicted |
| **Data Trust Score** | >4/5 | Sales team survey |
| **Time to Clean CRM** | -80% | Hours saved per month |
| **Revenue at Risk** | <5% | Pipeline in duplicate/bad records |

---

## 📚 APPENDIX

### **A. File Structure**

```
/tmp/GTM-360-agents/
├── supabase/functions/
│   ├── agent-hygiene-companies/
│   │   ├── index.ts                    # Main entry point
│   │   ├── validations/
│   │   │   ├── nameNormalization.ts    # Fuzzy matching
│   │   │   ├── parentChild.ts          # Domain clustering
│   │   │   ├── industry.ts             # Taxonomy validation
│   │   │   └── firmographic.ts         # Revenue/employee checks
│   │   ├── confidence/
│   │   │   └── scorer.ts               # Confidence calculation
│   │   └── utils/
│   │       ├── fuzzyMatch.ts           # Fuzzball wrapper
│   │       └── logger.ts               # Supabase logging
│   │
│   └── rollback-hygiene-changes/
│       └── index.ts                    # Rollback endpoint
│
├── docs/
│   ├── crm-hygiene-master-spec.md      # This document
│   └── crm-hygiene-architecture.md     # Technical decisions
│
└── /mnt/skills/user/crm-agent-builder/
    └── SKILL.md                         # Build patterns & best practices
```

### **B. Related Documents**

- **Architecture Decisions:** `/tmp/GTM-360-agents/docs/crm-hygiene-architecture.md`
- **Build Skill:** `/mnt/skills/user/crm-agent-builder/SKILL.md`
- **Existing Hygiene Agent v2.0:** `/tmp/GTM-360-agents/supabase/functions/agent-hygiene-v2/`

### **C. Glossary**

- **Auto-fix:** Automatic correction of data issues when confidence ≥90%
- **Confidence Score:** 0-100 metric indicating certainty of proposed fix
- **Dry-run Mode:** Safe mode where no changes are made to CRM
- **Flag:** Issue detected but not auto-fixed, requires human review
- **Fuzzy Match:** String similarity algorithm for detecting typos/variants
- **Parent-Child:** Hierarchical relationship between companies (HQ vs subsidiary)
- **Rollback:** Undo operation that restores previous field values

---

## ✅ FINAL CHECKLIST

Before starting implementation, confirm:

- [ ] All architectural decisions approved
- [ ] HubSpot MCP tools tested and working
- [ ] Supabase project accessible
- [ ] Fuzzball library can be imported in Deno
- [ ] Test data available (10-100 companies in HubSpot)
- [ ] Success metrics baseline captured
- [ ] RevOps stakeholder identified for approval

---

**END OF SPECIFICATION**

This document is the single source of truth for the CRM Hygiene Agent.  
All implementation should refer back to this specification.

**Questions or clarifications needed?** Start new thread with reference to this document.
