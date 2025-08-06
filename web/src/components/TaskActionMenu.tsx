import copy from "copy-to-clipboard";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  BookmarkMinusIcon,
  BookmarkPlusIcon,
  CopyIcon,
  Edit3Icon,
  MoreVerticalIcon,
  TrashIcon,
  SquareCheckIcon,
  ExternalLinkIcon,
  FlagIcon,
  ChevronRightIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { markdownServiceClient } from "@/grpcweb";
import { memoStore, userStore } from "@/store";
import { workspaceStore } from "@/store";
import memoDetailStore from "@/store/memoDetail";
import { State } from "@/types/proto/api/v1/common";
import { NodeType } from "@/types/proto/api/v1/markdown_service";
import { Memo } from "@/types/proto/api/v1/memo_service";
import { useTranslate } from "@/utils/i18n";
import { Priority, getPriorityFromMemo, getPriorityText, getPriorityColor } from "@/utils/priority";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "./ui/dropdown-menu";

interface Props {
  memo: Memo;
  readonly?: boolean;
  className?: string;
  onEdit?: () => void;
}

const checkHasCompletedTaskList = (memo: Memo) => {
  for (const node of memo.nodes) {
    if (node.type === NodeType.LIST && node.listNode?.children && node.listNode?.children?.length > 0) {
      for (let j = 0; j < node.listNode.children.length; j++) {
        if (node.listNode.children[j].type === NodeType.TASK_LIST_ITEM && node.listNode.children[j].taskListItemNode?.complete) {
          return true;
        }
      }
    }
  }
  return false;
};



// 设置笔记优先级
const setPriorityToMemo = async (memo: Memo, priority: Priority) => {
  let content = memo.content;
  
  // 获取优先级标记
  const priorityMark = priority === 'high' ? '!!!' : 
                      priority === 'medium' ? '!!' : 
                      priority === 'low' ? '!' : '';
  
  // 处理每一行，更新任务行的优先级
  const lines = content.split('\n');
  const updatedLines = lines.map(line => {
    const trimmedLine = line.trim();
    
    // 如果是任务行
    if (trimmedLine.match(/^-\s*\[[x\s]\]/)) {
      // 移除现有的优先级标记
      let cleanLine = trimmedLine.replace(/^(-\s*\[[x\s]\]\s*)!!!|^(-\s*\[[x\s]\]\s*)!!|^(-\s*\[[x\s]\]\s*)!/, '$1$2$3');
      
      // 添加新的优先级标记
      if (priorityMark) {
        cleanLine = cleanLine.replace(/^(-\s*\[[x\s]\]\s*)/, `$1${priorityMark}`);
      }
      
      return cleanLine;
    }
    
    return line;
  });
  
  const updatedContent = updatedLines.join('\n');
  
  try {
    await memoStore.updateMemo(
      {
        name: memo.name,
        content: updatedContent,
      },
      ["content"],
    );
    toast.success('优先级已更新');
  } catch (error: any) {
    toast.error('更新优先级失败: ' + error.details);
    console.error(error);
  }
};

