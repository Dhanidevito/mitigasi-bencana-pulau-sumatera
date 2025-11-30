import express, { RequestHandler } from 'express';
import http from 'http';
import { Server as WebSocketServer } from 'ws';
import path from 'path';
import { getWmsUrl } from '../services/sentinelClient';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let lastData: { wmsUrl?: string; imageTimestamp?: number } | null = null;

// Example bbox for Sumatera area; adjust to your monitoring area
const DEFAULT_BBOX = [95.0, -6.5, 106.0, 6.0]; // [minLon, minLat, maxLon, maxLat]

async function pollLoop() {
  const interval = Number(process.env.SAT_POLL_INTERVAL_MS) || 60000;
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
  } finally {
    setTimeout(pollLoop, interval);
  }
}

app.use(express.json() as RequestHandler);

// Proxy endpoint for frontend fallback polling
app.get('/api/satellite/latest', (req, res) => {
  if (!lastData) return res.status(503).json({ message: 'No data yet' });
  res.json(lastData);
});

// Serve static if needed (optional)
app.use('/static', express.static(path.join(__dirname, '..', 'public')) as RequestHandler);

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'status', connected: true, lastData }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
  pollLoop();
});