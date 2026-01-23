/**
 * HubSpot API Service
 * Handles all communication with HubSpot CRM REST API
 * Uses Vite proxy in development, Supabase Edge Functions in production
 */

import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// In development, use Vite proxy; in production, use Supabase Edge Function
const USE_PROXY = import.meta.env.DEV;

/**
 * Make an authenticated request to the HubSpot API
 */
async function hubspotRequest(endpoint, options = {}) {
  if (USE_PROXY) {
    // Development: use Vite proxy (handles auth)
    const url = `/hubspot-api${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  } else {
    // Production: use Supabase Edge Function
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/hubspot-proxy?endpoint=${encodeURIComponent(endpoint)}`;

    const response = await fetch(edgeFunctionUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }
}

/**
 * Check if HubSpot connection is configured
 */
export function isConfigured() {
  // In dev mode, proxy handles auth
  // In production, we need Supabase URL for Edge Functions
  return import.meta.env.DEV || Boolean(SUPABASE_URL);
}

/**
 * Test connection to HubSpot
 */
export async function testConnection() {
  try {
    await hubspotRequest('/crm/v3/objects/contacts?limit=1');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get deal pipelines and stages
 */
export async function getPipelines() {
  return hubspotRequest('/crm/v3/pipelines/deals');
}

/**
 * Get deals with properties (sorted by most recently modified using Search API)
 */
export async function getDeals(limit = 100) {
  const properties = [
    'dealname',
    'amount',
    'dealstage',
    'pipeline',
    'closedate',
    'createdate',
    'hubspot_owner_id',
    'hs_lastmodifieddate',
  ];

  return hubspotRequest('/crm/v3/objects/deals/search', {
    method: 'POST',
    body: JSON.stringify({
      limit,
      properties,
      sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'DESCENDING' }],
    }),
  });
}

/**
 * Get contacts with properties (sorted by most recently modified using Search API)
 */
export async function getContacts(limit = 100) {
  const properties = [
    'firstname',
    'lastname',
    'email',
    'company',
    'phone',
    'createdate',
    'lastmodifieddate',
    'hubspot_owner_id',
  ];

  return hubspotRequest('/crm/v3/objects/contacts/search', {
    method: 'POST',
    body: JSON.stringify({
      limit,
      properties,
      sorts: [{ propertyName: 'lastmodifieddate', direction: 'DESCENDING' }],
    }),
  });
}

/**
 * Get companies with properties (sorted by most recently modified using Search API)
 */
export async function getCompanies(limit = 100) {
  const properties = [
    'name',
    'domain',
    'industry',
    'numberofemployees',
    'annualrevenue',
    'createdate',
    'hs_lastmodifieddate',
  ];

  return hubspotRequest('/crm/v3/objects/companies/search', {
    method: 'POST',
    body: JSON.stringify({
      limit,
      properties,
      sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'DESCENDING' }],
    }),
  });
}

/**
 * Get recent calls (sorted by most recent using Search API)
 */
export async function getCalls(limit = 50) {
  const properties = [
    'hs_call_title',
    'hs_call_body',
    'hs_call_duration',
    'hs_call_direction',
    'hs_call_status',
    'hs_timestamp',
    'hubspot_owner_id',
  ];

  return hubspotRequest('/crm/v3/objects/calls/search', {
    method: 'POST',
    body: JSON.stringify({
      limit,
      properties,
      sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
    }),
  });
}

/**
 * Get recent emails (sorted by most recent using Search API)
 */
export async function getEmails(limit = 50) {
  const properties = [
    'hs_email_subject',
    'hs_email_direction',
    'hs_email_status',
    'hs_timestamp',
    'hubspot_owner_id',
  ];

  return hubspotRequest('/crm/v3/objects/emails/search', {
    method: 'POST',
    body: JSON.stringify({
      limit,
      properties,
      sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
    }),
  });
}

/**
 * Get recent meetings (sorted by most recent using Search API)
 */
export async function getMeetings(limit = 50) {
  const properties = [
    'hs_meeting_title',
    'hs_meeting_body',
    'hs_meeting_start_time',
    'hs_meeting_end_time',
    'hs_meeting_outcome',
    'hubspot_owner_id',
  ];

  return hubspotRequest('/crm/v3/objects/meetings/search', {
    method: 'POST',
    body: JSON.stringify({
      limit,
      properties,
      sorts: [{ propertyName: 'hs_meeting_start_time', direction: 'DESCENDING' }],
    }),
  });
}

/**
 * Get tasks (sorted by most recent using Search API)
 */
export async function getTasks(limit = 50) {
  const properties = [
    'hs_task_subject',
    'hs_task_body',
    'hs_task_status',
    'hs_task_priority',
    'hs_timestamp',
    'hubspot_owner_id',
  ];

  return hubspotRequest('/crm/v3/objects/tasks/search', {
    method: 'POST',
    body: JSON.stringify({
      limit,
      properties,
      sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
    }),
  });
}

