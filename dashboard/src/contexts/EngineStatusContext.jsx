import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { apiClient } from '../api/client';

const EngineStatusContext = createContext(null);

function deriveStatus(healthData, runtimeData) {
  if (!healthData) {
    return {
      collectorOnline: false,
      backendActive: false,
      statusLabel: 'Engine Offline',
      detailLabel: 'Start engine for active scanning',
      tone: 'offline'
    };
  }

  const lastReceived = healthData.stats?.backendAgents?.lastReceived || runtimeData?.latest?.last_reported_at || runtimeData?.last_reported_at || null;
  const lastReceivedMs = lastReceived ? new Date(lastReceived).getTime() : 0;
  const backendActive = lastReceivedMs > 0 && Date.now() - lastReceivedMs < 90000;

  if (!backendActive) {
    return {
      collectorOnline: true,
      backendActive: false,
      statusLabel: 'Engine Idle',
      detailLabel: 'Waiting for backend telemetry',
      tone: 'idle'
    };
  }

  return {
    collectorOnline: true,
    backendActive: true,
    statusLabel: 'Engine Online',
    detailLabel: 'Active scanning...',
    tone: 'online'
  };
}

export function EngineStatusProvider({ children }) {
  const [health, setHealth] = useState(null);
  const [runtime, setRuntime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const [healthRes, runtimeRes] = await Promise.allSettled([
          axios.get('http://localhost:5000/health', { timeout: 5000 }),
          apiClient.get('/runtime/backend')
        ]);

        if (cancelled) return;

        if (healthRes.status === 'fulfilled') {
          setHealth(healthRes.value.data);
        } else {
          setHealth(null);
        }

        if (runtimeRes.status === 'fulfilled') {
          setRuntime(runtimeRes.value.data.data);
        } else {
          setRuntime(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const engine = useMemo(() => deriveStatus(health, runtime), [health, runtime]);

  return (
    <EngineStatusContext.Provider value={{ health, runtime, engine, loading }}>
      {children}
    </EngineStatusContext.Provider>
  );
}

export function useEngineStatus() {
  const context = useContext(EngineStatusContext);
  if (!context) {
    throw new Error('useEngineStatus must be used within an EngineStatusProvider');
  }
  return context;
}
