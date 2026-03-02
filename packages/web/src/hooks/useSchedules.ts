import { useState, useEffect } from 'react';
import { schedules } from '../lib/api';

interface Schedule {
  id: string;
  projectId: string | null;
  name: string;
  cronExpr: string;
  timezone: string;
  agentId: string;
  message: string;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
}

export function useSchedules(projectId?: string) {
  const [data, setData] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await schedules.list(projectId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [projectId]);

  const toggleSchedule = async (id: string) => {
    const updated = await schedules.toggle(id);
    setData(data.map(s => s.id === id ? updated : s));
    return updated;
  };

  const runSchedule = async (id: string) => {
    const result = await schedules.run(id);
    setData(data.map(s => s.id === id ? result.schedule : s));
    return result;
  };

  const deleteSchedule = async (id: string) => {
    await schedules.delete(id);
    setData(data.filter(s => s.id !== id));
  };

  return {
    schedules: data,
    loading,
    error,
    refetch: fetchSchedules,
    toggleSchedule,
    runSchedule,
    deleteSchedule,
  };
}
