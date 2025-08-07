import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { memoStore, memoDetailStore } from "@/store";
import { Memo, MemoRelation_Type } from "@/types/proto/api/v1/memo_service";
import { Node, NodeType } from "@/types/proto/api/v1/markdown_service";
import MemoView from "../MemoView";
import { CheckSquareIcon, Square, PlusIcon, ChevronRightIcon } from "lucide-react";

interface TaskItem {
  id: string;
  content: string;
  completed: boolean;
  level: number;
  children: TaskItem[];
  parentId?: string;
  progress?: number;
}

interface Props {
  memo: Memo;
  className?: string;
  parentPage?: string;
  isTaskMemo?: boolean;
}

const MemoDetailSidebar = ({ memo, className, parentPage, isTaskMemo = false }: Props) => {
  const [showRelatedMemoEditor, setShowRelatedMemoEditor] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");

  // 获取关联笔记
  const referencingRelations = 
    memo?.relations.filter((relation) => relation.type === MemoRelation_Type.REFERENCE && relation.relatedMemo?.name !== memo.name) || [];
  const referencingMemos = referencingRelations.map((relation) => memoStore.getMemoByName(relation.relatedMemo!.name)).filter((memo) => memo) as any as Memo[];

  const referencedByRelations = 
    memo?.relations.filter((relation) => relation.type === MemoRelation_Type.REFERENCE && relation.relatedMemo?.name === memo.name) || [];
  const referencedByMemos = referencedByRelations.map((relation) => memoStore.getMemoByName(relation.memo!.name)).filter((memo) => memo) as any as Memo[];

  // 提取任务列表 - 只在任务笔记时解析
  const { mainTask, subtasks } = useMemo(() => {
    if (!memo || !isTaskMemo) return { mainTask: null, subtasks: [] };
    
    // 从memo内容中解析任务
    const lines = memo.content.split('\n');
    let mainTask: TaskItem | null = null;
    const subtasks: TaskItem[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // 检查是否是任务行
      const taskMatch = trimmedLine.match(/^[-*]\s*\[([ x])\]\s*(.+)$/);
      if (taskMatch) {
        const [, checkStatus, content] = taskMatch;
        const completed = checkStatus === 'x';
        
        // 检查是否是缩进的子任务（以空格或tab开头）
        const isIndented = line.match(/^\s+/);
        
        const task: TaskItem = {
          id: `task-${index}`,
          content: content.trim(),
          completed,
          level: isIndented ? 1 : 0,
          children: [],
          parentId: undefined,
          progress: undefined
        };
        
        if (isIndented) {
          // 缩进的任务是子任务
          subtasks.push(task);
        } else if (!mainTask) {
          // 第一个非缩进的任务是主任务
          mainTask = task;
        }
        // 忽略第二个及以后的非缩进任务，因为一个笔记只能有一个主任务
      }
    });
    
    return { mainTask, subtasks };
  }, [memo, isTaskMemo]);



  const handleShowRelatedMemoEditor = () => {
    setShowRelatedMemoEditor(true);
  };

  const handleRelatedMemoCreated = async (relatedMemoName: string) => {
    await memoStore.getOrFetchMemoByName(relatedMemoName);
    const updatedMemo = await memoStore.getOrFetchMemoByName(memo.name, { skipCache: true });
    
    // 如果当前笔记是在详情弹窗中显示的，则更新 memoDetailStore 中的数据
    if (memoDetailStore.selectedMemo && memoDetailStore.selectedMemo.name === memo.name) {
      memoDetailStore.updateSelectedMemo(updatedMemo);
    }
    
    setShowRelatedMemoEditor(false);
  };

  const handleToggleTask = async (taskId: string) => {
    if (!memo) return;
    
    try {
      // 找到对应的任务（可能是主任务或子任务）
      const allTasks = [mainTask, ...subtasks].filter(Boolean) as TaskItem[];
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;
      
      // 切换任务状态的逻辑：在memo内容中查找并替换对应的任务行
      let updatedContent = memo.content;
      
      // 根据任务内容查找并替换
      const currentPattern = task.completed 
        ? `- [x] ${task.content}` 
        : `- [ ] ${task.content}`;
      const newPattern = task.completed 
        ? `- [ ] ${task.content}` 
        : `- [x] ${task.content}`;
      
      // 尝试多种可能的格式
      const patterns = [
        currentPattern,
        currentPattern.replace('- [', '-['),
        currentPattern.replace('- [', '* ['),
        currentPattern.replace('- [', '*['),
      ];
      
      const replacements = [
        newPattern,
        newPattern.replace('- [', '-['),
        newPattern.replace('- [', '* ['),
        newPattern.replace('- [', '*['),
      ];
      
      let found = false;
      for (let i = 0; i < patterns.length; i++) {
        if (updatedContent.includes(patterns[i])) {
          updatedContent = updatedContent.replace(patterns[i], replacements[0]);
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.warn('Task pattern not found in content:', task.content);
        return;
      }
      
      // 调用API更新memo
      const updatedMemo = await memoStore.updateMemo(
        {
          name: memo.name,
          content: updatedContent,
        },
        ["content"]
      );
      
      // 如果当前笔记是在详情弹窗中显示的，则更新 memoDetailStore 中的数据
      if (memoDetailStore.selectedMemo && memoDetailStore.selectedMemo.name === memo.name) {
        memoDetailStore.setSelectedMemo(updatedMemo);
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || !memo) return;
    
    try {
      // 添加缩进的子任务（使用两个空格缩进）
      const newTaskLine = `\n  - [ ] ${newSubtask.trim()}`;
      const updatedContent = memo.content + newTaskLine;
      
      // 调用API更新memo
      const updatedMemo = await memoStore.updateMemo(
        {
          name: memo.name,
          content: updatedContent,
        },
        ["content"]
      );
      
      // 如果当前笔记是在详情弹窗中显示的，则更新 memoDetailStore 中的数据
      if (memoDetailStore.selectedMemo && memoDetailStore.selectedMemo.name === memo.name) {
        memoDetailStore.setSelectedMemo(updatedMemo);
      }
      
      // 清空输入框
      setNewSubtask("");
    } catch (error) {
      console.error('Failed to add subtask:', error);
    }
  };

  const handleSubtaskKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSubtask();
    }
  };







  return (
    <aside
      className={cn("relative w-full h-auto max-h-screen overflow-auto hide-scrollbar flex flex-col justify-start items-start", className)}
    >
      <div className="flex flex-col justify-start items-start w-full px-6 py-6 gap-6 h-auto shrink-0 flex-nowrap hide-scrollbar">
        {isTaskMemo ? (
          /* 任务笔记：显示子任务区域 */
          <div className="mb-6 w-full">
            <div className="text-xs text-muted-foreground mb-4 px-4">子任务</div>
            
            {/* 进度条 */}
            <div className="mb-6 px-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>进度</span>
                <span>{subtasks.filter(t => t.completed).length}/{subtasks.length}</span>
              </div>
              <Progress value={subtasks.length > 0 ? (subtasks.filter(t => t.completed).length / subtasks.length) * 100 : 0} className="h-2" />
            </div>
            
            {/* 子任务列表 */}
            <div className="space-y-1 mb-6">
              {subtasks.length > 0 ? (
                subtasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 px-4 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                    <Checkbox
                      className="h-4 w-4"
                      checked={task.completed}
                      onCheckedChange={() => handleToggleTask(task.id)}
                    />
                    <span className={cn(
                      "text-sm flex-1",
                      task.completed && "line-through text-muted-foreground"
                    )}>
                      {task.content}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  暂无子任务
                </div>
              )}
            </div>
            
            {/* 添加子任务 */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3 px-4">
                <Input
                  placeholder="添加子任务..."
                  className="text-sm"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={handleSubtaskKeyPress}
                />
                <Button size="sm" onClick={handleAddSubtask}>
                  <PlusIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* 普通笔记：显示事件追踪 */
          <>
            {/* 当前笔记引用的其他笔记 */}
            {referencingMemos.length > 0 && (
              <div className="mb-6 w-full">
                <div className="w-full flex flex-row justify-between items-center h-8 pl-4 mb-4">
                  <div className="flex flex-row justify-start items-center">
                    <span className="text-muted-foreground text-sm">引用的笔记</span>
                    <span className="text-muted-foreground text-sm ml-1">({referencingMemos.length})</span>
                  </div>
                </div>
                <div className="w-full space-y-3">
                  {referencingMemos
                    .sort((a, b) => new Date(a.createTime!).getTime() - new Date(b.createTime!).getTime())
                    .map((referencingMemo) => (
                      <div key={`referencing-${referencingMemo.name}-${referencingMemo.displayTime}`} className="w-full">
                        <MemoView
                          memo={referencingMemo}
                          parentPage={parentPage}
                          showCreator={false}
                          compact={true}
                          className="!mb-0 !w-full min-w-full"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* 被其他笔记引用的记录（事件追踪） */}
            {referencedByMemos.length > 0 && (
              <div className="mb-6 w-full">
                <div className="w-full flex flex-row justify-between items-center h-8 pl-4 mb-4">
                  <div className="flex flex-row justify-start items-center">
                    <span className="text-muted-foreground text-sm">事件追踪</span>
                    <span className="text-muted-foreground text-sm ml-1">({referencedByMemos.length})</span>
                  </div>
                </div>
                <div className="w-full space-y-3">
                  {referencedByMemos
                    .sort((a, b) => new Date(b.createTime!).getTime() - new Date(a.createTime!).getTime())
                    .map((referencedByMemo) => (
                      <div key={`referenced-by-${referencedByMemo.name}-${referencedByMemo.displayTime}`} className="w-full">
                        <MemoView
                          memo={referencedByMemo}
                          parentPage={parentPage}
                          showCreator={false}
                          compact={true}
                          className="!mb-0 !w-full min-w-full"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </aside>
  );
};

export default MemoDetailSidebar;
