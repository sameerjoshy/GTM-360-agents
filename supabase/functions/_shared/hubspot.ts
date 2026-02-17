// HubSpot API helpers for GTM-360 agents

export async function hubspotRequest(endpoint, options = {}) {
  const HUBSPOT_KEY = Deno.env.get('HUBSPOT_API_KEY')
  if (!HUBSPOT_KEY) throw new Error('HUBSPOT_API_KEY not set in vault')

  const baseUrl = 'https://api.hubapi.com'
  const url = `${baseUrl}${endpoint}`
  
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...(options.body && { body: JSON.stringify(options.body) }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`HubSpot API error (${res.status}): ${error}`)
  }

  return res.json()
}

// Get all closed-won deals with company data
export async function getClosedWonDeals(lookbackMonths = 12) {
  const lookbackDate = new Date()
  lookbackDate.setMonth(lookbackDate.getMonth() - lookbackMonths)
  const timestamp = lookbackDate.getTime()

  const endpoint = `/crm/v3/objects/deals/search`
  const body = {
    filterGroups: [{
      filters: [
        { propertyName: 'dealstage', operator: 'EQ', value: 'closedwon' },
        { propertyName: 'closedate', operator: 'GTE', value: timestamp.toString() },
      ]
    }],
    properties: ['dealname', 'amount', 'closedate', 'dealstage', 'hs_deal_stage_probability', 'createdate'],
    associations: ['company'],
    limit: 100,
  }

  const result = await hubspotRequest(endpoint, { method: 'POST', body })
  
  // Fetch associated company data for each deal
  const dealsWithCompanies = await Promise.all(
    result.results.map(async (deal) => {
      if (deal.associations?.companies?.results?.[0]) {
        const companyId = deal.associations.companies.results[0].id
        const company = await hubspotRequest(`/crm/v3/objects/companies/${companyId}?properties=name,industry,numberofemployees,annualrevenue,domain`)
        return { ...deal, company: company.properties }
      }
      return deal
    })
  )

  return dealsWithCompanies
}

// Get deal details with all notes, emails, and contacts
export async function getDealDetails(dealId) {
  const deal = await hubspotRequest(`/crm/v3/objects/deals/${dealId}?properties=dealname,amount,dealstage,closedate,notes_last_contacted,notes_last_updated,hs_lastmodifieddate&associations=contacts,notes,emails`)
  
  // Fetch associated contacts
  const contacts = []
  if (deal.associations?.contacts?.results) {
    for (const c of deal.associations.contacts.results) {
      const contact = await hubspotRequest(`/crm/v3/objects/contacts/${c.id}?properties=firstname,lastname,email,jobtitle,hs_lead_status`)
      contacts.push(contact.properties)
    }
  }

  // Fetch notes (last 10)
  const notes = []
  if (deal.associations?.notes?.results) {
    for (const n of deal.associations.notes.results.slice(0, 10)) {
      const note = await hubspotRequest(`/crm/v3/objects/notes/${n.id}?properties=hs_note_body,hs_timestamp`)
      notes.push(note.properties)
    }
  }

  return {
    deal: deal.properties,
    contacts,
    notes,
  }
}

// Get all deals in pipeline (for hygiene/forecast)
export async function getPipelineDeals(stageFilter = null) {
  const endpoint = `/crm/v3/objects/deals/search`
  const filters = [
    { propertyName: 'dealstage', operator: 'NEQ', value: 'closedwon' },
    { propertyName: 'dealstage', operator: 'NEQ', value: 'closedlost' },
  ]
  
  if (stageFilter) {
    filters.push({ propertyName: 'dealstage', operator: 'EQ', value: stageFilter })
  }

  const body = {
    filterGroups: [{ filters }],
    properties: ['dealname', 'amount', 'dealstage', 'closedate', 'hs_lastmodifieddate', 'notes_last_contacted', 'createdate'],
    associations: ['contacts'],
    limit: 100,
  }

  const result = await hubspotRequest(endpoint, { method: 'POST', body })
  return result.results
}

// Update deal properties (used for approved hygiene fixes)
export async function updateDeal(dealId, properties) {
  const endpoint = `/crm/v3/objects/deals/${dealId}`
  const body = { properties }
  return hubspotRequest(endpoint, { method: 'PATCH', body })
}
