import { useParams } from 'react-router-dom';

export default function ProjectDetail() {
  const { id } = useParams();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Project Detail</h1>
        <p className="text-gray-400 mt-2">Project ID: {id}</p>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
        <p className="text-gray-400">Project detail view - implementation pending</p>
      </div>
    </div>
  );
}
