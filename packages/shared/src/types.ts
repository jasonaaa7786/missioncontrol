import { z } from 'zod';

// Core domain types

export const ProjectStatus = z.enum(['active', 'paused', 'archived']);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

export const TaskStatus = z.enum(['backlog', 'planned', 'in_progress', 'blocked', 'done']);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TaskPriority = z.enum(['low', 'medium', 'high', 'critical']);
export type TaskPriority = z.infer<typeof TaskPriority>;

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  tags: string[];
  workingDir: string;
  outputDir: string | null;
  defaultAgent: string | null;
  gitRepo: string | null;
  cadence: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgent: string | null;
  position: number;
  dueAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  workspace: string;
  agentDir: string | null;
  model: string | null;
  isActive: boolean;
  imageUrl: string | null;
}

export interface Schedule {
  id: string;
  projectId: string | null;
  name: string;
  cronExpr: string;
  timezone: string;
  agentId: string;
  message: string;
  enabled: boolean;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface FileItem {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size: number | null;
  modifiedAt: Date;
}

// API Request/Response types

export interface CreateProjectRequest {
  name: string;
  description?: string;
  tags?: string[];
  workingDir: string;
  outputDir?: string;
  defaultAgent?: string;
  gitRepo?: string;
  cadence?: string;
  imageUrl?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  tags?: string[];
  workingDir?: string;
  outputDir?: string;
  defaultAgent?: string;
  gitRepo?: string;
  cadence?: string;
  imageUrl?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedAgent?: string;
  dueAt?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedAgent?: string;
  position?: number;
  dueAt?: string;
}

export interface CreateScheduleRequest {
  name: string;
  cronExpr: string;
  timezone?: string;
  agentId: string;
  message: string;
  projectId?: string;
}

export interface UpdateScheduleRequest {
  name?: string;
  cronExpr?: string;
  timezone?: string;
  agentId?: string;
  message?: string;
  enabled?: boolean;
}

export interface ChatRequest {
  message: string;
  projectId?: string;
  sessionId?: string;
}

// WebSocket event types

export type WSEvent =
  | { type: 'task:created'; task: Task }
  | { type: 'task:updated'; task: Task }
  | { type: 'task:deleted'; taskId: string }
  | { type: 'schedule:triggered'; scheduleId: string }
  | { type: 'chat:message'; message: ChatMessage }
  | { type: 'agent:status'; agentId: string; status: 'idle' | 'busy' };

export interface WSMessage {
  event: string;
  data: unknown;
}
