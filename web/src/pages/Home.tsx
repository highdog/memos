import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import MemoView from "@/components/MemoView";
import MemoDetailDialog from "@/components/MemoDetailDialog";
import MobileHeader from "@/components/MobileHeader";
import PagedMemoList from "@/components/PagedMemoList";
import { TagsSidebarDrawer } from "@/components/TagsSidebar";
import { TodoSidebar, TodoSidebarDrawer } from "@/components/Todo";

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

const Home = observer(() => {
  const user = useCurrentUser();
  const { md, lg } = useResponsiveWidth();
  const selectedShortcut = userStore.state.shortcuts.find((shortcut) => getShortcutId(shortcut.name) === memoFilterStore.shortcut);
  const { selectedMemo, isDetailVisible, initialEditMode } = memoDetailStore;

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
    console.log("conditions", conditions);
    return conditions.length > 0 ? conditions.join(" && ") : undefined;
  }, [memoFilterStore.filters, selectedShortcut?.filter]);

  return (
    <div className="w-full h-full bg-background text-foreground flex flex-col overflow-hidden">

      {/* Mobile Header */}
      {!md && (
        <MobileHeader className="mb-4 flex-shrink-0">
          <TagsSidebarDrawer />
          <TodoSidebarDrawer />
        </MobileHeader>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 min-w-0 px-4 overflow-hidden">
          <div className="h-full overflow-y-auto">
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

        {/* Right Sidebar - Todo only, show on medium screens and up */}
        {md && (
          <div className="flex-shrink-0 w-80 pl-4 overflow-hidden">
            <TodoSidebar />
          </div>
        )}
      </div>

      {/* Memo Detail Dialog */}
      <MemoDetailDialog
        open={isDetailVisible}
        onOpenChange={(open) => {
          if (!open) {
            memoDetailStore.clearSelectedMemo();
          }
        }}
        memo={selectedMemo}
        parentPage="/"
        initialEditMode={initialEditMode}
      />
    </div>
  );
});

export default Home;
