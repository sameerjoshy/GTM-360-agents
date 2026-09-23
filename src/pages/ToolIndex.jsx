import { TOOL_CATALOG } from '../data/framework'

const groups = {
  'Research & Signals': ['tavily', 'exa', 'apify', 'apify-signals', 'parallel'],
  'List Building & Data': ['ai-ark', 'apollo', 'prospeo', 'google-maps', 'linkedin'],
  'Enrichment': ['bitscale', 'clay'],
  'Personalization & Copy': ['claude', 'deepseek', 'gpt'],
  'Sending': ['smartlead', 'instantly', 'lemlist'],
  'Automation': ['n8n', 'zapier', 'make'],
  'CRM & Pipeline': ['hubspot', 'attio'],
  'Analytics & Forecasting': ['metabase', 'ga', 'plausible'],
  'Communication & Knowledge': ['slack', 'notion', 'supabase'],
}

export function ToolIndex() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-6 md:px-10 pt-8 pb-6 border-b border-slate-200 bg-white">
        <div className="max-w-5xl">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-500 mb-2">GTM-360 · Tool Index</p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
            The stack we use — and the alternates.
          </h1>
          <p className="text-slate-600 max-w-2xl leading-relaxed">
            One rule: <span className="font-semibold text-slate-800">don't automate bad GTM — automate a good
            GTM process.</span> These are the tools behind each part of the engine. Every one has
            alternates, because the tool matters less than the process it's serving.
          </p>
        </div>
      </div>

      <div className="px-6 md:px-10 py-8">
        <div className="max-w-5xl space-y-6">
          {Object.entries(groups).map(([group, ids]) => (
            <div key={group} className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">{group}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ids.map((id) => {
                  const t = TOOL_CATALOG[id]
                  if (!t) return null
                  return (
                    <div key={id} className="border border-slate-100 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{t.fn}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        <span className="font-semibold text-slate-600">Alternates:</span>{' '}
                        {t.alt?.length ? t.alt.join(' · ') : '—'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}