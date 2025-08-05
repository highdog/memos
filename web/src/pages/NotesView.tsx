import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import MemoEditor from "@/components/MemoEditor";
import MemoView from "@/components/MemoView";
import PagedMemoList from "@/components/PagedMemoList";
import { MemoDetailSidebar } from "@/components/MemoDetailSidebar";
import { TagsSidebar } from "@/components/TagsSidebar";

import useCurrentUser from "@/hooks/useCurrentUser";
import useResponsiveWidth from "@/hooks/useResponsiveWidth";
import { viewStore, userStore, workspaceStore, memoDetailStore } from "@/store";
import { extractUserIdFromName } from "@/store/common";
import memoFilterStore from "@/store/memoFilter";
import { State } from "@/types/proto/api/v1/common";
import { Memo } from "@/types/proto/api/v1/memo_service";
import { NodeType } from "@/types/proto/api/v1/markdown_service";
import { WorkspaceSetting_Key } from "@/types/proto/api/v1/workspace_service";

// Helper function to extract shortcut ID from resource name
// Format: users/{user}/shortcuts/{shortcut}
const getShortcutId = (name: string): string => {
  const parts = name.split("/");
  return parts.length === 4 ? parts[3] : "";
};

const NotesView = observer(() => {
  const user = useCurrentUser();
  const { md, lg } = useResponsiveWidth();
  const selectedShortcut = userStore.state.shortcuts.find((shortcut) => getShortcutId(shortcut.name) === memoFilterStore.shortcut);
  const { selectedMemo, isDetailVisible } = memoDetailStore;



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

  const memoFilter = useMemo(() => {
    if (!user?.name) {
      return undefined;
    }
    const conditions = [`creator_id == ${extractUserIdFromName(user.name)}`];

    if (selectedShortcut?.filter) {
      conditions.push(selectedShortcut.filter);
    }
    for (const filter of memoFilterStore.filters) {
      if (filter.factor === "contentSearch") {
        conditions.push(`content.contains("${filter.value}")`);
      } else if (filter.factor === "tagSearch") {
        conditions.push(`tag in ["${filter.value}"]`);
      } else if (filter.factor === "pinned") {
        conditions.push(`pinned`);
      } else if (filter.factor === "property.hasLink") {
        conditions.push(`has_link`);
      } else if (filter.factor === "property.hasTaskList") {
        conditions.push(`has_task_list`);
      } else if (filter.factor === "property.hasCode") {
        conditions.push(`has_code`);
      } else if (filter.factor === "displayTime") {
        const displayWithUpdateTime = workspaceStore.getWorkspaceSettingByKey(WorkspaceSetting_Key.MEMO_RELATED).memoRelatedSetting
          ?.displayWithUpdateTime;
        const factor = displayWithUpdateTime ? "updated_ts" : "created_ts";
        const filterDate = new Date(filter.value);
        const filterUtcTimestamp = filterDate.getTime() + filterDate.getTimezoneOffset() * 60 * 1000;
        const timestampAfter = filterUtcTimestamp / 1000;
        conditions.push(`${factor} >= ${timestampAfter} && ${factor} < ${timestampAfter + 60 * 60 * 24}`);
      }
    }
    return conditions.length > 0 ? conditions.join(" && ") : undefined;
  }, [user?.name, memoFilterStore.filters, selectedShortcut?.filter]);

  return (
    <div className="w-full h-full bg-background text-foreground flex flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tags */}
        {lg && !isDetailVisible && (
          <div className="flex-shrink-0 w-56 overflow-hidden">
            <TagsSidebar />
          </div>
        )}

        {/* Main Content */}
        <div className={`min-w-0 px-4 overflow-hidden ${isDetailVisible ? 'w-1/3' : 'flex-1'}`}>
          <div className="h-full flex flex-col">
            {/* Memo Editor */}
            {user && (
              <div className="mb-4">
                <MemoEditor cacheKey="note-memo-editor" />
              </div>
            )}
            
            {/* Memo List */}
            <div className="flex-1 overflow-y-auto">
              <PagedMemoList
                renderer={(memo: Memo) => <MemoView key={`${memo.name}-${memo.displayTime}`} memo={memo} showVisibility showPinned compact />}
                listSort={(memos: Memo[]) =>
                  memos
                    .filter((memo) => memo.state === State.NORMAL)
                    .filter((memo) => !hasIncompleteTasks(memo)) // 只过滤掉有未完成任务的笔记，已完成任务的笔记显示在主列表中
                    .sort((a, b) =>
                      viewStore.state.orderByTimeAsc
                        ? dayjs(a.displayTime).unix() - dayjs(b.displayTime).unix()
                        : dayjs(b.displayTime).unix() - dayjs(a.displayTime).unix(),
                    )
                }
                orderBy={viewStore.state.orderByTimeAsc ? "display_time asc" : "display_time desc"}
                filter={memoFilter}
              />
            </div>
          </div>
        </div>

        {/* Memo Detail Sidebar - Show when a memo is selected */}
        {md && isDetailVisible && selectedMemo && (
          <div className="w-2/3 pl-4 overflow-hidden border-l border-border">
            <div className="h-full flex flex-col">
              {/* Header with close button */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-lg font-semibold">笔记详情</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => memoDetailStore.clearSelectedMemo()}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Memo content */}
              <div className="flex-1 overflow-y-auto p-4">
                <MemoView memo={selectedMemo} showVisibility showPinned disableClick />
              </div>
              
              {/* Memo detail sidebar */}
              <div className="border-t border-border">
                <MemoDetailSidebar memo={selectedMemo} parentPage="/note" />
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
});

export default NotesView;