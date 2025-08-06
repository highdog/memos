import { FileTextIcon, HashIcon, CheckCircleIcon, PlusIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { memoStore, memoDetailStore } from "@/store";
import { State } from "@/types/proto/api/v1/common";
import { Memo } from "@/types/proto/api/v1/memo_service";
import { NodeType } from "@/types/proto/api/v1/markdown_service";
import { Priority, getPriorityFromMemo, sortMemosByPriority, getPriorityText, getPriorityColor } from "@/utils/priority";
import MemoContent from "../MemoContent";
import SimpleMemoEditor from "../SimpleMemoEditor";
import TaskActionMenu from "../TaskActionMenu";
import TaskInput from "./TaskInput";

interface TodoSidebarProps {
  className?: string;
  associatedMemoId?: string;
  selectedMemo?: Memo | null;
  onMemoSelect?: (memo: Memo) => void;
  selectedTag?: string | null;
}

const TodoSidebar = observer(({ className, selectedMemo, onMemoSelect, selectedTag }: TodoSidebarProps) => {
  const navigate = useNavigate();
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [editingMemoName, setEditingMemoName] = useState<string | null>(null);
  
  // 处理编辑功能
  const handleEditMemo = (memo: Memo) => {
    setEditingMemoName(memo.name);
  };

  const handleEditComplete = () => {
    setEditingMemoName(null);
  };

  const onEditorConfirm = async (memoName: string) => {
    setEditingMemoName(null);
    // 刷新用户统计
    memoStore.setStatsStateId();
  };

  const onEditorCancel = () => {
    setEditingMemoName(null);
  };
  
  // 检查笔记是否有未完成的任务
  const hasIncompleteTasks = (memo: Memo): boolean => {
    for (const node of memo.nodes) {
      if (node.type === NodeType.LIST && node.listNode?.children) {
        for (const child of node.listNode.children) {
          if (child.type === NodeType.TASK_LIST_ITEM && !child.taskListItemNode?.complete) {
            return true;
          }
        }
      }
    }
    return false;
  };
  
  // 使用useMemo实时获取包含未完成任务的笔记，自动响应memoStore状态变化
  const taskListMemos = useMemo(() => {
    console.log('TodoSidebar: filtering memos, total count:', memoStore.state.memos.length);
    let filtered = memoStore.state.memos
      .filter((memo) => {
        const isNormal = memo.state === State.NORMAL;
        const hasIncomplete = hasIncompleteTasks(memo);
        const matchesTag = selectedTag === null || selectedTag === undefined || memo.tags.includes(selectedTag);
        
        // 优先级筛选
        let matchesPriority = true;
        if (selectedPriority !== 'all') {
          const memoPriority = getPriorityFromMemo(memo);
          matchesPriority = memoPriority === selectedPriority;
        }
        
        console.log(`TodoSidebar: memo ${memo.name} hasIncompleteTasks=${hasIncomplete}, matchesTag=${matchesTag}, matchesPriority=${matchesPriority}, included=${isNormal && hasIncomplete && matchesTag && matchesPriority}`);
        return isNormal && hasIncomplete && matchesTag && matchesPriority;
      });
    
    // 按优先级排序
    filtered = sortMemosByPriority(filtered);
    
    console.log('TodoSidebar: filtered taskListMemos count:', filtered.length);
    return filtered;
  }, [memoStore.state.memos, memoStore.state.stateId, selectedTag, selectedPriority]);





  return (
    <div
      className={cn(
        "w-full h-full flex flex-col bg-background border-l border-border",
        "max-md:w-full max-md:h-full max-md:border-l-0",
        className,
      )}
    >
      {/* Header with Add Task Button */}
      <div className="p-4 border-b border-border">
        <Button 
          onClick={() => setShowTaskInput(!showTaskInput)}
          className="w-full"
          variant={showTaskInput ? "secondary" : "default"}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          {showTaskInput ? "取消添加" : "添加任务"}
        </Button>
        
        {/* Task Input */}
         {showTaskInput && (
           <div className="mt-4">
             <TaskInput onTaskCreated={() => setShowTaskInput(false)} />
           </div>
         )}
         
         {/* Priority Filter Buttons */}
         <div className="mt-4">
           <div className="text-xs text-muted-foreground mb-2">按优先级筛选</div>
           <div className="flex flex-wrap gap-2">
             <Button
               size="sm"
               variant={selectedPriority === 'all' ? 'default' : 'outline'}
               onClick={() => setSelectedPriority('all')}
               className="text-xs"
             >
               全部
             </Button>
             <Button
               size="sm"
               variant={selectedPriority === 'high' ? 'default' : 'outline'}
               onClick={() => setSelectedPriority('high')}
               className="text-xs"
             >
               <div className={`w-2 h-2 rounded-full ${getPriorityColor('high')} mr-1`}></div>
               高
             </Button>
             <Button
               size="sm"
               variant={selectedPriority === 'medium' ? 'default' : 'outline'}
               onClick={() => setSelectedPriority('medium')}
               className="text-xs"
             >
               <div className={`w-2 h-2 rounded-full ${getPriorityColor('medium')} mr-1`}></div>
               中
             </Button>
             <Button
               size="sm"
               variant={selectedPriority === 'low' ? 'default' : 'outline'}
               onClick={() => setSelectedPriority('low')}
               className="text-xs"
             >
               <div className={`w-2 h-2 rounded-full ${getPriorityColor('low')} mr-1`}></div>
               低
             </Button>
           </div>
         </div>
      </div>

      {/* Memo List */}
      <div className="flex-1 flex flex-col">
        {/* Memo List */}
        <div className="flex-1">
          <div className="h-full overflow-y-auto">
            {taskListMemos.length === 0 ? (
              <div className="text-center py-8 px-4">
                <CheckCircleIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No notes with task lists found.</p>
                <p className="text-xs text-muted-foreground/70 mt-2">Create a note with checkboxes to see it here.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {taskListMemos.map((memo, index) => (
                  editingMemoName === memo.name ? (
                    <div key={memo.name} className="px-3 py-4">
                      <SimpleMemoEditor
                          autoFocus
                          className="w-full"
                          memoName={memo.name}
                          onConfirm={onEditorConfirm}
                          onCancel={onEditorCancel}
                        />
                    </div>
                  ) : (
                    <div
                      key={memo.name}
                      className={cn(
                        "group relative flex flex-col justify-start items-start w-full px-3 py-4 text-card-foreground transition-colors hover:bg-accent/50",
                        selectedMemo?.name === memo.name && "bg-accent"
                      )}
                    >
                      {/* Action Menu - 右上角三点菜单 */}
                      <div className="absolute top-3 right-3 z-10">
                        <TaskActionMenu 
                          memo={memo} 
                          onEdit={() => handleEditMemo(memo)}
                        />
                      </div>

                      {/* Memo Content - 精确划分点击区域，排除右侧菜单区域 */}
                      <div 
                        className="w-full flex flex-col justify-start items-start gap-2 pr-8"
                        onClick={(e) => {
                          // 检查点击的是否是checkbox或其相关元素
                          const target = e.target as HTMLElement;
                          const isCheckboxClick = target.closest('[role="checkbox"]') || 
                                                target.closest('[data-slot="checkbox"]') ||
                                                target.closest('button[role="checkbox"]') ||
                                                target.tagName.toLowerCase() === 'input' ||
                                                target.hasAttribute('data-state');
                          
                          // 如果不是checkbox点击，则显示任务详情弹窗
                          if (!isCheckboxClick) {
                            if (onMemoSelect) {
                              onMemoSelect(memo);
                            } else {
                              // 使用 memoDetailStore 显示弹窗而不是导航到新页面
                              memoDetailStore.setSelectedMemo(memo);
                            }
                          }
                        }}
                      >
                        <div className="w-full cursor-pointer">
                          <MemoContent nodes={memo.nodes} memoName={memo.name} readonly={false} compact={true} />
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default TodoSidebar;
