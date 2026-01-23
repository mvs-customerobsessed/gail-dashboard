/**
 * Metabase API Service
 * Handles all communication with Metabase REST API
 * Uses Vite proxy in development, Supabase Edge Functions in production
 */

import { supabase } from '../lib/supabase';

const METABASE_URL = import.meta.env.VITE_METABASE_URL;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// In development, use Vite proxy; in production, use Supabase Edge Function
const USE_PROXY = import.meta.env.DEV;

/**
 * Make an authenticated request to the Metabase API
 */
async function metabaseRequest(endpoint, options = {}) {
  if (USE_PROXY) {
    // Development: use Vite proxy (handles auth)
    const url = `/metabase-api${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Metabase API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  } else {
    // Production: use Supabase Edge Function
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/metabase-proxy?endpoint=${encodeURIComponent(endpoint)}`;

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
      throw new Error(`Metabase API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }
}

/**
 * Get list of all saved questions (cards)
 */
export async function getQuestions() {
  return metabaseRequest('/card');
}

/**
 * Get a specific question by ID
 */
export async function getQuestion(questionId) {
  return metabaseRequest(`/card/${questionId}`);
}

/**
 * Execute a saved question and get results
 */
export async function runQuestion(questionId, parameters = {}) {
  return metabaseRequest(`/card/${questionId}/query`, {
    method: 'POST',
    body: JSON.stringify({ parameters }),
  });
}

/**
 * Get list of all dashboards
 */
export async function getDashboards() {
  return metabaseRequest('/dashboard');
}

/**
 * Get a specific dashboard by ID (includes all cards)
 */
export async function getDashboard(dashboardId) {
  return metabaseRequest(`/dashboard/${dashboardId}`);
}

/**
 * Execute a native SQL query
 */
export async function runNativeQuery(databaseId, query, parameters = []) {
  return metabaseRequest('/dataset', {
    method: 'POST',
    body: JSON.stringify({
      database: databaseId,
      native: {
        query,
        'template-tags': parameters,
      },
      type: 'native',
    }),
  });
}

/**
 * Get list of available databases
 */
export async function getDatabases() {
  return metabaseRequest('/database');
}

/**
 * Get tables for a specific database
 */
export async function getTables(databaseId) {
  return metabaseRequest(`/database/${databaseId}/metadata`);
}

/**
 * Transform Metabase query results into chart-friendly format
 */
export function transformResultsForChart(results) {
  if (!results?.data?.rows || !results?.data?.cols) {
    return [];
  }

  const { rows, cols } = results.data;

  return rows.map(row => {
    const obj = {};
    cols.forEach((col, index) => {
      obj[col.name] = row[index];
    });
    return obj;
  });
}

/**
 * Check if Metabase connection is configured
 */
export function isConfigured() {
  // In dev mode, proxy handles auth
  // In production, we need Supabase URL for Edge Functions
  return import.meta.env.DEV || Boolean(SUPABASE_URL);
}

/**
 * Test connection to Metabase
 */
export async function testConnection() {
  try {
    await metabaseRequest('/user/current');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
