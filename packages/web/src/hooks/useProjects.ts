import { useState, useEffect } from 'react';
import { projects } from '../lib/api';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  tags: string;
  workingDir: string;
  outputDir: string | null;
  defaultAgent: string | null;
  gitRepo: string | null;
  cadence: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
}

export function useProjects() {
  const [data, setData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await projects.list();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async (projectData: any) => {
    const newProject = await projects.create(projectData);
    setData([newProject, ...data]);
    return newProject;
  };

  const updateProject = async (id: string, projectData: any) => {
    const updated = await projects.update(id, projectData);
    setData(data.map(p => p.id === id ? updated : p));
    return updated;
  };

  const deleteProject = async (id: string) => {
    await projects.delete(id);
    setData(data.filter(p => p.id !== id));
  };

  return {
    projects: data,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}
