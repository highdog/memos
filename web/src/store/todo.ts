import { makeAutoObservable } from "mobx";
import { TodoItem, TodoFormData, TodoFilter, TodoSortOptions, TodoSortBy, TodoStatus, TodoPriority } from "@/types/todo";

const LOCAL_STORAGE_KEY = "memos-todo-store";

class TodoState {
  todos: TodoItem[] = [];
  filter: TodoFilter = {
    status: [TodoStatus.PENDING, TodoStatus.IN_PROGRESS],
  };
  sortOptions: TodoSortOptions = {
    sortBy: TodoSortBy.CREATED_AT,
    order: "desc",
  };
  isLoading: boolean = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  // Basic CRUD operations
  addTodo(formData: TodoFormData): TodoItem {
    const newTodo: TodoItem = {
      id: this.generateId(),
      title: formData.title,
      description: formData.description,
      status: TodoStatus.PENDING,
      priority: formData.priority,
      dueDate: formData.dueDate,
      tags: formData.tags,
      associatedMemoId: formData.associatedMemoId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.todos.push(newTodo);
    this.saveToLocalStorage();
    return newTodo;
  }

  updateTodo(id: string, updates: Partial<TodoFormData>): TodoItem | null {
    const todoIndex = this.todos.findIndex((todo) => todo.id === id);
    if (todoIndex === -1) {
      this.error = "Todo not found";
      return null;
    }

    const updatedTodo = {
      ...this.todos[todoIndex],
      ...updates,
      updatedAt: new Date(),
    };

    this.todos[todoIndex] = updatedTodo;
    this.saveToLocalStorage();
    this.error = null;
    return updatedTodo;
  }

  deleteTodo(id: string): boolean {
    const todoIndex = this.todos.findIndex((todo) => todo.id === id);
    if (todoIndex === -1) {
      this.error = "Todo not found";
      return false;
    }

    this.todos.splice(todoIndex, 1);
    this.saveToLocalStorage();
    this.error = null;
    return true;
  }

  toggleTodoStatus(id: string): TodoItem | null {
    const todo = this.todos.find((todo) => todo.id === id);
    if (!todo) {
      this.error = "Todo not found";
      return null;
    }

    const newStatus = todo.status === TodoStatus.COMPLETED ? TodoStatus.PENDING : TodoStatus.COMPLETED;
    return this.updateTodo(id, { status: newStatus } as Partial<TodoFormData>);
  }

  // Filter and sort operations
  setFilter(filter: Partial<TodoFilter>) {
    this.filter = { ...this.filter, ...filter };
  }

  setSortOptions(sortOptions: Partial<TodoSortOptions>) {
    this.sortOptions = { ...this.sortOptions, ...sortOptions };
  }

  clearFilter() {
    this.filter = {
      status: [TodoStatus.PENDING, TodoStatus.IN_PROGRESS],
    };
  }

  // Computed getters
  get filteredTodos(): TodoItem[] {
    let filtered = [...this.todos];

    // Filter by status
    if (this.filter.status && this.filter.status.length > 0) {
      filtered = filtered.filter((todo) => this.filter.status!.includes(todo.status));
    }

    // Filter by priority
    if (this.filter.priority && this.filter.priority.length > 0) {
      filtered = filtered.filter((todo) => this.filter.priority!.includes(todo.priority));
    }

    // Filter by tags
    if (this.filter.tags && this.filter.tags.length > 0) {
      filtered = filtered.filter((todo) => this.filter.tags!.some((tag) => todo.tags.includes(tag)));
    }

    // Filter by associated memo
    if (this.filter.associatedMemoId) {
      filtered = filtered.filter((todo) => todo.associatedMemoId === this.filter.associatedMemoId);
    }

    // Filter by due date range
    if (this.filter.dueDateRange) {
      const { start, end } = this.filter.dueDateRange;
      filtered = filtered.filter((todo) => {
        if (!todo.dueDate) return false;
        const dueDate = new Date(todo.dueDate);
        if (start && dueDate < start) return false;
        if (end && dueDate > end) return false;
        return true;
      });
    }

    // Sort
    return this.sortTodos(filtered);
  }

  get todosByMemo(): Record<string, TodoItem[]> {
    const grouped: Record<string, TodoItem[]> = {};

    this.filteredTodos.forEach((todo) => {
      const memoId = todo.associatedMemoId || "unassociated";
      if (!grouped[memoId]) {
        grouped[memoId] = [];
      }
      grouped[memoId].push(todo);
    });

    return grouped;
  }

  get todoStats() {
    const total = this.todos.length;
    const completed = this.todos.filter((todo) => todo.status === TodoStatus.COMPLETED).length;
    const pending = this.todos.filter((todo) => todo.status === TodoStatus.PENDING).length;
    const inProgress = this.todos.filter((todo) => todo.status === TodoStatus.IN_PROGRESS).length;
    const overdue = this.todos.filter((todo) => {
      if (!todo.dueDate || todo.status === TodoStatus.COMPLETED) return false;
      return new Date(todo.dueDate) < new Date();
    }).length;

    return {
      total,
      completed,
      pending,
      inProgress,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  // Utility methods
  private generateId(): string {
    return `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sortTodos(todos: TodoItem[]): TodoItem[] {
    const { sortBy, order } = this.sortOptions;

    return todos.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case TodoSortBy.TITLE:
          comparison = a.title.localeCompare(b.title);
          break;
        case TodoSortBy.PRIORITY: {
          const priorityOrder = { [TodoPriority.HIGH]: 3, [TodoPriority.MEDIUM]: 2, [TodoPriority.LOW]: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }
        case TodoSortBy.DUE_DATE:
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case TodoSortBy.UPDATED_AT:
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case TodoSortBy.CREATED_AT:
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return order === "asc" ? comparison : -comparison;
    });
  }

  private saveToLocalStorage() {
    try {
      const dataToSave = {
        todos: this.todos,
        filter: this.filter,
        sortOptions: this.sortOptions,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Failed to save todos to localStorage:", error);
    }
  }

  loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.todos) {
          this.todos = parsed.todos.map((todo: any) => ({
            ...todo,
            createdAt: new Date(todo.createdAt),
            updatedAt: new Date(todo.updatedAt),
            dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
          }));
        }
        if (parsed.filter) {
          this.filter = parsed.filter;
        }
        if (parsed.sortOptions) {
          this.sortOptions = parsed.sortOptions;
        }
      }
    } catch (error) {
      console.error("Failed to load todos from localStorage:", error);
      this.error = "Failed to load saved todos";
    }
  }

  clearError() {
    this.error = null;
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }
}

const todoStore = (() => {
  const state = new TodoState();

  // Load initial state from localStorage
  state.loadFromLocalStorage();

  return {
    state,
  };
})();

export default todoStore;
