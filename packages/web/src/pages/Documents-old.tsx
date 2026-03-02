import { useEffect, useState } from 'react';
import * as api from '../lib/api';
import type { Project } from '@mc/shared';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: string;
}

export default function Documents() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      const project = projects.find(p => p.id === selectedProject);
      if (project?.outputDir) {
        browseDirectory(project.outputDir);
      }
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const data = await api.projects.list();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    }
  };

  const browseDirectory = async (path: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await api.files.browse(path);
      setFiles(data || []);
      setCurrentPath(path);
    } catch (err: any) {
      setError(err.message || 'Failed to browse directory');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (file: FileItem) => {
    if (file.type === 'directory') {
      browseDirectory(file.path);
      setSelectedFile(null);
      setFileContent('');
    } else if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      try {
        setLoading(true);
        setError('');
        const data = await api.files.read(file.path);
        setSelectedFile(file);
        setFileContent(data.content);
      } catch (err: any) {
        setError(err.message || 'Failed to read file');
      } finally {
        setLoading(false);
      }
    } else {
      alert('Only .md and .txt files can be previewed');
    }
  };

  const handleGoUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    browseDirectory(parentPath);
    setSelectedFile(null);
    setFileContent('');
  };

  const handleDownload = (file: FileItem) => {
    // Create download link
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  // Simple markdown renderer (basic support)
  const renderMarkdown = (content: string) => {
    let html = content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-white mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mt-8 mb-4">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-white">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/gim, '<pre class="bg-gray-900 p-3 rounded my-2 overflow-x-auto"><code class="text-sm text-gray-300">$1</code></pre>')
      // Inline code
      .replace(/`(.*?)`/gim, '<code class="bg-gray-700 px-1 py-0.5 rounded text-sm text-blue-300">$1</code>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" class="text-blue-400 hover:underline" target="_blank">$1</a>')
      // Line breaks
      .replace(/\n/gim, '<br/>');

    return html;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Documents</h1>
        <p className="text-gray-400 mt-2">Browse and preview project outputs</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded text-red-400">
          {error}
        </div>
      )}

      {/* Project Selector */}
      <div className="mb-6">
        <label className="block text-gray-300 mb-2">Select Project</label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        >
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name} {project.outputDir ? `(${project.outputDir})` : '(no output dir)'}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* File Browser */}
        <div className="col-span-1 bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Files</h2>
            {currentPath && (
              <button
                onClick={handleGoUp}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                ↑ Up
              </button>
            )}
          </div>
          
          <div className="text-xs text-gray-500 mb-3 truncate" title={currentPath}>
            {currentPath || '/'}
          </div>

          {loading && !selectedFile && (
            <p className="text-gray-400 text-sm">Loading...</p>
          )}

          <div className="space-y-1">
            {files.map((file, idx) => (
              <button
                key={idx}
                onClick={() => handleFileClick(file)}
                className={`w-full text-left px-3 py-2 rounded hover:bg-gray-700 flex items-center gap-2 ${
                  selectedFile?.path === file.path ? 'bg-gray-700' : ''
                }`}
              >
                <span className="text-gray-400">
                  {file.type === 'directory' ? '📁' : '📄'}
                </span>
                <span className="text-white text-sm truncate flex-1">
                  {file.name}
                </span>
                {file.type === 'file' && (
                  <span className="text-gray-500 text-xs">
                    {formatFileSize(file.size)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {files.length === 0 && !loading && (
            <p className="text-gray-500 text-sm text-center py-8">
              No files found
            </p>
          )}
        </div>

        {/* File Preview */}
        <div className="col-span-2 bg-gray-800 rounded-lg border border-gray-700 p-6">
          {selectedFile ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedFile.name}</h2>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatFileSize(selectedFile.size)} • {formatDate(selectedFile.modifiedAt)}
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(selectedFile)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Download
                </button>
              </div>

              {loading ? (
                <p className="text-gray-400">Loading file...</p>
              ) : (
                <div className="bg-gray-900 rounded p-4 overflow-auto max-h-[600px]">
                  {selectedFile.name.endsWith('.md') ? (
                    <div 
                      className="prose prose-invert max-w-none text-gray-300"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(fileContent) }}
                    />
                  ) : (
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {fileContent}
                    </pre>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Select a file to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
