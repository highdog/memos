import { CheckSquareIcon, PlusIcon, XIcon, SaveIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { memoStore, memoDetailStore } from "@/store";
import { Memo } from "@/types/proto/api/v1/memo_service";
import { NodeType, Node } from "@/types/proto/api/v1/markdown_service";

interface TaskDetailSidebarProps {
  memo: Memo | null;
  onClose: () => void;
  className?: string;
}

interface TaskItem {
  id: string;
  content: string;
  completed: boolean;
  parentId?: string;
  level: number;
}

const TaskDetailSidebar = observer(({ memo, onClose, className }: TaskDetailSidebarProps) => {
  const [isEditing, setIsEditing] = useState(true);
  const [newSubtask, setNewSubtask] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // 从memo中提取任务列表
  const tasks = useMemo(() => {
    if (!memo) return [];
    
    const extractTasks = (nodes: Node[], level = 0, parentId?: string): TaskItem[] => {
      const tasks: TaskItem[] = [];
      
      nodes.forEach((node, index) => {
        if (node.type === NodeType.TASK_LIST_ITEM && node.taskListItemNode) {
          const taskId = `${parentId || 'root'}-${index}`;
          const content = node.taskListItemNode.children
            ?.map(child => {
              if (child.type === NodeType.TEXT && child.textNode) {
                return child.textNode.content;
              }
              return '';
            })
            .join('') || '';
          
          tasks.push({
            id: taskId,
            content,
            completed: node.taskListItemNode.complete || false,
            parentId,
            level
          });
          
          // 递归处理子任务
          if (node.taskListItemNode.children) {
            tasks.push(...extractTasks(node.taskListItemNode.children, level + 1, taskId));
          }
        } else if (node.type === NodeType.LIST && node.listNode?.children) {
          tasks.push(...extractTasks(node.listNode.children, level, parentId));
        }
      });
      
      return tasks;
    };
    
    return extractTasks(memo.nodes);
  }, [memo]);

  const handleToggleTask = async (taskId: string) => {
    if (!memo) return;
    
    // 这里应该调用API来更新任务状态
    // 暂时先在控制台输出
    console.log('Toggle task:', taskId);
  };

  const handleAddSubtask = async (parentTaskId?: string) => {
    if (!newSubtask.trim() || !memo) return;
    
    // 这里应该调用API来添加子任务
    console.log('Add subtask:', newSubtask, 'to parent:', parentTaskId);
    setNewSubtask("");
  };

  const handleEditTask = (taskId: string, content: string) => {
    setEditingTaskId(taskId);
    setEditingContent(content);
  };

  const handleSaveEdit = async () => {
    if (!editingTaskId || !memo) return;
    
    // 这里应该调用API来更新任务内容
    console.log('Save edit:', editingTaskId, editingContent);
    setEditingTaskId(null);
    setEditingContent("");
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingContent("");
  };

  if (!memo) {
    return (
      <div className={cn("w-80 h-full border-l border-border bg-background flex items-center justify-center", className)}>
        <div className="text-center text-muted-foreground">
          <CheckSquareIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>选择一个任务查看详情</p>
        </div>
      </div>
    );
  }



  return (
    <div className={cn("w-80 h-full border-l border-border bg-background flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">任务编辑</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium">任务列表</h3>
          </div>
          
          <div className="space-y-2">
            {tasks.map((task) => (
              <div 
                key={task.id}
                className={cn(
                  "flex items-start gap-2 p-2 rounded-lg border transition-colors",
                  task.completed && "bg-muted/50 opacity-75"
                )}
                style={{ marginLeft: `${task.level * 16}px` }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 mt-0.5"
                  onClick={() => handleToggleTask(task.id)}
                >
                  <CheckSquareIcon 
                    className={cn(
                      "w-4 h-4",
                      task.completed ? "text-green-600" : "text-muted-foreground"
                    )}
                  />
                </Button>
                
                <div className="flex-1 min-w-0">
                  {editingTaskId === task.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="text-sm"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <Button size="sm" onClick={handleSaveEdit}>
                          <SaveIcon className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                          <XIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="group flex items-center justify-between">
                      <p 
                        className={cn(
                          "text-sm cursor-pointer flex-1",
                          task.completed && "line-through text-muted-foreground"
                        )}
                        onClick={() => handleEditTask(task.id, task.content)}
                      >
                        {task.content}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-2"
                        onClick={() => handleAddSubtask(task.id)}
                        title="添加子任务"
                      >
                        <PlusIcon className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Add New Subtask */}
          <div className="mt-4 space-y-2">
            <Separator />
            <div className="flex gap-2">
              <Input
                placeholder="添加新的子任务..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                className="text-sm"
              />
              <Button 
                size="sm" 
                onClick={() => handleAddSubtask()}
                disabled={!newSubtask.trim()}
              >
                <PlusIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TaskDetailSidebar;