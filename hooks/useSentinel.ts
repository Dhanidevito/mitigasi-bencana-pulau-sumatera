import { useEffect, useState } from 'react';

export function useSentinel(wsUrl: string) {
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<'connected'|'disconnected'|'loading'>('loading');
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => setStatus('connected');
      ws.onmessage = e => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'sat-update') {
          setData(msg.data);
          setLastUpdated(msg.data.imageTimestamp || Date.now());
        } else if (msg.type === 'status') {
          setLastUpdated(msg.lastData?.imageTimestamp || null);
        }
      };
      ws.onclose = () => setStatus('disconnected');
      ws.onerror = () => setStatus('disconnected');
    } catch {
      setStatus('disconnected');
    }

    let pollTimer: any = null;
    if (!ws) {
      const poll = async () => {
        try {
          const res = await fetch('/api/satellite/latest');
          if (res.ok) {
            const json = await res.json();
            setData(json);
            setLastUpdated(json.imageTimestamp);
            setStatus('connected');
          } else setStatus('disconnected');
        } catch { setStatus('disconnected'); }
      };
      poll();
      pollTimer = setInterval(poll, 60_000);
    }

    return () => {
      if (ws) ws.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [wsUrl]);

  return { data, status, lastUpdated };
}

export default useSentinel;