/**
 * Get all activities combined (calls, emails, meetings, tasks)
 */
export async function getActivities(limit = 20) {
  try {
    const [calls, emails, meetings, tasks] = await Promise.all([
      getCalls(limit).catch(() => ({ results: [] })),
      getEmails(limit).catch(() => ({ results: [] })),
      getMeetings(limit).catch(() => ({ results: [] })),
      getTasks(limit).catch(() => ({ results: [] })),
    ]);

    // Combine and sort by timestamp
    const activities = [
      ...calls.results.map(c => ({ ...c, type: 'call' })),
      ...emails.results.map(e => ({ ...e, type: 'email' })),
      ...meetings.results.map(m => ({ ...m, type: 'meeting' })),
      ...tasks.results.map(t => ({ ...t, type: 'task' })),
    ].sort((a, b) => {
      const dateA = new Date(a.properties.hs_timestamp || a.properties.hs_meeting_start_time || a.createdAt);
      const dateB = new Date(b.properties.hs_timestamp || b.properties.hs_meeting_start_time || b.createdAt);
      return dateB - dateA;
    });

    return activities.slice(0, limit);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

/**
 * Aggregate deals by pipeline stage
 * Returns enhanced data structure with metadata for filtering
 */
export async function getDealsByStage() {
  try {
    const [pipelinesData, dealsData] = await Promise.all([
      getPipelines(),
      getDeals(200),
    ]);

    const pipelines = pipelinesData.results || [];
    const deals = dealsData.results || [];

    // Build stage lookup from all pipelines
    const stageLookup = {};
    const stageOrder = {};
    let orderIndex = 0;

    pipelines.forEach(pipeline => {
      (pipeline.stages || []).forEach(stage => {
        stageLookup[stage.id] = {
          id: stage.id,
          label: stage.label,
          pipelineId: pipeline.id,
          pipelineName: pipeline.label,
        };
        stageOrder[stage.id] = orderIndex++;
      });
    });

    // Aggregate deals by stage
    const stageAggregation = {};

    deals.forEach(deal => {
      const stageId = deal.properties.dealstage;
      const amount = parseFloat(deal.properties.amount) || 0;

      if (!stageAggregation[stageId]) {
        stageAggregation[stageId] = {
          stageId,
          stageName: stageLookup[stageId]?.label || stageId,
          pipelineName: stageLookup[stageId]?.pipelineName || 'Unknown',
          dealCount: 0,
          totalValue: 0,
          order: stageOrder[stageId] || 999,
        };
      }

      stageAggregation[stageId].dealCount += 1;
      stageAggregation[stageId].totalValue += amount;
    });

    // Convert to array and sort by stage order
    const stages = Object.values(stageAggregation).sort((a, b) => a.order - b.order);

    // Return enhanced data structure for filtering
    return {
      stages,
      pipelines: pipelines.map(p => ({ id: p.id, label: p.label })),
      allStages: Object.values(stageLookup),
      stageLookup,
      stageOrder,
      deals,
    };
  } catch (error) {
    console.error('Error aggregating deals by stage:', error);
    return {
      stages: [],
      pipelines: [],
      allStages: [],
      stageLookup: {},
      stageOrder: {},
      deals: [],
    };
  }
}

/**
 * Get summary statistics
 */
export async function getSummaryStats() {
  try {
    // Fetch deals, contacts, and companies in parallel
    const [dealsData, contactsData, companiesData] = await Promise.all([
      getDeals(200),
      getContacts(1),
      getCompanies(1),
    ]);

    // Search API returns results array
    const deals = dealsData.results || [];

    // Calculate total pipeline value from all deals
    let totalPipelineValue = 0;
    for (const deal of deals) {
      const amountStr = deal.properties?.amount;
      if (amountStr) {
        const amount = parseFloat(amountStr);
        if (!isNaN(amount)) {
          totalPipelineValue += amount;
        }
      }
    }

    // Count deals created this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let dealsThisMonth = 0;
    for (const deal of deals) {
      const createDateStr = deal.properties?.createdate;
      if (createDateStr) {
        const created = new Date(createDateStr);
        if (created >= startOfMonth) {
          dealsThisMonth++;
        }
      }
    }

    return {
      totalDeals: dealsData.total || deals.length,
      totalPipelineValue,
      dealsThisMonth,
      totalContacts: contactsData.total || 0,
      totalCompanies: companiesData.total || 0,
    };
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    return {
      totalDeals: 0,
      totalPipelineValue: 0,
      dealsThisMonth: 0,
      totalContacts: 0,
      totalCompanies: 0,
    };
  }
}
