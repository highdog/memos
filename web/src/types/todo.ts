// Todo item priority levels
export enum TodoPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

// Todo item status
export enum TodoStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

// Todo item interface
export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: Date;
  tags: string[];
  associatedMemoId?: string; // Optional association with a memo
  createdAt: Date;
  updatedAt: Date;
}

// Todo form data interface
export interface TodoFormData {
  title: string;
  description?: string;
  priority: TodoPriority;
  dueDate?: Date;
  tags: string[];
  associatedMemoId?: string;
}

// Todo filter options
export interface TodoFilter {
  status?: TodoStatus[];
  priority?: TodoPriority[];
  tags?: string[];
  associatedMemoId?: string;
  dueDateRange?: {
    start?: Date;
    end?: Date;
  };
}

// Todo sort options
export enum TodoSortBy {
  CREATED_AT = "createdAt",
  UPDATED_AT = "updatedAt",
  DUE_DATE = "dueDate",
  PRIORITY = "priority",
  TITLE = "title",
}

export interface TodoSortOptions {
  sortBy: TodoSortBy;
  order: "asc" | "desc";
}

// Todo store state interface
export interface TodoStoreState {
  todos: TodoItem[];
  filter: TodoFilter;
  sortOptions: TodoSortOptions;
  isLoading: boolean;
  error: string | null;
}

// Todo component props interfaces
export interface TodoSidebarProps {
  className?: string;
  associatedMemoId?: string;
}

export interface TodoItemProps {
  todo: TodoItem;
  onEdit: (todo: TodoItem) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  className?: string;
}

export interface TodoFormProps {
  todo?: TodoItem; // For editing existing todo
  associatedMemoId?: string;
  onSubmit: (data: TodoFormData) => void;
  onCancel: () => void;
  className?: string;
}

export interface TodoListProps {
  todos: TodoItem[];
  onEdit: (todo: TodoItem) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  className?: string;
}

export interface TodoFilterProps {
  filter: TodoFilter;
  onFilterChange: (filter: TodoFilter) => void;
  className?: string;
}

export interface TodoStatsProps {
  todos: TodoItem[];
  className?: string;
}
