import { useState, useEffect } from 'react';
import { agents } from '../lib/api';

interface Agent {
  id: string;
  name: string;
  workspace: string;
  agentDir: string | null;
  model: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useAgents() {
  const [data, setData] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await agents.list();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const syncAgents = async () => {
    const result = await agents.sync();
    setData(result.agents);
    return result;
  };

  const toggleAgent = async (id: string) => {
    const updated = await agents.toggle(id);
    setData(data.map(a => a.id === id ? updated : a));
    return updated;
  };

  return {
    agents: data,
    loading,
    error,
    refetch: fetchAgents,
    syncAgents,
    toggleAgent,
  };
}
