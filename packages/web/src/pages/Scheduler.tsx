import { useState } from 'react';
import { useSchedules } from '../hooks/useSchedules';
import { useAuth } from '../contexts/AuthContext';

export default function Scheduler() {
  const { schedules, loading, error, toggleSchedule, runSchedule, deleteSchedule } = useSchedules();
  const { isAdmin } = useAuth();
  const [actioningId, setActioningId] = useState<string | null>(null);

  const handleToggle = async (id: string) => {
    setActioningId(id);
    try {
      await toggleSchedule(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle schedule');
    } finally {
      setActioningId(null);
    }
  };

  const handleRun = async (id: string) => {
    setActioningId(id);
    try {
      await runSchedule(id);
      alert('Schedule executed successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to run schedule');
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    setActioningId(id);
    try {
      await deleteSchedule(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete schedule');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Scheduler</h1>
          <p className="text-gray-400 mt-2">Manage cron jobs and scheduled tasks</p>
        </div>
        {isAdmin && (
          <button className="px-4 py-2 bg-mission-600 hover:bg-mission-700 text-white rounded-lg font-medium transition-colors">
            + New Schedule
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mission-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading schedules...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && schedules.length === 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400">No scheduled jobs yet.</p>
        </div>
      )}

      {!loading && !error && schedules.length > 0 && (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-gray-800 rounded-lg border border-gray-700 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{schedule.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${
                      schedule.enabled
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {schedule.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Cron Expression</p>
                      <p className="text-sm text-gray-300 font-mono">{schedule.cronExpr}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Timezone</p>
                      <p className="text-sm text-gray-300">{schedule.timezone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Agent</p>
                      <p className="text-sm text-gray-300">{schedule.agentId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Last Run</p>
                      <p className="text-sm text-gray-300">
                        {schedule.lastRunAt
                          ? new Date(schedule.lastRunAt).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  {schedule.project && (
                    <div className="mt-3">
                      <span className="text-xs text-gray-500">Project: </span>
                      <span className="text-sm text-mission-400">{schedule.project.name}</span>
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-gray-900 rounded text-sm text-gray-300 font-mono">
                    {schedule.message.length > 100
                      ? schedule.message.substring(0, 100) + '...'
                      : schedule.message}
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleRun(schedule.id)}
                      disabled={actioningId === schedule.id}
                      className="px-3 py-1 bg-mission-600 hover:bg-mission-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                      title="Run now"
                    >
                      ▶️ Run
                    </button>
                    <button
                      onClick={() => handleToggle(schedule.id)}
                      disabled={actioningId === schedule.id}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                    >
                      {schedule.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      disabled={actioningId === schedule.id}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
