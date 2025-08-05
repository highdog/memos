import { CheckIcon, ClockIcon, EditIcon, TrashIcon, AlertCircleIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TodoItemProps, TodoStatus, TodoPriority } from "@/types/todo";

// import { useTranslate } from "@/utils/i18n";

const TodoItem = observer(({ todo, onEdit, onDelete, onToggleStatus, className }: TodoItemProps) => {
  // const t = useTranslate();
  const [isHovered, setIsHovered] = useState(false);

  const getPriorityColor = (priority: TodoPriority) => {
    switch (priority) {
      case TodoPriority.HIGH:
        return "text-red-500 border-red-200";
      case TodoPriority.MEDIUM:
        return "text-yellow-500 border-yellow-200";
      case TodoPriority.LOW:
        return "text-green-500 border-green-200";
      default:
        return "text-gray-500 border-gray-200";
    }
  };

  const getStatusIcon = (status: TodoStatus) => {
    switch (status) {
      case TodoStatus.COMPLETED:
        return <CheckIcon className="w-4 h-4 text-green-500" />;
      case TodoStatus.IN_PROGRESS:
        return <ClockIcon className="w-4 h-4 text-blue-500" />;
      default:
        return <div className="w-4 h-4 border-2 border-gray-300 rounded" />;
    }
  };

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && todo.status !== TodoStatus.COMPLETED;
  const isCompleted = todo.status === TodoStatus.COMPLETED;

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  };

  return (
    <div
      className={cn(
        "group p-3 border rounded-lg transition-all duration-200 hover:shadow-sm max-md:p-2",
        isCompleted && "bg-gray-50 opacity-75",
        isOverdue && "border-red-200 bg-red-50",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        {/* Status Toggle Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 h-auto min-w-0 hover:bg-transparent" onClick={() => onToggleStatus(todo.id)}>
                {getStatusIcon(todo.status)}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isCompleted ? "Mark as pending" : "Mark as completed"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className={cn("text-sm font-medium text-gray-900 break-words", isCompleted && "line-through text-gray-500")}>{todo.title}</h4>

          {/* Description */}
          {todo.description && (
            <p className={cn("text-xs text-gray-600 mt-1 break-words", isCompleted && "line-through text-gray-400")}>{todo.description}</p>
          )}

          {/* Meta Information */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Priority Badge */}
            <span
              className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border", getPriorityColor(todo.priority))}
            >
              {todo.priority.toUpperCase()}
            </span>

            {/* Due Date */}
            {todo.dueDate && (
              <div className="flex items-center gap-1">
                {isOverdue && <AlertCircleIcon className="w-3 h-3 text-red-500" />}
                <span className={cn("text-xs", isOverdue ? "text-red-600 font-medium" : "text-gray-500")}>
                  {formatDueDate(new Date(todo.dueDate))}
                </span>
              </div>
            )}

            {/* Tags */}
            {todo.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {todo.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={cn("flex items-center gap-1 transition-opacity duration-200", isHovered ? "opacity-100" : "opacity-0")}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-auto min-w-0 hover:bg-blue-100" onClick={() => onEdit(todo)}>
                  <EditIcon className="w-3 h-3 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit todo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-auto min-w-0 hover:bg-red-100" onClick={() => onDelete(todo.id)}>
                  <TrashIcon className="w-3 h-3 text-red-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete todo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
});

export default TodoItem;
