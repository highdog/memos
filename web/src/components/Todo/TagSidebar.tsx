import { HashIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { memoStore } from "@/store";
import { State } from "@/types/proto/api/v1/common";
import { Memo } from "@/types/proto/api/v1/memo_service";
import { NodeType } from "@/types/proto/api/v1/markdown_service";
import { useTranslate } from "@/utils/i18n";

interface TagSidebarProps {
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

const TagSidebar = observer(({ selectedTag, onTagSelect }: TagSidebarProps) => {
  const t = useTranslate();
  
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

  // 获取包含未完成任务的笔记中的所有标签
  const taskTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    
    memoStore.state.memos
      .filter((memo) => {
        const isNormal = memo.state === State.NORMAL;
        const hasIncomplete = hasIncompleteTasks(memo);
        return isNormal && hasIncomplete;
      })
      .forEach((memo) => {
        memo.tags.forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

    return Array.from(tagCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .sort((a, b) => b[1] - a[1]);
  }, [memoStore.state.memos]);

  return (
    <div className="flex flex-col justify-start items-start w-full mt-3 px-1 h-auto shrink-0 flex-nowrap hide-scrollbar">
      <div className="flex flex-row justify-between items-center w-full gap-1 mb-1 text-sm leading-6 text-muted-foreground select-none">
        <span>{t("common.tags")}</span>
      </div>
      
      {/* 全部任务选项 */}
      <div
        className={cn(
          "shrink-0 w-auto max-w-full text-sm rounded-md leading-6 flex flex-row justify-start items-center select-none hover:opacity-80 mb-1 cursor-pointer",
          selectedTag === null ? "text-primary" : "text-muted-foreground"
        )}
        onClick={() => onTagSelect(null)}
      >
        <HashIcon className="w-4 h-auto shrink-0 text-muted-foreground" />
        <div className="inline-flex flex-nowrap ml-0.5 gap-0.5 max-w-[calc(100%-16px)]">
          <span className="truncate opacity-80">全部任务</span>
          <span className="opacity-60 shrink-0">
            ({memoStore.state.memos.filter((memo) => {
              const isNormal = memo.state === State.NORMAL;
              const hasIncomplete = hasIncompleteTasks(memo);
              return isNormal && hasIncomplete;
            }).length})
          </span>
        </div>
      </div>

      {taskTags.length > 0 ? (
        <div className="w-full flex flex-col justify-start items-start relative gap-y-1">
          {taskTags.map(([tag, amount]) => (
            <div
              key={tag}
              className={cn(
                "shrink-0 w-auto max-w-full text-sm rounded-md leading-6 flex flex-row justify-start items-center select-none hover:opacity-80 mb-1 cursor-pointer",
                selectedTag === tag ? "text-primary" : "text-muted-foreground"
              )}
              onClick={() => onTagSelect(tag)}
            >
              <HashIcon className="w-4 h-auto shrink-0 text-muted-foreground" />
              <div className="inline-flex flex-nowrap ml-0.5 gap-0.5 max-w-[calc(100%-16px)]">
                <span className="truncate opacity-80">{tag}</span>
                {amount > 1 && <span className="opacity-60 shrink-0">({amount})</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-2 border border-dashed rounded-md flex flex-row justify-start items-start gap-1 text-muted-foreground">
          <span className="text-sm leading-snug italic">暂无包含任务的标签</span>
        </div>
      )}
    </div>
  );
});

export default TagSidebar;