// GTM Framework — single source of truth for the Crew home page.
// Derived from D:\OKR-planner\gtm_frameworks_all_processes.md.
// Maps: Layer → Sub-process → { workflow stages, agents, tools (with alternates) }

export const TOOL_CATALOG = {
  // Strategy / Research
  'tavily':   { name: 'Tavily',         fn: 'Live web/company research', alt: ['Exa', 'Apify', 'Perplexity'] },
  'exa':      { name: 'Exa',            fn: 'Semantic web search',       alt: ['Tavily', 'Apify', 'Brave Search'] },
  'apify':    { name: 'Apify',          fn: 'Web scraping / data crawling', alt: ['Zyte', 'ScraperAPI', 'Octoparse'] },

  // List building / Data
  'ai-ark':   { name: 'AI Ark',         fn: 'AI-driven list building',   alt: ['Clay', 'ZoomInfo', 'Lusha'] },
  'apollo':   { name: 'Apollo',         fn: 'Contact & company database', alt: ['ZoomInfo', 'Lusha', 'Cognism'] },
  'prospeo':  { name: 'Prospeo',        fn: 'Email finding & verification', alt: ['Hunter', 'Snov.io', 'Dropcontact'] },
  'google-maps': { name: 'Google Maps', fn: 'Local business data',       alt: ['OpenStreetMap', 'Yelp API'] },
  'linkedin': { name: 'LinkedIn (job boards)', fn: 'Firmographic & hiring signals', alt: ['Indeed', 'Apollo', 'SellScale'] },

  // Signals
  'parallel': { name: 'Parallel',       fn: 'Buying-intent signals',     alt: ['Bombora', '6sense', 'Common Room'] },
  'apify-signals': { name: 'Apify (signals)', fn: 'Intent data scraping', alt: ['Exa', 'Zyte'] },

  // Enrichment
  'bitscale': { name: 'Bitscale',       fn: 'Lead enrichment & qualification', alt: ['Clay', 'Clearout', 'Enrow'] },
  'clay':     { name: 'Clay',           fn: 'Enrichment + AI workflows', alt: ['Bitscale', 'Enrow', 'Insycle'] },

  // CRM / Pipeline
  'hubspot':  { name: 'HubSpot',        fn: 'CRM (free tier)',           alt: ['Salesforce', 'Pipedrive', 'Attio'] },
  'attio':    { name: 'Attio',          fn: 'Modern CRM',                alt: ['HubSpot', 'Salesforce'] },

  // Personalization / Copy
  'claude':   { name: 'Claude',         fn: 'Copy & workflow orchestration', alt: ['OpenAI', 'DeepSeek', 'Gemini'] },
  'deepseek': { name: 'DeepSeek',       fn: 'Reasoning + copy',          alt: ['Claude', 'OpenAI'] },
  'gpt':      { name: 'OpenAI (GPT)',   fn: 'Copy & analysis',           alt: ['Claude', 'DeepSeek'] },

  // Sending
  'smartlead':{ name: 'Smartlead',      fn: 'Cold email sending, inbox rotation', alt: ['Instantly', 'Lemlist', 'Woodpecker'] },
  'instantly':{ name: 'Instantly',      fn: 'Cold email sending',        alt: ['Smartlead', 'Lemlist'] },
  'lemlist':  { name: 'Lemlist',        fn: 'Outreach + sequences',      alt: ['Smartlead', 'Instantly'] },

  // Automation
  'n8n':      { name: 'n8n',            fn: 'Workflow automation',       alt: ['Zapier', 'Make', 'Airflow'] },
  'zapier':   { name: 'Zapier',         fn: 'No-code automation',        alt: ['Make', 'n8n', 'Relay'] },
  'make':     { name: 'Make',           fn: 'Visual automation',         alt: ['Zapier', 'n8n'] },

  // Communication
  'slack':    { name: 'Slack',          fn: 'Team communication / agent alerts', alt: ['Teams', 'Discord'] },
  'notion':   { name: 'Notion',         fn: 'Docs / knowledge / brain',  alt: ['Confluence', 'Obsidian'] },
  'supabase': { name: 'Supabase',       fn: 'Data + auth + realtime',    alt: ['Postgres', 'Firebase'] },

  // Analytics / Forecasting
  'metabase': { name: 'Metabase',       fn: 'Dashboarding',              alt: ['Looker Studio', 'Power BI', 'Grafana'] },
  'ga':       { name: 'Google Analytics', fn: 'Web analytics',           alt: ['Plausible', 'Mixpanel'] },
  'plausible':{ name: 'Plausible',      fn: 'Privacy-first analytics',   alt: ['GA', 'Fathom'] },
}

// Agent slots: names of Crew agents that can drive a process.
// status: 'live' = exists today, 'build' = slot to build, 'advisory' = advisory service not agent
export const AGENT_SLOTS = {
  // Strategy
  'diagnostic':      { name: 'Diagnostic Agent',     status: 'live', swarm: 'strategy' },
  'planning-cycle':  { name: 'Planning Cycle Agent', status: 'live', swarm: 'strategy' },
  'icp-clarifier':   { name: 'ICP Clarifier',        status: 'demo', swarm: 'strategy' },
  'market-research': { name: 'Market Research',      status: 'build', swarm: 'strategy' },
  'pricing':         { name: 'Pricing Strategist',   status: 'build', swarm: 'strategy' },
  'roadmap-align':   { name: 'Roadmap Aligner',      status: 'build', swarm: 'strategy' },

  // Sales
  'signals-scout':   { name: 'Signals Scout',        status: 'live', swarm: 'sales' },
  'qualifier':       { name: 'Qualifier Agent',      status: 'live', swarm: 'sales' },
  'sniper':          { name: 'Sniper',               status: 'live', swarm: 'sales' },
  'deal-room':       { name: 'Deal Room',            status: 'demo', swarm: 'sales' },
  'forecast':        { name: 'Forecast Analyst',     status: 'build', swarm: 'sales' },
  'playbook':        { name: 'Playbook Builder',     status: 'build', swarm: 'sales' },

  // Marketing
  'listener':        { name: 'Listener',             status: 'live', swarm: 'marketing' },
  'content-multiplier': { name: 'Content Multiplier', status: 'live', swarm: 'marketing' },
  'competitor-intel':{ name: 'Competitor Intel',     status: 'live', swarm: 'marketing' },
  'seo':             { name: 'SEO Analyst',          status: 'build', swarm: 'marketing' },
  'campaign':        { name: 'Campaign Builder',     status: 'build', swarm: 'marketing' },

  // CS
  'health-monitor':  { name: 'Health Monitor',       status: 'demo', swarm: 'expansion' },
  'churn-predictor': { name: 'Churn Predictor',      status: 'demo', swarm: 'expansion' },
  'expansion-radar': { name: 'Expansion Radar',      status: 'demo', swarm: 'expansion' },
  'onboarding':      { name: 'Onboarding Coach',     status: 'build', swarm: 'expansion' },
  'renewal':         { name: 'Renewal Analyst',      status: 'build', swarm: 'expansion' },

  // RevOps
  'hygiene':         { name: 'Hygiene Agent',        status: 'live', swarm: 'operations' },
  'pipeline':        { name: 'Pipeline Auditor',     status: 'build', swarm: 'operations' },
  'attribution':     { name: 'Attribution Analyst',  status: 'build', swarm: 'operations' },
  'comp-quota':      { name: 'Comp & Quota Modeler', status: 'build', swarm: 'operations' },
}

