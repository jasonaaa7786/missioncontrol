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

  update: (id: string, data: { name?: string; imageUrl?: string }) =>
    fetchAPI<any>(`/api/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  dispatch: (id: string, command: string, timeout?: number) =>
    fetchAPI<{ dispatched: boolean; dispatchId: string; agentId: string }>(`/api/agents/${id}/dispatch`, {
      method: 'POST',
      body: JSON.stringify({ command, timeout }),
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
      imageUrl?: string;
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
      imageUrl?: string;
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
  
  updateOpenclaw: () => fetchAPI<{
    success: boolean;
    currentVersion: string;
    newVersion: string;
    message?: string;
    error?: string;
    output?: string;
  }>('/api/system/update-openclaw', {
    method: 'POST',
  }),
  
  restartGateway: () => fetchAPI<{
    success: boolean;
    message: string;
  }>('/api/system/restart-gateway', {
    method: 'POST',
  }),

  costs: () => fetchAPI<{
    today: number;
    sevenDay: number;
    thirtyDay: number;
    allTime: number;
    projected: number;
    totalTokens: number;
    byModel: { model: string; tokens: number; cost: number; calls: number }[];
    byAgent: { agent: string; tokens: number; cost: number; calls: number }[];
    dailyTrend: { date: string; cost: number; tokens: number }[];
  }>('/api/system/costs'),

  alerts: () => fetchAPI<Array<{
    type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    agentId?: string;
    timestamp: string;
  }>>('/api/system/alerts'),
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

// YouTube API
export const youtube = {
  getChannel: (channelId: string) =>
    fetchAPI<{
      channelId: string;
      title: string;
      description: string;
      customUrl?: string;
      publishedAt: string;
      thumbnails: any;
      country?: string;
      statistics: {
        subscriberCount: number;
        viewCount: number;
        videoCount: number;
      };
    }>(`/api/youtube/channel/${channelId}`),
  
  search: (query: string, maxResults: number = 5) =>
    fetchAPI<{
      channels: Array<{
        channelId: string;
        title: string;
        description: string;
        thumbnails: any;
      }>;
    }>('/api/youtube/search', {
      params: { q: query, maxResults: maxResults.toString() },
    }),
};

// Artist Research API
export const artist = {
  search: (artistName: string) =>
    fetchAPI<{
      artist: {
        spotifyId?: string; name: string; imageUrl: string | null;
        followers: number | null; popularity: number | null; genres: string[]; externalUrl?: string;
      };
      youtubeChannel: {
        channelId: string; title: string; thumbnails: any;
        subscribers: number; views: string;
      } | null;
      socialSnapshot: Record<string, any> | null;
      previousSnapshot: Record<string, any> | null;
    }>('/api/artist/search', {
      method: 'POST',
      body: JSON.stringify({ artistName }),
    }),

  getCommunities: (name: string) =>
    fetchAPI<{
      communities: Array<{
        name: string; handle: string | null; followers: number | null;
        url: string | null; platform: string; country: string | null;
      }>;
      total: number;
      error?: string;
    }>(`/api/artist/${encodeURIComponent(name)}/communities`),

  getShows: (name: string) =>
    fetchAPI<{
      shows: Array<{
        id: string; eventDate: string | null; venueName: string | null;
        venueCity: string | null; venueCountry: string | null;
        showType: string | null; capacity: number | null;
        source: string | null; sourceUrl: string | null;
      }>;
      source: string;
      message?: string;
    }>(`/api/artist/${encodeURIComponent(name)}/shows`),

  updateShowCapacity: (name: string, showId: string, capacity: number) =>
    fetchAPI<any>(
      `/api/artist/${encodeURIComponent(name)}/shows/${showId}`,
      { method: 'PATCH', body: JSON.stringify({ capacity }) }
    ),

  getAgency: (name: string) =>
    fetchAPI<{
      agency: string | null; confidence: string;
      sourceUrl: string | null; snippets?: Array<{ title: string; url: string }>;
      error?: string;
    }>(`/api/artist/${encodeURIComponent(name)}/agency`),
};

// Spotify API
export const spotify = {
  search: (q: string, limit = 5) =>
    fetchAPI<{
      artists: Array<{
        spotifyId: string; name: string; imageUrl: string | null;
        followers: number; popularity: number; genres: string[]; externalUrl: string | null;
      }>;
    }>('/api/spotify/search', { params: { q, limit: limit.toString() } }),
};

// Tasks V2 API
export const tasksV2 = {
  list: (filters?: { projectId?: string; status?: string; assignedAgent?: string }) =>
    fetchAPI<any[]>('/api/tasks-v2', { params: filters as any }),
  
  get: (id: string) => fetchAPI<any>(`/api/tasks-v2/${id}`),
  
  create: (data: {
    projectId: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignedAgent?: string;
    tags?: string[];
    dueAt?: string;
  }) => fetchAPI<any>('/api/tasks-v2', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: any) => fetchAPI<any>(`/api/tasks-v2/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  updateStatus: (id: string, status: string) => fetchAPI<any>(`/api/tasks-v2/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  
  delete: (id: string) => fetchAPI<void>(`/api/tasks-v2/${id}`, {
    method: 'DELETE',
  }),
  
  addComment: (id: string, data: { content: string; agentId?: string; mentions?: string[] }) =>
    fetchAPI<any>(`/api/tasks-v2/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getComments: (id: string) => fetchAPI<any[]>(`/api/tasks-v2/${id}/comments`),
};

// Activity API
export const activity = {
  feed: (filters?: { type?: string; agentId?: string; taskId?: string; projectId?: string; limit?: number }) =>
    fetchAPI<any[]>('/api/activity/feed', { params: filters as any }),
  
  log: (data: {
    type: string;
    agentId?: string;
    taskId?: string;
    projectId?: string;
    message: string;
    metadata?: any;
  }) => fetchAPI<any>('/api/activity/log', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  stats: () => fetchAPI<{ total: number; today: number; byType: Record<string, number> }>('/api/activity/stats'),
};

// Search API
export const search = {
  query: (q: string, type: string = 'all', limit: number = 20) =>
    fetchAPI<{
      query: string;
      type: string;
      totalResults: number;
      projects: any[];
      tasks: any[];
      agents: any[];
    }>('/api/search', {
      params: { q, type, limit: limit.toString() },
    }),
};
