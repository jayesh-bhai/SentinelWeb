import { useEffect, useState, useRef } from 'react';
import { apiClient } from '../api/client';

/**
 * Hook that fetches behavior data for a given sessionId.
 * By default it polls every 5 s (configurable).
 */
export function useBehaviorData(sessionId, pollIntervalMs = 5000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const fetch = async () => {
    if (!sessionId) return;
    try {
      // Use the pre-configured apiClient to ensure correct baseURL and headers
      const res = await apiClient.get(`/behaviors/${sessionId}`);
      setData(res.data.data);
      setError(null);
    } catch (e) {
      console.error("Behavior fetch error:", e);
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setData(null);
    setLoading(true);
    fetch(); // initial load
    
    timerRef.current = setInterval(fetch, pollIntervalMs);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId, pollIntervalMs]);

  return { data, loading, error };
}
