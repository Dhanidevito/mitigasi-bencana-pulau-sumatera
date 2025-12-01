// Simple server to serve the Sumatra GIS Sentinel application
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Handle API endpoints
  if (req.url.startsWith('/api/')) {
    handleApiRequest(req, res);
    return;
  }

  // Handle static files
  let filePath = req.url === '/' ? '/index.html' : req.url;
  
  // Resolve the file path
  filePath = path.join(process.cwd(), filePath);
  
  // Get the file extension
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch (extname) {
    case '.js':
      contentType = 'application/javascript';
      break;
    case '.ts':
      contentType = 'application/javascript';
      break;
    case '.tsx':
      contentType = 'application/javascript';
      break;
    case '.jsx':
      contentType = 'application/javascript';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
    case '.ico':
      contentType = 'image/x-icon';
      break;
  }
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Handle API requests
function handleApiRequest(req, res) {
  if (req.url === '/api/disasters/aggregate') {
    // Return mock disaster data
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      count: 12,
      timestamp: new Date().toISOString(),
      data: [
        {
          id: '1',
          type: 'FIRE',
          latitude: -0.84,
          longitude: 100.33,
          locationName: 'Padang, West Sumatra',
          description: 'Forest fire detected in mountainous area',
          severity: 'High',
          riskScore: 85,
          timestamp: Date.now() - 3600000, // 1 hour ago
          confidence: 0.92
        },
        {
          id: '2',
          type: 'FLOOD',
          latitude: 3.19,
          longitude: 98.85,
          locationName: 'Medan, North Sumatra',
          description: 'Heavy rainfall causing river overflow',
          severity: 'Medium',
          riskScore: 65,
          timestamp: Date.now() - 7200000, // 2 hours ago
          confidence: 0.78
        },
        {
          id: '3',
          type: 'LANDSLIDE',
          latitude: -5.41,
          longitude: 105.27,
          locationName: 'Lampung',
          description: 'Risk of landslides after heavy rain',
          severity: 'High',
          riskScore: 78,
          timestamp: Date.now() - 10800000, // 3 hours ago
          confidence: 0.85
        },
        {
          id: '4',
          type: 'VOLCANO',
          latitude: -2.94,
          longitude: 101.65,
          locationName: 'Mount Kerinci, Jambi',
          description: 'Increased volcanic activity detected',
          severity: 'Critical',
          riskScore: 92,
          timestamp: Date.now() - 14400000, // 4 hours ago
          confidence: 0.95
        },
        {
          id: '5',
          type: 'EARTHQUAKE',
          latitude: 0.47,
          longitude: 96.76,
          locationName: 'Aceh',
          description: 'Seismic activity above normal levels',
          severity: 'High',
          riskScore: 82,
          timestamp: Date.now() - 18000000, // 5 hours ago
          confidence: 0.88
        },
        {
          id: '6',
          type: 'WAVE',
          latitude: -5.79,
          longitude: 106.10,
          locationName: 'Bengkulu Coast',
          description: 'High wave alert for coastal areas',
          severity: 'Medium',
          riskScore: 60,
          timestamp: Date.now() - 21600000, // 6 hours ago
          confidence: 0.72
        },
        {
          id: '7',
          type: 'FIRE',
          latitude: 2.35,
          longitude: 99.30,
          locationName: 'Riau',
          description: 'Peat fire detected in industrial area',
          severity: 'High',
          riskScore: 75,
          timestamp: Date.now() - 25200000, // 7 hours ago
          confidence: 0.83
        },
        {
          id: '8',
          type: 'FLOOD',
          latitude: -1.60,
          longitude: 103.61,
          locationName: 'Jambi City',
          description: 'Urban flooding due to blocked drainage',
          severity: 'Medium',
          riskScore: 68,
          timestamp: Date.now() - 28800000, // 8 hours ago
          confidence: 0.75
        },
        {
          id: '9',
          type: 'LANDSLIDE',
          latitude: -3.32,
          longitude: 104.72,
          locationName: 'South Sumatra Mountains',
          description: 'Slope instability after prolonged rain',
          severity: 'High',
          riskScore: 80,
          timestamp: Date.now() - 32400000, // 9 hours ago
          confidence: 0.87
        },
        {
          id: '10',
          type: 'VOLCANO',
          latitude: -0.35,
          longitude: 100.42,
          locationName: 'Mount Marapi',
          description: 'Minor volcanic tremors recorded',
          severity: 'Medium',
          riskScore: 65,
          timestamp: Date.now() - 36000000, // 10 hours ago
          confidence: 0.70
        },
        {
          id: '11',
          type: 'EARTHQUAKE',
          latitude: 3.75,
          longitude: 96.25,
          locationName: 'Northern Aceh',
          description: 'Tectonic activity detected',
          severity: 'Medium',
          riskScore: 62,
          timestamp: Date.now() - 39600000, // 11 hours ago
          confidence: 0.74
        },
        {
          id: '12',
          type: 'WAVE',
          latitude: -0.95,
          longitude: 100.40,
          locationName: 'West Sumatra Coast',
          description: 'Rough sea conditions forecast',
          severity: 'Medium',
          riskScore: 58,
          timestamp: Date.now() - 43200000, // 12 hours ago
          confidence: 0.68
        }
      ]
    }));
    return;
  }

  if (req.url === '/api/satellite/latest') {
    // Return mock satellite data
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      wmsUrl: 'https://mock-sentinel-data.com/mock-image.png',
      imageTimestamp: Date.now()
    }));
    return;
  }

  // For any other API endpoint, return 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'API endpoint not found' }));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sumatra GIS Sentinel server running on http://localhost:${PORT}`);
  console.log('Ready to serve the application!');
});