import fetch from 'node-fetch';
// Fix: Import Buffer to ensure it is available and avoid TS errors
import { Buffer } from 'buffer';

const BASE = process.env.SH_BASE_URL!;
const INSTANCE = process.env.SH_INSTANCE_ID!;
const CLIENT_ID = process.env.SH_CLIENT_ID!;
const CLIENT_SECRET = process.env.SH_CLIENT_SECRET!;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.token;
  const url = `${BASE}/oauth/token`;
  const body = new URLSearchParams();
  body.append('grant_type', 'client_credentials');
  body.append('client_id', CLIENT_ID);
  body.append('client_secret', CLIENT_SECRET);
  const res = await fetch(url, { method: 'POST', body });
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
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timeout: 60000
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Processing API error ${res.status}: ${text}`);
  }
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
}

export default { getWmsUrl, runProcessingEvalscript };