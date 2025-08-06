import { CheckSquareIcon, FileTextIcon, CheckCircleIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import MobileHeader from "@/components/MobileHeader";
import { TodoSidebar } from "@/components/Todo";
import useResponsiveWidth from "@/hooks/useResponsiveWidth";
import { cn } from "@/lib/utils";
import { memoStore } from "@/store";
import { State } from "@/types/proto/api/v1/common";
import { Memo } from "@/types/proto/api/v1/memo_service";
import { NodeType } from "@/types/proto/api/v1/markdown_service";
import TaskDetailSidebar from "@/components/Todo/TaskDetailSidebar";
import TaskInput from "@/components/Todo/TaskInput";
import TagSidebar from "@/components/Todo/TagSidebar";

const TaskList = observer(() => {
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { md } = useResponsiveWidth();

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

  // 获取包含未完成任务的笔记
  const taskListMemos = useMemo(() => {
    return memoStore.state.memos
      .filter((memo) => {
        const isNormal = memo.state === State.NORMAL;
        const hasIncomplete = hasIncompleteTasks(memo);
        return isNormal && hasIncomplete;
      })
      .sort((a, b) => {
        // 按显示时间倒序排列
        return new Date(b.displayTime!).getTime() - new Date(a.displayTime!).getTime();
      });
  }, [memoStore.state.memos]);

  return (
    <div className="w-full h-full flex flex-col">
      <MobileHeader />
      
      {/* 主要内容区域 */}
      <div className="flex-1 flex">
        {/* 左侧标签栏 - 1/5 */}
        <div className="w-1/5 border-r border-border">
          <TagSidebar
            selectedTag={selectedTag}
            onTagSelect={setSelectedTag}
          />
        </div>
        
        {/* 中间任务列表 - 2/5 */}
        <div className="w-2/5 border-r border-border">
          <TodoSidebar 
            selectedMemo={selectedMemo}
            onMemoSelect={setSelectedMemo}
            selectedTag={selectedTag}
          />
        </div>
        
        {/* 右侧任务详情 - 2/5 */}
        <div className="w-2/5">
          <TaskDetailSidebar 
            memo={selectedMemo} 
            onClose={() => setSelectedMemo(null)}
          />
        </div>
      </div>
    </div>
  );
});

export default TaskList;