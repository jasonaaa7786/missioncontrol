export default function Scheduler() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Scheduler</h1>
          <p className="text-gray-400 mt-2">Manage cron jobs and scheduled tasks</p>
        </div>
        <button className="px-4 py-2 bg-mission-600 hover:bg-mission-700 text-white rounded-lg font-medium transition-colors">
          + New Schedule
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
        <p className="text-gray-400">No scheduled jobs yet.</p>
      </div>
    </div>
  );
}
