export default function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-2">Mission overview and system status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Active Projects" value="0" icon="📁" color="blue" />
        <StatCard title="In Progress Tasks" value="0" icon="⚡" color="yellow" />
        <StatCard title="Active Agents" value="0" icon="🤖" color="green" />
        <StatCard title="Scheduled Jobs" value="0" icon="⏰" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-gray-400">No recent activity</p>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-3">
            <StatusRow label="Backend" status="online" />
            <StatusRow label="Database" status="online" />
            <StatusRow label="WebSocket" status="online" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    yellow: 'from-yellow-500 to-yellow-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-lg p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <span className="text-4xl opacity-75">{icon}</span>
      </div>
    </div>
  );
}

function StatusRow({ label, status }: { label: string; status: 'online' | 'offline' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-400 capitalize">{status}</span>
      </div>
    </div>
  );
}