const TaskActionMenu = observer((props: Props) => {
  const { memo, readonly } = props;
  const t = useTranslate();
  const navigate = useNavigate();
  const hasCompletedTaskList = checkHasCompletedTaskList(memo);
  const isArchived = memo.state === State.ARCHIVED;
  const currentPriority = getPriorityFromMemo(memo);

  const memoUpdatedCallback = () => {
    // Refresh user stats.
    userStore.setStatsStateId();
  };

  const handleSetPriority = async (e: React.MouseEvent, priority: Priority) => {
    e.stopPropagation();
    await setPriorityToMemo(memo, priority);
    memoUpdatedCallback();
  };

  const handleTogglePinMemoBtnClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (memo.pinned) {
        await memoStore.updateMemo(
          {
            name: memo.name,
            pinned: false,
          },
          ["pinned"],
        );
      } else {
        await memoStore.updateMemo(
          {
            name: memo.name,
            pinned: true,
          },
          ["pinned"],
        );
      }
    } catch {
      // do nth
    }
  };

  const handleEditMemoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 总是调用 onEdit 回调，让父组件决定编辑行为
    if (props.onEdit) {
      props.onEdit();
    }
  };

  const handleViewMemoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 在新标签页中打开笔记详情
    window.open(`/${memo.name}`, '_blank');
  };

  const handleToggleMemoStatusClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const state = memo.state === State.ARCHIVED ? State.NORMAL : State.ARCHIVED;
    const message = memo.state === State.ARCHIVED ? t("message.restored-successfully") : t("message.archived-successfully");
    try {
      await memoStore.updateMemo(
        {
          name: memo.name,
          state,
        },
        ["state"],
      );
      toast(message);
    } catch (error: any) {
      toast.error(error.details);
      console.error(error);
      return;
    }

    memoUpdatedCallback();
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    let host = workspaceStore.state.profile.instanceUrl;
    if (host === "") {
      host = window.location.origin;
    }
    copy(`${host}/${memo.name}`);
    toast.success(t("message.succeed-copy-link"));
  };

  const handleDeleteMemoClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(t("memo.delete-confirm"));
    if (confirmed) {
      await memoStore.deleteMemo(memo.name);
      
      // 如果删除的是当前显示的笔记详情，清除笔记详情状态
      if (memoDetailStore.selectedMemo?.name === memo.name) {
        memoDetailStore.clearSelectedMemo();
      }
      
      toast.success(t("message.deleted-successfully"));
      memoUpdatedCallback();
    }
  };

  const handleRemoveCompletedTaskListItemsClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(t("memo.remove-completed-task-list-items-confirm"));
    if (confirmed) {
      const newNodes = JSON.parse(JSON.stringify(memo.nodes));
      for (const node of newNodes) {
        if (node.type === NodeType.LIST && node.listNode?.children?.length > 0) {
          const children = node.listNode.children;
          for (let i = 0; i < children.length; i++) {
            if (children[i].type === NodeType.TASK_LIST_ITEM && children[i].taskListItemNode?.complete) {
              // Remove completed taskList item and next line breaks
              children.splice(i, 1);
              if (children[i]?.type === NodeType.LINE_BREAK) {
                children.splice(i, 1);
              }
              i--;
            }
          }
        }
      }
      const { markdown } = await markdownServiceClient.restoreMarkdownNodes({ nodes: newNodes });
      await memoStore.updateMemo(
        {
          name: memo.name,
          content: markdown,
        },
        ["content"],
      );
      toast.success(t("message.remove-completed-task-list-items-successfully"));
      memoUpdatedCallback();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVerticalIcon className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={2}>
        <DropdownMenuItem onClick={handleViewMemoClick}>
          <ExternalLinkIcon className="w-4 h-auto" />
          查看详情
        </DropdownMenuItem>
        
        {!readonly && !isArchived && (
          <>
            <DropdownMenuItem onClick={handleTogglePinMemoBtnClick}>
              {memo.pinned ? <BookmarkMinusIcon className="w-4 h-auto" /> : <BookmarkPlusIcon className="w-4 h-auto" />}
              {memo.pinned ? t("common.unpin") : t("common.pin")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEditMemoClick}>
              <Edit3Icon className="w-4 h-auto" />
              {t("common.edit")}
            </DropdownMenuItem>
            
            {/* 优先级子菜单 */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FlagIcon className="w-4 h-auto" />
                <span>设置优先级</span>
                <span className="ml-auto text-xs text-muted-foreground">
                   {getPriorityText(currentPriority)}
                 </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={(e) => handleSetPriority(e, 'high')}>
                   <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${getPriorityColor('high')}`}></div>
                     <span>高优先级</span>
                     {currentPriority === 'high' && <span className="ml-auto">✓</span>}
                   </div>
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={(e) => handleSetPriority(e, 'medium')}>
                   <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${getPriorityColor('medium')}`}></div>
                     <span>中优先级</span>
                     {currentPriority === 'medium' && <span className="ml-auto">✓</span>}
                   </div>
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={(e) => handleSetPriority(e, 'low')}>
                   <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${getPriorityColor('low')}`}></div>
                     <span>低优先级</span>
                     {currentPriority === 'low' && <span className="ml-auto">✓</span>}
                   </div>
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={(e) => handleSetPriority(e, null)}>
                   <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${getPriorityColor(null)}`}></div>
                     <span>无优先级</span>
                     {currentPriority === null && <span className="ml-auto">✓</span>}
                   </div>
                 </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
        
        {!isArchived && (
          <DropdownMenuItem onClick={handleCopyLink}>
            <CopyIcon className="w-4 h-auto" />
            {t("memo.copy-link")}
          </DropdownMenuItem>
        )}
        
        {!readonly && (
          <>
            {!isArchived && hasCompletedTaskList && (
              <DropdownMenuItem onClick={handleRemoveCompletedTaskListItemsClick}>
                <SquareCheckIcon className="w-4 h-auto" />
                {t("memo.remove-completed-task-list-items")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleToggleMemoStatusClick}>
              {isArchived ? <ArchiveRestoreIcon className="w-4 h-auto" /> : <ArchiveIcon className="w-4 h-auto" />}
              {isArchived ? t("common.restore") : t("common.archive")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDeleteMemoClick}>
              <TrashIcon className="w-4 h-auto" />
              {t("common.delete")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
      </DropdownMenu>
  );
});

export default TaskActionMenu;