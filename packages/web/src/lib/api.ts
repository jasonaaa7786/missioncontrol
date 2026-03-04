// API client with authentication

// Use relative URLs (proxied by Vite in dev, or same origin in production)
const API_BASE = import.meta.env.VITE_API_BASE || '';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;
  
  // Build URL with query params
  let url: URL;
  if (API_BASE) {
    url = new URL(endpoint, API_BASE);
  } else {
    // For relative URLs (proxied through Vite), use current origin as base
    url = new URL(endpoint, window.location.origin);
  }
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(fetchOptions.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Set Content-Type for JSON requests
  if (fetchOptions.body && typeof fetchOptions.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(url.toString(), {
      ...fetchOptions,
      headers,
    });
  } catch (err) {
    // Network error (can't reach server)
    throw new APIError(0, 'Cannot connect to server. Please check if backend is running.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new APIError(response.status, error.error || 'Request failed');
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Auth API
export const auth = {
  login: (username: string, password: string) =>
    fetchAPI<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, password: string, name?: string) =>
    fetchAPI<{ user: any; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, name }),
    }),

  me: () => fetchAPI<any>('/api/auth/me'),

  users: () => fetchAPI<any[]>('/api/auth/users'),
};

// Projects API
export const projects = {
  list: () => fetchAPI<any[]>('/api/projects'),
  
  get: (id: string) => fetchAPI<any>(`/api/projects/${id}`),
  
  create: (data: any) =>
    fetchAPI<any>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: any) =>
    fetchAPI<any>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchAPI<void>(`/api/projects/${id}`, {
      method: 'DELETE',
    }),
  
  stats: (id: string) => fetchAPI<Record<string, number>>(`/api/projects/${id}/stats`),
};

// Tasks API
export const tasks = {
  listByProject: (projectId: string) =>
    fetchAPI<any[]>(`/api/tasks/project/${projectId}`),
  
  get: (id: string) => fetchAPI<any>(`/api/tasks/${id}`),
  
  create: (projectId: string, data: any) =>
    fetchAPI<any>(`/api/tasks/project/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: any) =>
    fetchAPI<any>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchAPI<void>(`/api/tasks/${id}`, {
      method: 'DELETE',
    }),
  
  reorder: (taskId: string, newStatus: string, newPosition: number) =>
    fetchAPI<{ success: boolean }>('/api/tasks/reorder', {
      method: 'POST',
      body: JSON.stringify({ taskId, newStatus, newPosition }),
    }),
};

// Agents API
export const agents = {
  list: () => fetchAPI<any[]>('/api/agents'),
  
  get: (id: string) => fetchAPI<any>(`/api/agents/${id}`),
  
  sync: () => fetchAPI<{ synced: number; agents: any[] }>('/api/agents/sync', {
    method: 'POST',
  }),
  
  toggle: (id: string) =>
    fetchAPI<any>(`/api/agents/${id}/toggle`, {
      method: 'PATCH',
    }),

  // Subagent management
  subagents: {
    list: () => fetchAPI<any[]>('/api/agents/subagents'),
    
    create: (data: {
      name: string;
      description?: string;
      skills?: string[];
      soulContent?: string;
      projectIds?: string[];
    }) =>
      fetchAPI<any>('/api/agents/subagents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: {
      name?: string;
      description?: string;
      skills?: string[];
      soulContent?: string;
      projectIds?: string[];
    }) =>
      fetchAPI<any>(`/api/agents/subagents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) =>
      fetchAPI<{ success: boolean }>(`/api/agents/subagents/${id}`, {
        method: 'DELETE',
      }),
  },
};

// Schedules API
export const schedules = {
  list: (projectId?: string) =>
    fetchAPI<any[]>('/api/schedules', {
      params: projectId ? { projectId } : undefined,
    }),
  
  get: (id: string) => fetchAPI<any>(`/api/schedules/${id}`),
  
  create: (data: any) =>
    fetchAPI<any>('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: any) =>
    fetchAPI<any>(`/api/schedules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchAPI<void>(`/api/schedules/${id}`, {
      method: 'DELETE',
    }),
  
  toggle: (id: string) =>
    fetchAPI<any>(`/api/schedules/${id}/toggle`, {
      method: 'POST',
    }),
  
  run: (id: string) =>
    fetchAPI<{ success: boolean; schedule: any }>(`/api/schedules/${id}/run`, {
      method: 'POST',
    }),
};

// Files API
export const files = {
  browse: (path: string) =>
    fetchAPI<any[]>('/api/files/browse', {
      params: { path },
    }),
  
  read: (path: string) =>
    fetchAPI<{ content: string }>('/api/files/read', {
      method: 'POST',
      body: JSON.stringify({ path }),
    }),
  
  download: (path: string, fileName: string) => {
    // Direct browser download (not via fetchAPI)
    const url = `${API_BASE}/api/files/download?path=${encodeURIComponent(path)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
  
  index: (projectId: string) =>
    fetchAPI<{ success: boolean; message?: string }>(`/api/files/index/${projectId}`, {
      method: 'POST',
    }),
};

// System API
export const system = {
  getInfo: () => fetchAPI<any>('/api/system/info'),
  
  checkUpdates: () => fetchAPI<any>('/api/system/check-updates', {
    method: 'POST',
  }),
  
  verifySyncPassword: (password: string) => fetchAPI<{ valid: boolean }>('/api/system/verify-sync-password', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
};

// Uploads API
export const uploads = {
  uploadProjectImage: async (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/api/uploads/project-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    return response.json();
  },
  
  uploadAgentImage: async (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/api/uploads/agent-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    return response.json();
  },
};

// Chat API
export const chat = {
  createSession: (projectId?: string) =>
    fetchAPI<{ id: string; sessionId: string }>('/api/chat/session', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    }),
  
  history: (sessionId: string) =>
    fetchAPI<{ messages: any[] }>(`/api/chat/session/${sessionId}`),
  
  sendMessage: (sessionId: string, message: string) =>
    fetchAPI<{ sessionId: string; response: string }>('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message }),
    }),
  
  deleteSession: (sessionId: string) =>
    fetchAPI<void>(`/api/chat/session/${sessionId}`, {
      method: 'DELETE',
    }),
};
