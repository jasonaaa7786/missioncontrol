import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '../contexts/AuthContext';
import NewProjectModal from '../components/NewProjectModal';

export default function Projects() {
  const { projects, loading, error, createProject, deleteProject } = useProjects();
  const { isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async (data: any) => {
    await createProject(data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    setDeletingId(id);
    try {
      await deleteProject(id);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 mt-2">Manage all your OpenClaw projects</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-mission-600 hover:bg-mission-700 text-white rounded-lg font-medium transition-colors"
          >
            + New Project
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mission-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading projects...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400">No projects yet. Create your first project to get started.</p>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const tags = JSON.parse(project.tags || '[]');
            
            return (
              <div
                key={project.id}
                className="bg-gray-800 rounded-lg border border-gray-700 hover:border-mission-500 transition-colors overflow-hidden"
              >
                {/* Project Image */}
                {project.imageUrl ? (
                  <div className="h-32 overflow-hidden">
                    <img
                      src={`http://140.82.57.157:3001${project.imageUrl}`}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-mission-900 to-gray-900 flex items-center justify-center">
                    <span className="text-5xl opacity-50">📁</span>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-xl font-semibold text-white hover:text-mission-400 transition-colors"
                      >
                        {project.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                        <span className="text-xs text-gray-400 capitalize">{project.status}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(project.id)}
                        disabled={deletingId === project.id}
                        className="text-red-400 hover:text-red-300 disabled:opacity-50"
                        title="Delete project"
                      >
                        {deletingId === project.id ? '...' : '🗑️'}
                      </button>
                    )}
                  </div>

                  {project.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <span>📁</span>
                      <span className="truncate">{project.workingDir}</span>
                    </div>
                    {project._count && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <span>📋</span>
                        <span>{project._count.tasks} tasks</span>
                      </div>
                    )}
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-mission-600/20 text-mission-400 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NewProjectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
