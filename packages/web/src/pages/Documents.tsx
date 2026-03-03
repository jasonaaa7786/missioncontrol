import { useEffect, useState } from 'react';
import * as api from '../lib/api';
import type { Project } from '@mc/shared';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    // Filter files based on search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredFiles(
        files.filter(file => file.name.toLowerCase().includes(query))
      );
    } else {
      setFilteredFiles(files);
    }
  }, [searchQuery, files]);

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
      setSearchQuery(''); // Reset search when changing directories
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
      // For non-previewable files, just select them (download available)
      setSelectedFile(file);
      setFileContent('');
    }
  };

  const handleDirectDownload = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent file click
    api.files.download(file.path, file.name);
  };

  const handleGoUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    browseDirectory(parentPath);
    setSelectedFile(null);
    setFileContent('');
  };

  const handleDownload = (file: FileItem) => {
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

          {/* Search */}
          <div className="mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400"
            />
          </div>

          {loading && !selectedFile && (
            <p className="text-gray-400 text-sm">Loading...</p>
          )}

          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {filteredFiles.map((file, idx) => (
              <div
                key={idx}
                className={`group flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-700 ${
                  selectedFile?.path === file.path ? 'bg-gray-700' : ''
                }`}
              >
                <button
                  onClick={() => handleFileClick(file)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  <span className="text-gray-400 flex-shrink-0">
                    {file.type === 'directory' ? '📁' : '📄'}
                  </span>
                  <span className="text-white text-sm truncate flex-1">
                    {file.name}
                  </span>
                  {file.type === 'file' && (
                    <span className="text-gray-500 text-xs flex-shrink-0">
                      {formatFileSize(file.size)}
                    </span>
                  )}
                </button>
                {file.type === 'file' && (
                  <button
                    onClick={(e) => handleDirectDownload(file, e)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Download file"
                  >
                    ⬇️
                  </button>
                )}
              </div>
            ))}
          </div>

          {filteredFiles.length === 0 && !loading && (
            <p className="text-gray-500 text-sm text-center py-8">
              {searchQuery ? 'No files match your search' : 'No files found'}
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
              ) : fileContent ? (
                <div className="bg-gray-900 rounded p-4 overflow-auto max-h-[600px]">
                  {selectedFile.name.endsWith('.md') ? (
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                        h1: ({ children }) => <h1 className="text-3xl font-bold text-white mt-6 mb-4">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-2xl font-bold text-white mt-5 mb-3">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xl font-bold text-white mt-4 mb-2">{children}</h3>,
                        p: ({ children }) => <p className="text-gray-300 mb-3">{children}</p>,
                        a: ({ href, children }) => (
                          <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                            {children}
                          </a>
                        ),
                        code: ({ inline, children, className }: any) =>
                          inline ? (
                            <code className="bg-gray-800 px-1.5 py-0.5 rounded text-blue-300 text-sm">
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-gray-950 p-4 rounded my-3 overflow-x-auto">
                              <code className={`text-sm text-gray-300 ${className}`}>{children}</code>
                            </pre>
                          ),
                        ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-3">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-3">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-400 my-3">
                            {children}
                          </blockquote>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-4">
                            <table className="min-w-full border border-gray-700">{children}</table>
                          </div>
                        ),
                        thead: ({ children }) => <thead className="bg-gray-800">{children}</thead>,
                        th: ({ children }) => (
                          <th className="border border-gray-700 px-4 py-2 text-left text-white font-semibold">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-gray-700 px-4 py-2 text-gray-300">{children}</td>
                        ),
                      }}
                      >
                        {fileContent}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {fileContent}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="bg-gray-900 rounded p-8 text-center">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-gray-400 mb-4">
                    Preview not available for this file type
                  </p>
                  <p className="text-gray-500 text-sm mb-6">
                    {selectedFile.name.split('.').pop()?.toUpperCase()} file ({formatFileSize(selectedFile.size)})
                  </p>
                  <button
                    onClick={() => api.files.download(selectedFile.path, selectedFile.name)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Download File
                  </button>
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
