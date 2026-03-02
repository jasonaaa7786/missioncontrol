export default function Settings() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-2">Configure Mission Control</p>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4">OpenClaw Integration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Config Path</label>
            <input
              type="text"
              value="~/.openclaw/openclaw.json"
              readOnly
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Gateway Port</label>
            <input
              type="text"
              value="18789"
              readOnly
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
