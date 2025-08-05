import { CalendarIcon, PlusIcon, SaveIcon, TagIcon, XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { TodoFormData, TodoFormProps, TodoPriority } from "@/types/todo";

// import { useTranslate } from "@/utils/i18n";

const TodoForm = observer(({ todo, associatedMemoId, onSubmit, onCancel, className }: TodoFormProps) => {
  // const t = useTranslate();
  const [formData, setFormData] = useState<TodoFormData>({
    title: "",
    description: "",
    priority: TodoPriority.MEDIUM,
    tags: [],
    associatedMemoId,
  });
  const [tagInput, setTagInput] = useState("");
  const [dueDateInput, setDueDateInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when editing
  useEffect(() => {
    if (todo) {
      setFormData({
        title: todo.title,
        description: todo.description || "",
        priority: todo.priority,
        tags: [...todo.tags],
        associatedMemoId: todo.associatedMemoId,
        dueDate: todo.dueDate,
      });
      setDueDateInput(todo.dueDate ? todo.dueDate.toISOString().split("T")[0] : "");
    }
  }, [todo]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (dueDateInput) {
      const selectedDate = new Date(dueDateInput);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.dueDate = "Due date cannot be in the past";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData: TodoFormData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description?.trim() || undefined,
      dueDate: dueDateInput ? new Date(dueDateInput) : undefined,
    };

    onSubmit(submitData);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4 p-4 border-b border-gray-200 max-md:p-3 max-md:space-y-3", className)}>
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Title *
        </Label>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Enter todo title..."
          className={cn(errors.title && "border-red-500")}
        />
        {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Enter description (optional)..."
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Priority and Due Date Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Priority */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Priority</Label>
          <Select value={formData.priority} onValueChange={(value: TodoPriority) => setFormData((prev) => ({ ...prev, priority: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TodoPriority.LOW}>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Low
                </span>
              </SelectItem>
              <SelectItem value={TodoPriority.MEDIUM}>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  Medium
                </span>
              </SelectItem>
              <SelectItem value={TodoPriority.HIGH}>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  High
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label htmlFor="dueDate" className="text-sm font-medium">
            Due Date
          </Label>
          <div className="relative">
            <Input
              id="dueDate"
              type="date"
              value={dueDateInput}
              onChange={(e) => setDueDateInput(e.target.value)}
              className={cn(errors.dueDate && "border-red-500")}
            />
            <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.dueDate && <p className="text-xs text-red-600">{errors.dueDate}</p>}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Tags</Label>

        {/* Tag Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagInputKeyPress}
              placeholder="Add a tag..."
              className="pr-8"
            />
            <TagIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddTag} disabled={!tagInput.trim()}>
            <PlusIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Tag List */}
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                #{tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:bg-blue-200 rounded-full p-0.5">
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex items-center gap-2">
          {todo ? (
            <>
              <SaveIcon className="w-4 h-4" />
              Update Todo
            </>
          ) : (
            <>
              <PlusIcon className="w-4 h-4" />
              Add Todo
            </>
          )}
        </Button>
      </div>
    </form>
  );
});

export default TodoForm;
