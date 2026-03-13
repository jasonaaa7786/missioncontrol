import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import type { Task, Agent } from '@mc/shared';

interface TaskCardProps {
  task: Task;
  agent?: Agent;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, agent, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priorityColors: Record<string, string> = {
    low: 'text-cyber-text-dim',
    medium: 'text-cyber-yellow',
    normal: 'text-cyber-cyan',
    high: 'text-cyber-yellow',
    urgent: 'text-cyber-red',
    critical: 'text-cyber-red',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cyber-card rounded p-3 border border-cyber-border hover:border-cyber-cyan/50 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'shadow-lg shadow-cyber-cyan/20 ring-1 ring-cyber-cyan/30' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-cyber-text-primary font-medium text-sm flex-1">{task.title}</h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="text-cyber-text-dim hover:text-cyber-red text-xs ml-2 transition-colors"
        >
          ×
        </button>
      </div>
      {task.description && (
        <p className="text-cyber-text-secondary text-xs mb-2 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between text-xs">
        <span className={`font-mono ${priorityColors[task.priority] || 'text-cyber-text-dim'}`}>
          {task.priority.toUpperCase()}
        </span>
        {agent && (
          <span className="text-cyber-text-dim font-mono">{agent.name || agent.id}</span>
        )}
      </div>
    </div>
  );
}

interface DroppableColumnProps {
  id: string;
  label: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

export function DroppableColumn({ id, label, color, count, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`cyber-card rounded-lg border transition-all ${
        isOver
          ? 'border-cyber-cyan ring-2 ring-cyber-cyan/30 bg-cyber-cyan/5'
          : 'border-cyber-border'
      }`}
    >
      <div className={`${color} px-4 py-3 rounded-t-lg border-b border-cyber-border`}>
        <h3 className="font-heading font-bold text-cyber-text-primary text-sm uppercase tracking-wide">
          {label} <span className="text-cyber-text-dim font-mono">({count})</span>
        </h3>
      </div>
      <div className="p-3 min-h-[200px] space-y-2">
        {children}
      </div>
    </div>
  );
}
