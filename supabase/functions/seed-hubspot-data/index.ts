import { corsResponse, successResponse, errorResponse } from '../_shared/utils.ts'
import { hubspotRequest } from '../_shared/hubspot.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const results = {
      companies: [],
      contacts: [],
      deals: [],
    }

    // Create 10 companies
    const companyData = [
      { name: 'Acme SaaS Inc', industry: 'Software', employees: 150, revenue: 15000000, domain: 'acmesaas.com' },
      { name: 'TechFlow Solutions', industry: 'Technology', employees: 80, revenue: 8000000, domain: 'techflow.io' },
      { name: 'DataSync Corp', industry: 'Data & Analytics', employees: 200, revenue: 25000000, domain: 'datasync.com' },
      { name: 'CloudNine Systems', industry: 'Cloud Infrastructure', employees: 120, revenue: 18000000, domain: 'cloudnine.io' },
      { name: 'SecurityFirst Inc', industry: 'Cybersecurity', employees: 90, revenue: 12000000, domain: 'securityfirst.com' },
      { name: 'MarketPro Analytics', industry: 'Marketing Technology', employees: 60, revenue: 6000000, domain: 'marketpro.ai' },
      { name: 'SalesBoost Platform', industry: 'Sales Enablement', employees: 70, revenue: 9000000, domain: 'salesboost.com' },
      { name: 'FinOps Technologies', industry: 'Financial Services', employees: 110, revenue: 14000000, domain: 'finopstech.com' },
      { name: 'DevTools Inc', industry: 'Developer Tools', employees: 45, revenue: 5000000, domain: 'devtools.dev' },
      { name: 'AutoScale Systems', industry: 'DevOps', employees: 85, revenue: 10000000, domain: 'autoscale.io' },
    ]

    for (const company of companyData) {
      const created = await hubspotRequest('/crm/v3/objects/companies', {
        method: 'POST',
        body: {
          properties: {
            name: company.name,
            industry: company.industry,
            numberofemployees: company.employees,
            annualrevenue: company.revenue,
            domain: company.domain,
          }
        }
      })
      results.companies.push({ id: created.id, name: company.name })
    }

    // Create 2 contacts per company (20 total)
    const titles = ['VP Sales', 'Director of Marketing', 'Head of RevOps', 'CEO', 'CFO', 'CRO']
    for (let i = 0; i < results.companies.length; i++) {
      const company = results.companies[i]
      
      for (let j = 0; j < 2; j++) {
        const firstName = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Lisa'][Math.floor(Math.random() * 6)]
        const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller'][Math.floor(Math.random() * 6)]
        const title = titles[Math.floor(Math.random() * titles.length)]
        
        const contact = await hubspotRequest('/crm/v3/objects/contacts', {
          method: 'POST',
          body: {
            properties: {
              firstname: firstName,
              lastname: lastName,
              email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyData[i].domain}`,
              jobtitle: title,
            },
            associations: [{
              to: { id: company.id },
              types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 280 }]
            }]
          }
        })
        results.contacts.push({ id: contact.id, name: `${firstName} ${lastName}`, company: company.name })
      }
    }

    // Create 15 deals (mix of stages)
    const dealStages = [
      { stage: 'appointmentscheduled', amount: 45000 },
      { stage: 'qualifiedtobuy', amount: 65000 },
      { stage: 'presentationscheduled', amount: 85000 },
      { stage: 'decisionmakerboughtin', amount: 95000 },
      { stage: 'contractsent', amount: 120000 },
      { stage: 'closedwon', amount: 75000 },
      { stage: 'closedwon', amount: 55000 },
      { stage: 'closedwon', amount: 95000 },
      { stage: 'closedwon', amount: 125000 },
      { stage: 'closedwon', amount: 85000 },
      { stage: 'appointmentscheduled', amount: 35000 },
      { stage: 'qualifiedtobuy', amount: 48000 },
      { stage: 'presentationscheduled', amount: 72000 },
      { stage: 'contractsent', amount: 110000 },
      { stage: 'closedlost', amount: 60000 },
    ]

    for (let i = 0; i < dealStages.length; i++) {
      const company = results.companies[i % results.companies.length]
      const dealData = dealStages[i]
      
      // Calculate close date (closed deals in past, open deals in future)
      let closeDate
      if (dealData.stage === 'closedwon') {
        const daysAgo = Math.floor(Math.random() * 180) + 30 // 30-210 days ago
        closeDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).getTime()
      } else if (dealData.stage === 'closedlost') {
        const daysAgo = Math.floor(Math.random() * 90) + 10
        closeDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).getTime()
      } else {
        const daysFromNow = Math.floor(Math.random() * 60) + 10 // 10-70 days from now
        closeDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).getTime()
      }

      const deal = await hubspotRequest('/crm/v3/objects/deals', {
        method: 'POST',
        body: {
          properties: {
            dealname: `${company.name} - ${dealData.stage.replace(/([A-Z])/g, ' $1').trim()}`,
            dealstage: dealData.stage,
            amount: dealData.amount,
            closedate: closeDate,
            pipeline: 'default',
          },
          associations: [{
            to: { id: company.id },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 5 }]
          }]
        }
      })
      results.deals.push({ 
        id: deal.id, 
        name: deal.properties.dealname,
        stage: dealData.stage,
        amount: dealData.amount 
      })
    }

    return successResponse({
      message: 'Test data created successfully',
      summary: {
        companies_created: results.companies.length,
        contacts_created: results.contacts.length,
        deals_created: results.deals.length,
      },
      details: results,
    })

  } catch (err) {
    console.error('Seed data error:', err)
    return errorResponse(err.message)
  }
})