// ── LAYERS ──────────────────────────────────────────────────────────────
export const LAYERS = [
  {
    id: 'L0',
    name: 'Planning & Governance',
    color: '#0A192F',
    blurb: 'Where the strategy is set and kept honest: goals, structure, metrics, reviews.',
    processes: [
      {
        name: 'Annual GTM Strategy',
        workflow: ['Market Research', 'Strategic Options', 'Strategy Selection', 'Resource Allocation', 'Execution Planning', 'Quarterly Reviews', 'Strategy Refinement'],
        agents: ['market-research', 'planning-cycle', 'diagnostic'],
        tools: ['tavily', 'exa', 'notion'],
      },
      {
        name: 'Market & Segment Prioritization',
        workflow: ['Market Scanning', 'Opportunity ID', 'Market Sizing', 'Competitive Assessment', 'Prioritization', 'Segment Definition', 'GTM Planning'],
        agents: ['market-research', 'diagnostic'],
        tools: ['exa', 'tavily', 'apify'],
      },
      {
        name: 'Competitive Positioning',
        workflow: ['Competitive Research', 'Positioning Analysis', 'Message Development', 'Differentiation', 'Messaging Hierarchy', 'Sales/Mktg Alignment', 'Monitoring'],
        agents: ['competitor-intel', 'market-research'],
        tools: ['exa', 'apify', 'notion'],
      },
      {
        name: 'Quarterly GTM Planning',
        workflow: ['Strategy Review', 'Objective Setting', 'Initiative Planning', 'Resource Allocation', 'Team Alignment', 'Execution Kickoff', 'Progress Tracking', 'Results Review'],
        agents: ['planning-cycle', 'diagnostic'],
        tools: ['notion', 'supabase'],
      },
      {
        name: 'Pipeline Planning',
        workflow: ['Revenue Target', 'Conversion Modeling', 'Pipeline Requirements', 'Forecast Build', 'Risk Assessment', 'Mitigation', 'Tracking', 'Adjustment'],
        agents: ['pipeline', 'forecast'],
        tools: ['hubspot', 'metabase', 'supabase'],
      },
      {
        name: 'Sales Playbook Development',
        workflow: ['Segment Definition', 'Use Case Mapping', 'Messaging', 'Objection ID', 'Solution Architecture', 'Playbook Creation', 'Enablement', 'Iteration'],
        agents: ['playbook', 'sniper'],
        tools: ['claude', 'notion', 'hubspot'],
      },
      {
        name: 'GTM Metrics Framework',
        workflow: ['Metric Definition', 'Data Source ID', 'Calculation Logic', 'Baseline', 'Target', 'Dashboard', 'Monitoring', 'Optimization'],
        agents: ['pipeline', 'attribution'],
        tools: ['metabase', 'supabase', 'ga'],
      },
      {
        name: 'Dashboard & Reporting',
        workflow: ['Needs Assessment', 'Metric Selection', 'Dashboard Design', 'Data Integration', 'Automation', 'Distribution', 'Consumption', 'Refinement'],
        agents: ['attribution', 'pipeline'],
        tools: ['metabase', 'supabase', 'n8n'],
      },
      {
        name: 'Data Integrity & Architecture',
        workflow: ['Data Audit', 'Quality ID', 'Governance Plan', 'Integration', 'Validation', 'Monitoring', 'Audit', 'Improvement'],
        agents: ['hygiene'],
        tools: ['supabase', 'n8n', 'metabase'],
      },
      {
        name: 'Decision-Making Framework',
        workflow: ['Decision Type', 'Authority Mapping', 'Process Docs', 'Training', 'Execution', 'Review', 'Feedback', 'Refinement'],
        agents: ['planning-cycle'],
        tools: ['notion', 'slack'],
      },
      {
        name: 'Weekly / Monthly / Quarterly Reviews',
        workflow: ['Status Collection', 'Trend Analysis', 'Discussion', 'Decision Making', 'Action Items', 'Follow-up', 'Learning Capture'],
        agents: ['planning-cycle', 'diagnostic'],
        tools: ['metabase', 'notion', 'slack'],
      },
      {
        name: 'Cross-Functional Alignment',
        workflow: ['Stakeholder ID', 'Alignment Assessment', 'Meeting Design', 'Facilitation', 'Decision', 'Action Plan', 'Follow-up', 'Feedback'],
        agents: ['planning-cycle'],
        tools: ['notion', 'slack'],
      },
      {
        name: 'Team Training & Onboarding',
        workflow: ['Needs Assessment', 'Curriculum Design', 'Content Dev', 'Delivery', 'Execution', 'Verification', 'Reinforcement', 'Learning'],
        agents: ['playbook'],
        tools: ['notion', 'claude', 'slack'],
      },
    ],
  },
  {
    id: 'L1',
    name: 'Demand Generation',
    color: '#0284C7',
    blurb: 'Creating pipeline: outbound, inbound, events, partnerships, PLG, community.',
    processes: [
      {
        name: 'List Building',
        workflow: ['ICP Definition', 'Data Source ID', 'List Sourcing', 'Dedup', 'Validation', 'Quality Check', 'Export'],
        agents: ['signals-scout', 'hygiene'],
        tools: ['ai-ark', 'apollo', 'prospeo', 'google-maps', 'linkedin'],
      },
      {
        name: 'Signal Collection',
        workflow: ['Raw List', 'Signal Source', 'Data Collection', 'Aggregation', 'Recency Scoring', 'Tagging', 'Validation', 'Output'],
        agents: ['signals-scout', 'listener'],
        tools: ['parallel', 'apify-signals', 'exa'],
      },
      {
        name: 'Shortlist / Prioritization',
        workflow: ['Prospects with Signals', 'Scoring Model', 'ICP Fit Scoring', 'Signal Strength', 'Combined Ranking', 'Threshold', 'Segmentation', 'Shortlist'],
        agents: ['signals-scout', 'qualifier'],
        tools: ['parallel', 'clay', 'supabase'],
      },
      {
        name: 'Enrichment',
        workflow: ['Shortlisted', 'Data Provider', 'Enrichment Pulls', 'Company/Contact Data', 'Decision-Maker Mapping', 'Challenge ID', 'Validation', 'Profiles'],
        agents: ['qualifier', 'hygiene'],
        tools: ['bitscale', 'clay', 'apollo'],
      },
      {
        name: 'Personalization',
        workflow: ['Enriched Profiles', 'Signal-to-Angle Mapping', 'Email Copy', 'Subject Lines', 'Sequence Design', 'Template Variation', 'Testing', 'Ready to Send'],
        agents: ['sniper', 'content-multiplier'],
        tools: ['claude', 'smartlead', 'deepseek'],
      },
      {
        name: 'Sending',
        workflow: ['Emails Ready', 'Infrastructure Setup', 'Throttling/Rotation', 'Scheduling', 'Delivery', 'Bounce Mgmt', 'Open/Click', 'Monitoring'],
        agents: ['sniper', 'hygiene'],
        tools: ['smartlead', 'instantly', 'n8n'],
      },
      {
        name: 'Follow-up & Reply Handling',
        workflow: ['Emails in Flight', 'Reply Monitoring', 'Reply Qualification', 'Response Templating', 'Sequence Continuation', 'Non-Reply Escalation', 'Objection Handling', 'Handoff'],
        agents: ['sniper', 'qualifier'],
        tools: ['smartlead', 'claude', 'slack'],
      },
      {
        name: 'Content Strategy',
        workflow: ['Audience', 'Topic Research', 'Pillar Selection', 'Content Planning', 'Format Mix', 'Editorial Calendar', 'Creation', 'Distribution', 'Measurement', 'Optimization'],
        agents: ['content-multiplier', 'listener'],
        tools: ['claude', 'exa', 'notion'],
      },
      {
        name: 'SEO & Organic Search',
        workflow: ['Keyword Research', 'Technical Audit', 'On-Page', 'Content Strategy', 'Link Building', 'Ranking Monitor', 'Traffic', 'Conversion', 'Improvement'],
        agents: ['seo', 'content-multiplier'],
        tools: ['exa', 'ga', 'plausible'],
      },
      {
        name: 'Paid Advertising',
        workflow: ['Objectives', 'Audience', 'Channel', 'Budget', 'Creative', 'Landing Page', 'Launch', 'Monitoring', 'Optimization', 'ROI'],
        agents: ['campaign', 'attribution'],
        tools: ['ga', 'metabase', 'make'],
      },
      {
        name: 'Lead Capture & Nurture',
        workflow: ['Form Design', 'Capture Setup', 'Lead Scoring', 'Trigger Def', 'Nurture Sequence', 'Execution', 'Engagement Monitor', 'Scoring Adjust', 'Handoff'],
        agents: ['listener', 'qualifier'],
        tools: ['hubspot', 'n8n', 'smartlead'],
      },
      {
        name: 'Marketing Automation',
        workflow: ['Platform Selection', 'Integration', 'Workflow Design', 'Sequence Creation', 'Trigger Def', 'Monitoring', 'Lead Scoring', 'Insights', 'Optimization'],
        agents: ['campaign', 'listener'],
        tools: ['n8n', 'hubspot', 'make'],
      },
    ],
  },
  {
    id: 'L2',
    name: 'Sales Acceleration',
    color: '#D97706',
    blurb: 'Turning pipeline into revenue: qualification, SDR process, enterprise sales, enablement.',
    processes: [
      {
        name: 'Lead Scoring',
        workflow: ['Behavior Data', 'Firmographic Data', 'Scoring Model', 'Weight Assignment', 'Score Calculation', 'Threshold', 'Prioritization', 'Testing', 'Optimization'],
        agents: ['qualifier', 'hygiene'],
        tools: ['hubspot', 'supabase', 'clay'],
      },
      {
        name: 'Lead Routing',
        workflow: ['Territory Def', 'Assignment Logic', 'Lead Received', 'Scoring', 'Routing Rules', 'Rep Assignment', 'Notification', 'Acceptance', 'Tracking'],
        agents: ['qualifier'],
        tools: ['hubspot', 'n8n'],
      },
      {
        name: 'ICP Validation',
        workflow: ['ICP Definition', 'Lead Assessment', 'Fit Scoring', 'Categorization', 'Qualified Pass', 'Unqualified Flag', 'Nurture', 'Feedback', 'ICP Refinement'],
        agents: ['icp-clarifier', 'qualifier'],
        tools: ['clay', 'hubspot', 'supabase'],
      },
      {
        name: 'Initial Qualification Call',
        workflow: ['Lead Routed', 'Scheduling', 'Preparation', 'Discovery', 'Qualification', 'Decision', 'Handoff / Nurture'],
        agents: ['qualifier', 'deal-room'],
        tools: ['hubspot', 'notion'],
      },
      {
        name: 'Outbound Prospecting',
        workflow: ['Target List', 'Outreach Strategy', 'Message Dev', 'Outreach Execution', 'Response Monitor', 'Follow-up', 'Engagement', 'Meeting Conversion', 'Handoff'],
        agents: ['signals-scout', 'sniper'],
        tools: ['smartlead', 'parallel', 'claude'],
      },
      {
        name: 'Qualification & Discovery',
        workflow: ['Contact Made', 'Qualification Qs', 'Pain ID', 'BANT', 'Use Case Fit', 'Decision', 'Qualified / Disqualified', 'Next Steps'],
        agents: ['qualifier', 'deal-room'],
        tools: ['hubspot', 'notion'],
      },
      {
        name: 'Meeting Setting',
        workflow: ['Qualified', 'Calendar Coord', 'Agenda', 'Stakeholder ID', 'Prep', 'Confirmation', 'AE Briefing', 'Tracking', 'Follow-up'],
        agents: ['sniper'],
        tools: ['hubspot', 'smartlead'],
      },
      {
        name: 'Handoff to AE',
        workflow: ['Meeting Confirmed', 'Context Docs', 'AE Brief', 'Deal Structure', 'Account Assignment', 'Tracking', 'Progress', 'Deal Review'],
        agents: ['deal-room', 'pipeline'],
        tools: ['hubspot', 'notion'],
      },
      {
        name: 'Forecast & Pipeline Management',
        workflow: ['Leads Generated', 'Pipeline Capture', 'Stage Assignment', 'Forecast Model', 'Pipeline Review', 'Risk Assessment', 'Accuracy Measure', 'Adjustment', 'Reporting'],
        agents: ['forecast', 'pipeline'],
        tools: ['hubspot', 'metabase', 'supabase'],
      },
      {
        name: 'Deal Strategy',
        workflow: ['Opportunity ID', 'Deal Analysis', 'Stakeholder Map', 'Competition', 'Win Strategy', 'Pricing', 'Timeline', 'Execution', 'Win/Loss'],
        agents: ['deal-room', 'competitor-intel'],
        tools: ['hubspot', 'notion', 'exa'],
      },
      {
        name: 'Stakeholder Management',
        workflow: ['Stakeholder ID', 'Role Mapping', 'Relationship Assessment', 'Engagement Strategy', 'Outreach', 'Relationship Building', 'Influence Map', 'Engagement'],
        agents: ['deal-room'],
        tools: ['hubspot', 'apollo'],
      },
      {
        name: 'Negotiation & Closing',
        workflow: ['Proposal', 'Objection ID', 'Negotiation', 'Terms', 'Procurement', 'Signature', 'Close', 'CRM Update', 'Handoff to CS'],
        agents: ['deal-room', 'sniper'],
        tools: ['hubspot', 'notion', 'smartlead'],
      },
      {
        name: 'Sales Training',
        workflow: ['Needs Assessment', 'Curriculum Design', 'Content Dev', 'Delivery', 'Execution', 'Verification', 'Certification', 'Reinforcement'],
        agents: ['playbook'],
        tools: ['notion', 'claude'],
      },
      {
        name: 'Manager Coaching & Development',
        workflow: ['Manager Assessment', 'Dev Plan', 'Coaching Curriculum', 'Execution', 'Feedback', 'Practice', 'Reinforcement', 'Monitoring'],
        agents: ['playbook'],
        tools: ['notion', 'claude'],
      },
    ],
  },
  {
    id: 'L3',
    name: 'Customer Success & Retention',
    color: '#059669',
    blurb: 'Protecting and growing revenue after the sale: onboarding, adoption, retention, renewal.',
    processes: [
      {
        name: 'Onboarding Strategy',
        workflow: ['Customer Profile', 'Success Goals', 'Milestone Plan', 'Stakeholder ID', 'Resource Allocation', 'Timeline', 'Kickoff', 'Execution', 'Results'],
        agents: ['onboarding', 'health-monitor'],
        tools: ['hubspot', 'notion'],
      },
      {
        name: 'Implementation Planning',
        workflow: ['Scope', 'Timeline', 'Stakeholder Assignment', 'Resource Allocation', 'Dependency Map', 'Risk ID', 'Kickoff', 'Progress', 'Issue Resolution'],
        agents: ['onboarding'],
        tools: ['notion', 'slack'],
      },
      {
        name: 'Initial Value Realization',
        workflow: ['Quick Wins', 'Implementation', 'Tracking', 'Milestone Celebration', 'Results Comms', 'Confidence', 'Next Phase', 'Support'],
        agents: ['onboarding', 'health-monitor'],
        tools: ['hubspot', 'metabase'],
      },
      {
        name: 'Feature Adoption',
        workflow: ['Feature ID', 'Adoption Goals', 'Champion ID', 'Training Plan', 'In-App Guidance', 'Usage Monitor', 'Adoption Track', 'Barriers', 'Optimization'],
        agents: ['expansion-radar', 'health-monitor'],
        tools: ['metabase', 'supabase'],
      },
      {
        name: 'Usage Monitoring',
        workflow: ['Tracking Setup', 'Baseline', 'Ongoing Monitor', 'Alert Thresholds', 'Anomaly Detection', 'Root Cause', 'Outreach', 'Support', 'Optimization'],
        agents: ['health-monitor'],
        tools: ['metabase', 'supabase', 'n8n'],
      },
      {
        name: 'Health Scoring',
        workflow: ['Metric Def', 'Data Collection', 'Scoring Model', 'Health Calc', 'Risk Categorization', 'Thresholds', 'Monitoring', 'Alert', 'Intervention'],
        agents: ['health-monitor', 'churn-predictor'],
        tools: ['metabase', 'supabase'],
      },
      {
        name: 'At-Risk Detection',
        workflow: ['Health Scoring', 'Risk Monitor', 'Alert Gen', 'Investigation', 'Root Cause', 'Intervention Plan', 'Action', 'Resolution'],
        agents: ['churn-predictor', 'health-monitor'],
        tools: ['metabase', 'supabase', 'n8n'],
      },
      {
        name: 'Churn Prevention',
        workflow: ['At-Risk ID', 'Outreach Plan', 'Executive Review', 'Issue Resolution', 'Value Realization', 'Negotiation', 'Win-back', 'Retention Confirm'],
        agents: ['churn-predictor', 'expansion-radar'],
        tools: ['hubspot', 'smartlead', 'slack'],
      },
      {
        name: 'Win-Back Campaign',
        workflow: ['Churned ID', 'Churn Analysis', 'Win-Back Strategy', 'Outreach', 'Objection Handling', 'Incentive', 'Proposal', 'Negotiation', 'Reactivation'],
        agents: ['expansion-radar', 'sniper'],
        tools: ['hubspot', 'smartlead', 'claude'],
      },
      {
        name: 'Satisfaction Monitoring',
        workflow: ['Survey Plan', 'Distribution', 'Response Collection', 'Analysis', 'Insight', 'Trend Monitor', 'Feedback Loop', 'Action', 'Follow-up'],
        agents: ['listener', 'health-monitor'],
        tools: ['metabase', 'supabase'],
      },
      {
        name: 'Renewal Planning & Forecasting',
        workflow: ['Contract DB', 'Renewal Date Track', 'Risk Assessment', 'Value Tracking', 'Planning Timeline', 'Stakeholder', 'Preparation', 'Outreach', 'Execution'],
        agents: ['renewal', 'forecast'],
        tools: ['hubspot', 'metabase'],
      },
      {
        name: 'Renewal Negotiation',
        workflow: ['Renewal Proposed', 'Negotiation', 'Expansion Discussion', 'Pricing', 'Terms', 'Signature', 'Activation', 'Handoff'],
        agents: ['renewal', 'deal-room'],
        tools: ['hubspot', 'smartlead'],
      },
    ],
  },
  {
    id: 'L4',
    name: 'Account-Based Growth',
    color: '#7C3AED',
    blurb: 'Concentrated expansion: target accounts, land-and-expand, logo growth.',
    processes: [
      {
        name: 'Target Account List (TAL)',
        workflow: ['Opportunity Assessment', 'Account Universe', 'Scoring Criteria', 'Account Scoring', 'Prioritization', 'TAL Creation', 'Stakeholder Assignment', 'Tracking', 'Quarterly Review'],
        agents: ['signals-scout', 'qualifier'],
        tools: ['parallel', 'apollo', 'supabase'],
      },
      {
        name: 'Account Profiling',
        workflow: ['TAL Account', 'Data Research', 'Company Profile', 'Growth Indicators', 'Expansion ID', 'Competitive Analysis', 'Stakeholder Map', 'Strategy'],
        agents: ['signals-scout', 'competitor-intel'],
        tools: ['exa', 'tavily', 'apollo'],
      },
      {
        name: 'Competitive Assessment',
        workflow: ['Account Analysis', 'Competitive Presence', 'Market Share', 'Win/Loss', 'Displacement Strategy', 'Competitive Messaging', 'Execution', 'Monitoring'],
        agents: ['competitor-intel'],
        tools: ['exa', 'apify'],
      },
      {
        name: 'Expansion Opportunity Identification',
        workflow: ['Account Analysis', 'Usage Analysis', 'Expansion Signal Monitor', 'New Use Case', 'Opportunity Scoring', 'Prioritization', 'Strategy', 'Execution Plan'],
        agents: ['expansion-radar', 'listener'],
        tools: ['metabase', 'supabase', 'parallel'],
      },
      {
        name: 'Stakeholder Mapping',
        workflow: ['Current Stakeholders', 'Expansion Def', 'New Stakeholder ID', 'Role Mapping', 'Influence Assessment', 'Engagement Strategy', 'Outreach', 'Relationship'],
        agents: ['deal-room', 'expansion-radar'],
        tools: ['apollo', 'hubspot'],
      },
      {
        name: 'Expansion Strategy',
        workflow: ['Opportunity', 'Business Case', 'ROI Calc', 'Messaging', 'Angle Selection', 'Solution Def', 'Pricing', 'Proposal Plan', 'Enablement'],
        agents: ['expansion-radar', 'sniper'],
        tools: ['claude', 'notion', 'metabase'],
      },
      {
        name: 'Land Strategy',
        workflow: ['Target Company', 'ICP Fit', 'Deal Sizing', 'Entry Strategy', 'Messaging', 'Selling Process', 'Initial Close', 'Implementation', 'Success Focus'],
        agents: ['signals-scout', 'sniper'],
        tools: ['apollo', 'smartlead', 'parallel'],
      },
      {
        name: 'In-Product Expansion Signals',
        workflow: ['Customer Activated', 'Feature Usage Monitor', 'Expansion Signal ID', 'Readiness Scoring', 'Threshold', 'Notification', 'CSM Outreach', 'Timing'],
        agents: ['expansion-radar', 'health-monitor'],
        tools: ['metabase', 'supabase', 'n8n'],
      },
      {
        name: 'Expand Deal Strategy',
        workflow: ['Timing Right', 'Usage Analysis', 'Expansion ROI', 'Business Case', 'Messaging', 'Proposal', 'Selling', 'Negotiation', 'Close'],
        agents: ['expansion-radar', 'deal-room'],
        tools: ['metabase', 'claude', 'hubspot'],
      },
      {
        name: 'New Division / Entity Identification',
        workflow: ['Parent Account', 'Org Research', 'New Division ID', 'Expansion Potential', 'Prioritization', 'Contact Research', 'GTM Planning', 'Execution'],
        agents: ['expansion-radar', 'signals-scout'],
        tools: ['exa', 'apollo', 'tavily'],
      },
    ],
  },
  {
    id: 'L5',
    name: 'Pricing & Packaging',
    color: '#475569',
    blurb: 'Designing how value is captured: strategy, packaging design, optimization.',
    processes: [
      {
        name: 'Value-Based Pricing',
        workflow: ['Customer Research', 'Value Definition', 'Willingness-to-Pay', 'Competitive Benchmarking', 'Pricing Model', 'Testing', 'Refinement', 'Implementation', 'Monitoring'],
        agents: ['pricing', 'market-research'],
        tools: ['exa', 'apify', 'notion'],
      },
      {
        name: 'Competitive Pricing',
        workflow: ['Competitor Research', 'Pricing Tracking', 'Feature Comparison', 'Positioning', 'Differentiation', 'Messaging', 'Sales Training', 'Monitoring', 'Analysis'],
        agents: ['pricing', 'competitor-intel'],
        tools: ['exa', 'apify'],
      },
      {
        name: 'Product Tiers',
        workflow: ['Product Analysis', 'Feature Allocation', 'Tier Definition', 'Naming', 'Pricing', 'Positioning', 'Sales Training', 'Launch', 'Adoption Track'],
        agents: ['pricing', 'roadmap-align'],
        tools: ['notion', 'metabase', 'supabase'],
      },
      {
        name: 'Add-Ons & Usage-Based Pricing',
        workflow: ['Feature Analysis', 'Revenue Potential', 'Bundling', 'Pricing', 'Positioning', 'Launch', 'Adoption', 'Revenue Track', 'Optimization'],
        agents: ['pricing'],
        tools: ['metabase', 'notion'],
      },
      {
        name: 'Enterprise / Custom Pricing',
        workflow: ['Deal Identified', 'Complexity Assessment', 'Approval Process', 'Proposal', 'Negotiation Authority', 'Deal Structure', 'Signature', 'CRM Track', 'Learning'],
        agents: ['pricing', 'deal-room'],
        tools: ['hubspot', 'notion'],
      },
      {
        name: 'A/B Testing & Price Optimization',
        workflow: ['Hypothesis', 'Control/Variation', 'Traffic Allocation', 'Monitoring', 'Analysis', 'Significance', 'Winner', 'Scaling', 'Learning'],
        agents: ['pricing', 'attribution'],
        tools: ['metabase', 'supabase'],
      },
      {
        name: 'Renewal Pricing Strategy',
        workflow: ['Renewal Pipeline', 'Segmentation', 'Pricing Strategy', 'Discount Policy', 'Expansion Pricing', 'Notification', 'Outreach', 'Negotiation', 'Close'],
        agents: ['pricing', 'renewal'],
        tools: ['hubspot', 'metabase'],
      },
    ],
  },
  {
    id: 'L6',
    name: 'Operations & Intelligence',
    color: '#334155',
    blurb: 'The engine room: market intelligence, personas, territories, analytics, sales ops.',
    processes: [
      {
        name: 'Competitive Analysis',
        workflow: ['Competitor List', 'Info Gathering', 'Feature Comparison', 'Pricing', 'Messaging', 'Win/Loss', 'Insight Summary', 'Sharing', 'Monitoring'],
        agents: ['competitor-intel', 'market-research'],
        tools: ['exa', 'apify', 'tavily'],
      },
      {
        name: 'Market Research',
        workflow: ['Research Questions', 'Methodology', 'Primary/Secondary', 'Data Collection', 'Analysis', 'Insight Dev', 'Presentation', 'Recommendations', 'Monitoring'],
        agents: ['market-research', 'diagnostic'],
        tools: ['exa', 'tavily', 'apify'],
      },
      {
        name: 'Trend Analysis',
        workflow: ['Info Gathering', 'Trend ID', 'Impact Assessment', 'Opportunity/Threat', 'Implications', 'Recommendations', 'Strategic Planning', 'Monitoring'],
        agents: ['market-research', 'listener'],
        tools: ['exa', 'apify', 'parallel'],
      },
      {
        name: 'Persona Research & Definition',
        workflow: ['Stakeholder Interviews', 'Surveys', 'Data Collection', 'Analysis', 'Pattern ID', 'Persona Def', 'Validation', 'Refinement', 'Activation'],
        agents: ['listener', 'icp-clarifier'],
        tools: ['clay', 'metabase', 'notion'],
      },
      {
        name: 'Territory Design',
        workflow: ['Account Universe', 'Segmentation', 'Capacity Planning', 'Territory Creation', 'Quota Allocation', 'Rep Assignment', 'Baseline', 'Tracking', 'Annual Review'],
        agents: ['comp-quota', 'pipeline'],
        tools: ['hubspot', 'metabase'],
      },
      {
        name: 'Territory Forecast',
        workflow: ['Territory Assigned', 'Historical Analysis', 'Market Analysis', 'Pipeline Opportunity', 'Forecast Model', 'Scenario Planning', 'Submission', 'Tracking', 'Accuracy'],
        agents: ['forecast', 'comp-quota'],
        tools: ['metabase', 'hubspot'],
      },
      {
        name: 'Funnel Analytics',
        workflow: ['Funnel Def', 'Metrics ID', 'Data Collection', 'Conversion Rate', 'Stage Analysis', 'Bottleneck', 'Recommendations', 'Testing', 'Optimization'],
        agents: ['pipeline', 'attribution'],
        tools: ['metabase', 'ga', 'supabase'],
      },
      {
        name: 'Pipeline Analytics',
        workflow: ['Pipeline Metrics', 'Data Collection', 'Stage Duration', 'Win Rate', 'Health Assessment', 'Risk ID', 'Forecast', 'Monitoring', 'Optimization'],
        agents: ['pipeline', 'forecast'],
        tools: ['metabase', 'hubspot'],
      },
      {
        name: 'CAC & LTV Analysis',
        workflow: ['Acquisition Cost', 'LTV Calc', 'Payback Period', 'Profitability', 'By Channel/Segment', 'Recommendations', 'Testing', 'Monitoring'],
        agents: ['attribution', 'pipeline'],
        tools: ['metabase', 'supabase'],
      },
      {
        name: 'Channel Attribution',
        workflow: ['Touch Point Def', 'Attribution Model', 'Data Integration', 'Analysis', 'Channel Contribution', 'ROI by Channel', 'Recommendations', 'Budget Reallocation'],
        agents: ['attribution', 'campaign'],
        tools: ['ga', 'metabase', 'supabase'],
      },
      {
        name: 'CRM Management',
        workflow: ['CRM Selection', 'Implementation', 'Data Migration', 'Process Config', 'Workflow Automation', 'Integration', 'Training', 'Adoption', 'Data Quality'],
        agents: ['hygiene', 'pipeline'],
        tools: ['hubspot', 'attio', 'n8n'],
      },
      {
        name: 'Lead Management',
        workflow: ['Source Integration', 'Scoring Config', 'Routing Setup', 'Capture Optimization', 'Nurture', 'CRM Sync', 'Data Quality', 'Reporting'],
        agents: ['hygiene', 'qualifier'],
        tools: ['hubspot', 'n8n', 'supabase'],
      },
      {
        name: 'Sales Forecasting',
        workflow: ['Historical Analysis', 'Forecast Model', 'Rep Submission', 'Consolidation', 'Scenario Planning', 'Review', 'Approval', 'Tracking', 'Accuracy'],
        agents: ['forecast', 'pipeline'],
        tools: ['metabase', 'hubspot'],
      },
      {
        name: 'Compensation & Quota',
        workflow: ['Revenue Target', 'Rep Capacity', 'Quota Setting', 'Comp Plan', 'Commission Calc', 'Tracking', 'Review', 'Adjustment', 'Transparency'],
        agents: ['comp-quota'],
        tools: ['metabase', 'notion', 'hubspot'],
      },
      {
        name: 'Sales Tools & Stack',
        workflow: ['Needs Assessment', 'Tool Evaluation', 'Selection', 'Implementation', 'Integration', 'Training', 'Adoption', 'Monitoring', 'Optimization'],
        agents: ['hygiene'],
        tools: ['notion', 'n8n', 'slack'],
      },
    ],
  },
  {
    id: 'L7',
    name: 'Channel & Ecosystem',
    color: '#0E7490',
    blurb: 'Leveraging partners, resellers, integrations, and affiliates to scale.',
    processes: [
      {
        name: 'Partner Selection & Recruitment',
        workflow: ['Market Research', 'Partner ID', 'Fit Assessment', 'Approach', 'Relationship', 'Agreement', 'Onboarding', 'Activation', 'Performance Monitor'],
        agents: ['signals-scout', 'deal-room'],
        tools: ['exa', 'apollo', 'notion'],
      },
      {
        name: 'Partner Program Design',
        workflow: ['Program Objectives', 'Partner Model', 'Commission Structure', 'Co-Marketing', 'Incentives', 'Resources', 'Training', 'Execution', 'Performance'],
        agents: ['comp-quota', 'campaign'],
        tools: ['notion', 'metabase'],
      },
      {
        name: 'Partner Training & Enablement',
        workflow: ['Training Needs', 'Curriculum', 'Content Creation', 'Delivery', 'Execution', 'Certification', 'Reinforcement', 'Resource Updates'],
        agents: ['playbook', 'campaign'],
        tools: ['notion', 'claude'],
      },
      {
        name: 'Co-Marketing Campaign',
        workflow: ['Opportunity ID', 'Joint Planning', 'Campaign Dev', 'Execution', 'Lead Sharing', 'ROI', 'Optimization', 'Feedback', 'Renewal'],
        agents: ['campaign', 'attribution'],
        tools: ['n8n', 'hubspot', 'metabase'],
      },
      {
        name: 'Deal Registration',
        workflow: ['Partner Deal Activity', 'Registration', 'Approval', 'Territory Mgmt', 'Conflict Resolution', 'Support', 'Close', 'Commission', 'Maintenance'],
        agents: ['deal-room', 'hygiene'],
        tools: ['hubspot', 'notion'],
      },
      {
        name: 'Reseller Program',
        workflow: ['Reseller Selection', 'Agreement', 'Margin Setup', 'Portal Access', 'Product Training', 'Sales Training', 'Territory', 'Kickoff', 'Performance'],
        agents: ['onboarding', 'playbook'],
        tools: ['hubspot', 'notion'],
      },
      {
        name: 'Partner Integration',
        workflow: ['Opportunity', 'Technical Requirements', 'Dev Plan', 'Testing', 'Documentation', 'Launch', 'Promotion', 'Training', 'Education'],
        agents: ['hygiene', 'pipeline'],
        tools: ['supabase', 'n8n', 'metabase'],
      },
      {
        name: 'Referral Program Design',
        workflow: ['Objectives', 'Incentive Structure', 'Process Def', 'Platform Selection', 'Launch Prep', 'Communication', 'Execution', 'Tracking', 'Optimization'],
        agents: ['campaign', 'attribution'],
        tools: ['notion', 'metabase', 'hubspot'],
      },
      {
        name: 'Affiliate Marketing',
        workflow: ['Affiliate Activated', 'Campaign Strategy', 'Promotion', 'Traffic', 'Conversion Track', 'Commission', 'Payment', 'Reporting', 'Optimization'],
        agents: ['attribution', 'campaign'],
        tools: ['metabase', 'ga', 'hubspot'],
      },
    ],
  },
  {
    id: 'L8',
    name: 'Marketing Operations',
    color: '#B45309',
    blurb: 'Executing marketing at scale: campaigns, lead management, messaging, brand.',
    processes: [
      {
        name: 'Campaign Strategy',
        workflow: ['Business Objective', 'Audience', 'Positioning', 'Channel', 'Timeline', 'Budget', 'Content Strategy', 'Execution Plan', 'Launch', 'Tracking'],
        agents: ['campaign', 'content-multiplier'],
        tools: ['n8n', 'hubspot', 'metabase'],
      },
      {
        name: 'Multi-Channel Campaign',
        workflow: ['Objectives', 'Channel Planning', 'Message Tailoring', 'Content Creation', 'Schedule Coord', 'Launch Sync', 'Cross-Channel Track', 'Analysis', 'Optimization'],
        agents: ['campaign', 'content-multiplier'],
        tools: ['n8n', 'hubspot', 'make'],
      },
      {
        name: 'Campaign Execution',
        workflow: ['Campaign Ready', 'Resource Alignment', 'Launch', 'Real-Time Monitor', 'Issue Resolution', 'Optimization', 'Pace', 'Close-out', 'Learning'],
        agents: ['campaign', 'hygiene'],
        tools: ['n8n', 'hubspot', 'slack'],
      },
      {
        name: 'Campaign Analytics',
        workflow: ['Active', 'Metric Track', 'Daily Monitor', 'Trend Analysis', 'Conversion', 'ROI', 'Performance Report', 'Recommendations', 'Learning'],
        agents: ['attribution', 'campaign'],
        tools: ['ga', 'metabase'],
      },
      {
        name: 'Lead Scoring Model',
        workflow: ['Metric Def', 'Data Gathering', 'Model Design', 'Weight Assignment', 'Testing', 'Calibration', 'Deployment', 'Monitoring', 'Refinement'],
        agents: ['qualifier', 'hygiene'],
        tools: ['hubspot', 'supabase'],
      },
      {
        name: 'Lead Nurture Sequences',
        workflow: ['Segmentation', 'Message Dev', 'Email Design', 'Sequence Flow', 'Timing', 'Execution', 'Engagement Monitor', 'Analysis', 'Personalization'],
        agents: ['listener', 'sniper'],
        tools: ['smartlead', 'n8n', 'hubspot'],
      },
      {
        name: 'Value Proposition',
        workflow: ['Market Research', 'Competitive Analysis', 'Customer Research', 'Value Def', 'Articulation', 'Testing', 'Refinement', 'Sales Training', 'Consistency'],
        agents: ['content-multiplier', 'market-research'],
        tools: ['exa', 'claude', 'notion'],
      },
      {
        name: 'Messaging Hierarchy',
        workflow: ['Value Prop', 'Primary Messages', 'Secondary', 'Tertiary', 'Segment Tailoring', 'Alignment', 'Documentation', 'Training', 'Monitoring'],
        agents: ['content-multiplier', 'listener'],
        tools: ['claude', 'notion'],
      },
      {
        name: 'Customer Success Stories',
        workflow: ['Customer Selection', 'Interview', 'Story Dev', 'Case Study', 'Design', 'Publishing', 'Promotion', 'Sales Integration', 'ROI Docs'],
        agents: ['content-multiplier', 'listener'],
        tools: ['claude', 'notion', 'hubspot'],
      },
      {
        name: 'Brand Strategy',
        workflow: ['Market Position', 'Brand Personality', 'Visual Identity', 'Messaging Tone', 'Guidelines', 'Stakeholder Alignment', 'Implementation', 'Monitoring', 'Consistency'],
        agents: ['content-multiplier'],
        tools: ['notion', 'claude'],
      },
      {
        name: 'Industry Presence',
        workflow: ['Strategy Def', 'Target ID', 'Sponsorship', 'Speaking', 'Awards', 'Partnerships', 'Execution', 'Brand Leverage', 'ROI'],
        agents: ['campaign', 'content-multiplier'],
        tools: ['notion', 'exa'],
      },
    ],
  },
  {
    id: 'L9',
    name: 'Customer Advocacy',
    color: '#15803D',
    blurb: 'Turning customers into proof: case studies, testimonials, advocacy programs, communities.',
    processes: [
      {
        name: 'Customer Selection',
        workflow: ['Prospect Def', 'ICP', 'Outreach', 'Interest Confirm', 'Timeline', 'Agreement', 'Scheduling', 'Kickoff', 'Data Collection'],
        agents: ['listener', 'content-multiplier'],
        tools: ['hubspot', 'notion'],
      },
      {
        name: 'Case Study Development',
        workflow: ['Discovery', 'Interview Prep', 'Interview', 'Story Dev', 'ROI Calc', 'Writing', 'Design', 'Review', 'Approval', 'Publishing'],
        agents: ['content-multiplier'],
        tools: ['claude', 'notion', 'metabase'],
      },
      {
        name: 'Case Study Distribution',
        workflow: ['Published', 'Website', 'Sales Collateral', 'Marketing Integration', 'Event Use', 'Repurposing', 'Social', 'Tracking', 'Analysis'],
        agents: ['content-multiplier', 'campaign'],
        tools: ['notion', 'hubspot', 'plausible'],
      },
      {
        name: 'Reference Program',
        workflow: ['Candidate ID', 'Outreach', 'Agreement', 'Scheduling', 'Briefing', 'Call Support', 'Feedback', 'Maintenance', 'Engagement'],
        agents: ['listener', 'content-multiplier'],
        tools: ['hubspot', 'notion'],
      },
      {
        name: 'Review Management',
        workflow: ['Review Site Monitor', 'Response', 'Positive Promotion', 'Negative Mgmt', 'Incentive', 'Review Collection', 'Update Monitor', 'Trend Analysis'],
        agents: ['listener'],
        tools: ['apify', 'slack', 'notion'],
      },
      {
        name: 'Social Proof',
        workflow: ['Testimonial Opportunity', 'Collection', 'Video/Quote', 'Publishing', 'Promotion', 'Website', 'Sales Use', 'Ad Use', 'Monitoring'],
        agents: ['content-multiplier', 'listener'],
        tools: ['claude', 'notion', 'hubspot'],
      },
      {
        name: 'Advisory Board',
        workflow: ['Candidate ID', 'Outreach', 'Selection', 'Formalizing', 'Scheduling', 'Preparation', 'Facilitation', 'Feedback', 'Relationship'],
        agents: ['planning-cycle', 'listener'],
        tools: ['notion', 'slack'],
      },
      {
        name: 'User Groups',
        workflow: ['Community Interest', 'Group Launch', 'Recruitment', 'Agenda', 'Meetup Planning', 'Facilitation', 'Networking', 'Engagement', 'Growth'],
        agents: ['campaign', 'listener'],
        tools: ['notion', 'slack', 'hubspot'],
      },
      {
        name: 'Community Management',
        workflow: ['Platform Active', 'Member Onboarding', 'Content Moderation', 'Facilitation', 'Question Resolution', 'Expert ID', 'Recognition', 'Engagement', 'Growth'],
        agents: ['listener'],
        tools: ['notion', 'slack', 'supabase'],
      },
    ],
  },
]

// Helpers
export function getToolsFor(process) {
  return process.tools.map((id) => TOOL_CATALOG[id]).filter(Boolean)
}
export function getAgentsFor(process) {
  return process.agents.map((id) => AGENT_SLOTS[id]).filter(Boolean)
}
export function getTotalProcessCount() {
  return LAYERS.reduce((sum, l) => sum + l.processes.length, 0)
}