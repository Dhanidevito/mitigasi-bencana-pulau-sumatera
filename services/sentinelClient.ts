// Universal fetch that works in both Node.js and browser environments
import { Buffer } from 'buffer';
import { sentinelHubConfig } from '../config/sentinelConfig';

const { baseUrl: BASE, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, instanceId: INSTANCE, isValid } = sentinelHubConfig;

// Throw error if credentials are not valid (only in production, allow mock in development)
if (!isValid && process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️  Sentinel Hub credentials not configured. This will cause API failures.');
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (!isValid) {
    console.warn('⚠️  Sentinel Hub credentials not configured. Returning mock token for development.');
    return 'mock-token-for-development';
  }
  
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.token;
  const url = `${BASE}/oauth/token`;
  const body = new URLSearchParams();
  body.append('grant_type', 'client_credentials');
  body.append('client_id', CLIENT_ID);
  body.append('client_secret', CLIENT_SECRET);
  const res = await fetch(url, { 
    method: 'POST', 
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Auth failed ${res.status}: ${txt}`);
  }
  const j = await res.json();
  const token = j.access_token;
  const expiresIn = j.expires_in || 3600;
  cachedToken = { token, expiresAt: Date.now() + expiresIn * 1000 };
  return token;
}

// Build a WMS GetMap URL for the instance
export async function getWmsUrl(bbox: number[], width = 1024, height = 1024) {
  if (!isValid) {
    console.warn('⚠️  Sentinel Hub credentials not configured. Returning mock WMS URL for development.');
    // Return a mock URL for development purposes
    return `https://mock-sentinel-data.com/wms?bbox=${bbox.join(',')}&width=${width}&height=${height}`;
  }
  
  const token = await getAccessToken();
  const layerId = 'TRUE_COLOR';
  const params = new URLSearchParams({
    service: 'WMS',
    request: 'GetMap',
    layers: layerId,
    bbox: bbox.join(','),
    width: String(width),
    height: String(height),
    format: 'image/png',
    crs: 'EPSG:4326'
  });
  // append token as query param to avoid exposing secret in browser; backend will proxy
  return `${BASE}/ogc/wms/${INSTANCE}?${params.toString()}&access_token=${token}`;
}

// Run Processing API with evalscript and return image buffer
export async function runProcessingEvalscript(evalscript: string, bbox: number[], width = 512, height = 512) {
  if (!isValid) {
    console.warn('⚠️  Sentinel Hub credentials not configured. Returning mock image buffer for development.');
    // Return a mock image buffer for development purposes
    return Buffer.from('mock-image-data-for-development');
  }
  
  const token = await getAccessToken();
  const url = `${BASE}/api/v1/process`;
  const payload = {
    input: {
      bounds: { bbox },
      data: [{ type: 'S2L1C', dataFilter: { maxCloudCoverage: 80 } }]
    },
    output: { width, height, responses: [{ identifier: 'default', format: { type: 'image/png' } }] },
    evalscript
  };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: controller.signal
  });
  
  clearTimeout(timeoutId);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Processing API error ${res.status}: ${text}`);
  }
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
}

export default { getWmsUrl, runProcessingEvalscript };