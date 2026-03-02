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
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    low: 'text-gray-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-700 rounded p-3 border border-gray-600 hover:border-gray-500 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-white font-medium text-sm flex-1">{task.title}</h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="text-gray-400 hover:text-red-400 text-xs ml-2"
        >
          ×
        </button>
      </div>
      {task.description && (
        <p className="text-gray-400 text-xs mb-2 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between text-xs">
        <span className={priorityColors[task.priority]}>
          {task.priority.toUpperCase()}
        </span>
        {agent && (
          <span className="text-gray-500">{agent.name || agent.id}</span>
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
      className={`bg-gray-800 rounded-lg border ${
        isOver ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-gray-700'
      } transition-all`}
    >
      <div className={`${color} px-4 py-3 rounded-t-lg`}>
        <h3 className="font-semibold text-white">
          {label} ({count})
        </h3>
      </div>
      <div className="p-3 min-h-[200px]">
        {children}
      </div>
    </div>
  );
}
