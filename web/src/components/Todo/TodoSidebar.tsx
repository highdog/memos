import { FileTextIcon, HashIcon, CheckCircleIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { memoStore } from "@/store";
import { State } from "@/types/proto/api/v1/common";
import { Memo } from "@/types/proto/api/v1/memo_service";
import { NodeType } from "@/types/proto/api/v1/markdown_service";
import MemoContent from "../MemoContent";

interface TodoSidebarProps {
  className?: string;
  associatedMemoId?: string;
}

const TodoSidebar = observer(({ className }: TodoSidebarProps) => {
  const navigate = useNavigate();
  
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
    const filtered = memoStore.state.memos
      .filter((memo) => {
        const isNormal = memo.state === State.NORMAL;
        const hasIncomplete = hasIncompleteTasks(memo);
        console.log(`TodoSidebar: memo ${memo.name} hasIncompleteTasks=${hasIncomplete}, included=${isNormal && hasIncomplete}`);
        return isNormal && hasIncomplete;
      })
      .sort((a, b) => {
        // 按显示时间倒序排列
        return new Date(b.displayTime!).getTime() - new Date(a.displayTime!).getTime();
      });
    console.log('TodoSidebar: filtered taskListMemos count:', filtered.length);
    return filtered;
  }, [memoStore.state.memos, memoStore.state.stateId]);





  return (
    <div
      className={cn(
        "w-full h-full flex flex-col bg-background border-l border-border",
        "max-md:w-full max-md:h-full max-md:border-l-0",
        className,
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Task Lists</h2>
          <div className="flex items-center gap-2">
            <FileTextIcon className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>


      </div>

      {/* Memo List */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-2">
          <p className="text-sm text-muted-foreground">Notes with task lists</p>
        </div>

        {/* Memo List */}
        <div className="flex-1 px-4 pb-4">
          <div className="h-full overflow-y-auto">
            <div className="space-y-2">
              {taskListMemos.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircleIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No notes with task lists found.</p>
                  <p className="text-xs text-muted-foreground/70 mt-2">Create a note with checkboxes to see it here.</p>
                </div>
              ) : (
                taskListMemos.map((memo) => (
                  <div
                    key={memo.name}
                    className={cn(
                      "group relative flex flex-col justify-start items-start bg-card w-full px-4 py-3 gap-2 text-card-foreground rounded-lg border border-border transition-colors hover:shadow-md",
                    )}
                  >


                    {/* Memo Content - 与MemoView样式一致，但不包裹在Link中以避免事件冲突 */}
                    <div 
                      className="w-full flex flex-col justify-start items-start gap-2 cursor-pointer"
                      onClick={(e) => {
                        // 检查点击的是否是checkbox或其相关元素
                        const target = e.target as HTMLElement;
                        const isCheckboxClick = target.closest('[role="checkbox"]') || 
                                              target.closest('[data-slot="checkbox"]') ||
                                              target.closest('button[role="checkbox"]') ||
                                              target.tagName.toLowerCase() === 'input' ||
                                              target.hasAttribute('data-state');
                        
                        // 如果不是checkbox点击，则导航到详情页
                        if (!isCheckboxClick) {
                          navigate(`/${memo.name}`);
                        }
                      }}
                    >
                      <MemoContent memoName={memo.name} nodes={memo.nodes} readonly={false} compact={true} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TodoSidebar;
