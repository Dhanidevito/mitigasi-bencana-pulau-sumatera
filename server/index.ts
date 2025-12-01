import express, { RequestHandler } from 'express';
import http from 'http';
import { Server as WebSocketServer } from 'ws';
import path from 'path';
import { getWmsUrl, runProcessingEvalscript } from '../services/sentinelClient';
import { getAggregatedData } from './aggregator';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let lastData: { wmsUrl?: string; imageTimestamp?: number } | null = null;
const DEFAULT_BBOX = [95.0, -6.5, 106.0, 6.0];

async function pollLoop() {
  const interval = Number(process.env.SAT_POLL_INTERVAL_MS) || 60000;
  
  // Check if required environment variables are set
  if (!process.env.SH_BASE_URL || !process.env.SH_INSTANCE_ID || 
      !process.env.SH_CLIENT_ID || !process.env.SH_CLIENT_SECRET) {
    console.warn('⚠️  Sentinel Hub credentials not configured. Using mock data.');
    console.warn('   Please set SH_BASE_URL, SH_INSTANCE_ID, SH_CLIENT_ID, and SH_CLIENT_SECRET in .env file');
    
    // Create mock data for development
    lastData = { 
      wmsUrl: 'https://mock-sentinel-data.com/mock-image.png', 
      imageTimestamp: Date.now() 
    };
    
    const payload = JSON.stringify({ type: 'sat-update', data: lastData });
    wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(payload);
    });
    
    setTimeout(pollLoop, interval);
    return;
  }
  
  try {
    const bbox = DEFAULT_BBOX;
    const wmsUrl = await getWmsUrl(bbox, 1024, 1024);
    lastData = { wmsUrl, imageTimestamp: Date.now() };
    const payload = JSON.stringify({ type: 'sat-update', data: lastData });
    wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(payload);
    });
    console.log('Polled Sentinel Hub at', new Date().toISOString());
  } catch (err) {
    console.error('Polling error:', err instanceof Error ? err.message : err);
    console.warn('⚠️  Using fallback data due to Sentinel Hub error.');
    
    // Provide fallback mock data when API fails
    lastData = { 
      wmsUrl: 'https://mock-sentinel-data.com/fallback-image.png', 
      imageTimestamp: Date.now() 
    };
    
    const payload = JSON.stringify({ type: 'sat-update', data: lastData });
    wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(payload);
    });
  } finally {
    setTimeout(pollLoop, interval);
  }
}

app.use(express.json() as RequestHandler);

// --- API ENDPOINTS ---

// 1. Sentinel Visuals
app.get('/api/satellite/latest', (req, res) => {
  if (!lastData) return res.status(503).json({ message: 'No data yet' });
  res.json(lastData);
});

// 2. MAIN AGGREGATOR ENDPOINT
// Returns combined data from BMKG, LAPAN/NASA, Sentinel, USGS
app.get('/api/disasters/aggregate', async (req, res) => {
  try {
    const data = await getAggregatedData();
    res.json({
      success: true,
      count: data.length,
      timestamp: new Date().toISOString(),
      data: data
    });
  } catch (err: any) {
    console.error('Aggregator failed:', err.message);
    res.status(500).json({ error: 'Failed to aggregate disaster data' });
  }
});

app.use('/static', express.static(path.resolve('public')) as RequestHandler);

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'status', connected: true, lastData }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
  pollLoop();
});
