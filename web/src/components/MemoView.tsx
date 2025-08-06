import { BookmarkIcon, EyeOffIcon, MessageCircleMoreIcon, HashIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { memo, useCallback, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import useAsyncEffect from "@/hooks/useAsyncEffect";
import useCurrentUser from "@/hooks/useCurrentUser";
import useNavigateTo from "@/hooks/useNavigateTo";
import { cn } from "@/lib/utils";
import { memoStore, memoDetailStore, userStore, workspaceStore } from "@/store";
import memoFilterStore, { MemoFilter } from "@/store/memoFilter";
import { State } from "@/types/proto/api/v1/common";
import { Memo, MemoRelation_Type, Visibility } from "@/types/proto/api/v1/memo_service";
import { useTranslate } from "@/utils/i18n";
import { convertVisibilityToString } from "@/utils/memo";
import { isSuperUser } from "@/utils/user";
import MemoActionMenu from "./MemoActionMenu";
import MemoAttachmentListView from "./MemoAttachmentListView";
import MemoContent from "./MemoContent";
import MemoEditor from "./MemoEditor";
import MemoLocationView from "./MemoLocationView";
import MemoReactionistView from "./MemoReactionListView";
import MemoReferencesView from "./MemoReferencesView";

import PreviewImageDialog from "./PreviewImageDialog";
import ReactionSelector from "./ReactionSelector";
import UserAvatar from "./UserAvatar";
import VisibilityIcon from "./VisibilityIcon";

interface Props {
  memo: Memo;
  compact?: boolean;
  showCreator?: boolean;
  showVisibility?: boolean;
  showPinned?: boolean;
  showNsfwContent?: boolean;
  className?: string;
  parentPage?: string;
  disableClick?: boolean;
  onEdit?: () => void;
  onEditComplete?: () => void;
  inDialog?: boolean;
  forceEdit?: boolean;
}

const MemoView: React.FC<Props> = observer((props: Props) => {
  const { memo, className } = props;
  const t = useTranslate();
  const location = useLocation();
  const navigateTo = useNavigateTo();
  const currentUser = useCurrentUser();
  const user = useCurrentUser();
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [creator, setCreator] = useState(userStore.getUserByName(memo.creator));
  const [showNSFWContent, setShowNSFWContent] = useState(props.showNsfwContent);
  const [previewImage, setPreviewImage] = useState<{ open: boolean; urls: string[]; index: number }>({
    open: false,
    urls: [],
    index: 0,
  });
  const workspaceMemoRelatedSetting = workspaceStore.state.memoRelatedSetting;
  const commentAmount = memo.relations.filter(
    (relation) => relation.type === MemoRelation_Type.COMMENT && relation.relatedMemo?.name === memo.name,
  ).length;
  const relativeTimeFormat = Date.now() - memo.displayTime!.getTime() > 1000 * 60 * 60 * 24 ? "datetime" : "auto";
  const isArchived = memo.state === State.ARCHIVED;
  const readonly = memo.creator !== user?.name && !isSuperUser(user);
  const isInMemoDetailPage = location.pathname.startsWith(`/${memo.name}`);
  const parentPage = props.parentPage || location.pathname;
  const nsfw =
    workspaceMemoRelatedSetting.enableBlurNsfwContent &&
    memo.tags?.some((tag) => workspaceMemoRelatedSetting.nsfwTags.some((nsfwTag) => tag === nsfwTag || tag.startsWith(`${nsfwTag}/`)));

  // Initial related data: creator.
  useAsyncEffect(async () => {
    const user = await userStore.getOrFetchUserByName(memo.creator);
    setCreator(user);
  }, []);

  // 监听forceEdit属性，当为true时进入编辑模式
  useEffect(() => {
    if (props.forceEdit && !readonly) {
      setShowEditor(true);
    }
  }, [props.forceEdit, readonly]);

  const handleGotoMemoDetailPage = useCallback(() => {
    // 如果在主页或笔记页面，则在侧边栏显示详情
    if (location.pathname === "/" || location.pathname === "/note") {
      memoDetailStore.setSelectedMemo(memo);
    } else {
      // 其他页面保持原有跳转逻辑
      navigateTo(`/${memo.name}`, {
        state: {
          from: parentPage,
        },
      });
    }
  }, [memo, location.pathname, parentPage]);

  const handleMemoClick = useCallback(() => {
    // 如果禁用点击，则不处理
    if (props.disableClick) {
      return;
    }
    // 如果在主页或笔记页面，点击笔记内容区域时显示详情
    if (location.pathname === "/" || location.pathname === "/note") {
      memoDetailStore.setSelectedMemo(memo);
    }
  }, [memo, location.pathname, props.disableClick]);

  const handleMemoContentClick = useCallback(async (e: React.MouseEvent) => {
    const targetEl = e.target as HTMLElement;

    if (targetEl.tagName === "IMG") {
      const imgUrl = targetEl.getAttribute("src");
      if (imgUrl) {
        setPreviewImage({ open: true, urls: [imgUrl], index: 0 });
      }
    }
  }, []);

  const handleMemoContentDoubleClick = useCallback(async (e: React.MouseEvent) => {
    if (readonly) {
      return;
    }

    if (workspaceMemoRelatedSetting.enableDoubleClickEdit) {
      e.preventDefault();
      setShowEditor(true);
    }
  }, []);

  const onEditorConfirm = async (memoName: string) => {
    setShowEditor(false);
    userStore.setStatsStateId();
    
    // 如果当前笔记是在详情弹窗中显示的，则更新 memoDetailStore 中的数据
    if (memoDetailStore.selectedMemo && memoDetailStore.selectedMemo.name === memo.name) {
      try {
        const updatedMemo = await memoStore.getOrFetchMemoByName(memoName, { skipCache: true });
        memoDetailStore.updateSelectedMemo(updatedMemo);
      } catch (error) {
        console.error('Failed to refresh memo in detail store:', error);
      }
    }
    
    props.onEditComplete?.();
  };

  const onEditorCancel = useCallback(() => {
    setShowEditor(false);
    props.onEditComplete?.();
  }, [props.onEditComplete]);

  const handleTogglePinned = useCallback(async () => {
    await memoStore.updateMemo(
      {
        name: memo.name,
        pinned: !memo.pinned,
      },
      ["pinned"],
    );
  }, [memo.name, memo.pinned]);

  const handleTagClick = useCallback((tag: string) => {
    const isActive = memoFilterStore.getFiltersByFactor("tagSearch").some((filter: MemoFilter) => filter.value === tag);
    if (isActive) {
      memoFilterStore.removeFilter((f: MemoFilter) => f.factor === "tagSearch" && f.value === tag);
    } else {
      memoFilterStore.addFilter({
        factor: "tagSearch",
        value: tag,
      });
    }
  }, []);

  const displayTime = memo.displayTime?.toLocaleString();

  return showEditor ? (
    <MemoEditor
      autoFocus
      className="mb-2"
      cacheKey={`inline-memo-editor-${memo.name}`}
      memoName={memo.name}
      onConfirm={onEditorConfirm}
      onCancel={onEditorCancel}
    />
  ) : (
    <div
      className={cn(
        "group relative flex flex-col justify-start items-start bg-card w-full px-4 py-3 mb-2 gap-2 text-card-foreground rounded-lg border border-border transition-colors",
        !props.disableClick && "hover:bg-accent/50",
        className,
      )}
    >
      <div className="w-full flex flex-row justify-between items-center gap-2">
        <div 
          className={cn(
            "w-auto max-w-[calc(100%-8rem)] grow flex flex-row justify-start items-center",
            !props.disableClick && "cursor-pointer"
          )}
          onClick={!props.disableClick ? handleMemoClick : undefined}
        >
          {props.showCreator && creator ? (
            <div className="w-full flex flex-row justify-start items-center">
              <Link
                className="w-auto hover:opacity-80 rounded-md transition-colors"
                to={`/u/${encodeURIComponent(creator.username)}`}
                viewTransition
              >
                <UserAvatar className="mr-2 shrink-0" avatarUrl={creator.avatarUrl} />
              </Link>
              <div className="w-full flex flex-col justify-center items-start">
                <Link
                  className="block leading-tight hover:opacity-80 rounded-md transition-colors truncate text-muted-foreground"
                  to={`/u/${encodeURIComponent(creator.username)}`}
                  viewTransition
                >
                  {creator.displayName || creator.username}
                </Link>
                <div
                  className="w-auto -mt-0.5 text-xs leading-tight text-muted-foreground select-none cursor-pointer hover:opacity-80 transition-colors"
                  onClick={handleGotoMemoDetailPage}
                >
                  {displayTime}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="w-full text-sm leading-tight text-muted-foreground select-none cursor-pointer hover:text-foreground transition-colors"
              onClick={handleGotoMemoDetailPage}
            >
              {displayTime}
            </div>
          )}
        </div>
        <div className="flex flex-row justify-end items-center select-none shrink-0 gap-2">
          <div className="w-auto invisible group-hover:visible flex flex-row justify-between items-center gap-2">
            {props.showVisibility && memo.visibility !== Visibility.PRIVATE && (
              <Tooltip>
                <TooltipTrigger>
                  <span className="flex justify-center items-center rounded-md p-1 hover:opacity-80">
                    <VisibilityIcon visibility={memo.visibility} />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t(`memo.visibility.${convertVisibilityToString(memo.visibility).toLowerCase()}` as any)}</TooltipContent>
              </Tooltip>
            )}
            {currentUser && !isArchived && <ReactionSelector className="border-none w-auto h-auto" memo={memo} />}
          </div>
          {!isInMemoDetailPage && commentAmount > 0 && (
            <Link
              className={cn(
                "flex flex-row justify-start items-center rounded-md p-1 hover:opacity-80",
                commentAmount === 0 && "invisible group-hover:visible",
              )}
              to={`/${memo.name}#comments`}
              viewTransition
              state={{
                from: parentPage,
              }}
            >
              <MessageCircleMoreIcon className="w-4 h-4 mx-auto text-muted-foreground" />
              {commentAmount > 0 && <span className="text-xs text-muted-foreground">{commentAmount}</span>}
            </Link>
          )}
          {props.showPinned && memo.pinned && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-pointer">
                    <BookmarkIcon className="w-4 h-auto text-primary" onClick={handleTogglePinned} />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("common.unpin")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {nsfw && showNSFWContent && (
            <span className="cursor-pointer">
              <EyeOffIcon className="w-4 h-auto text-primary" onClick={() => setShowNSFWContent(false)} />
            </span>
          )}
          {memo.tags && memo.tags.length > 0 && (
            <div className="flex flex-row gap-1 items-center">
              {memo.tags.map((tag) => {
                const isActive = memoFilterStore.getFiltersByFactor("tagSearch").some((filter: MemoFilter) => filter.value === tag);
                return (
                  <span
                    key={tag}
                    className={cn(
                      "inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-pointer transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                    onClick={() => handleTagClick(tag)}
                  >
                    <HashIcon className="w-3 h-3 mr-0.5" />
                    {tag}
                  </span>
                );
              })}
            </div>
          )}
          <MemoActionMenu 
            memo={memo} 
            readonly={readonly} 
            onEdit={() => {
              if (props.inDialog && props.onEdit) {
                // 在弹框中且有外部编辑回调，使用外部回调
                props.onEdit();
              } else {
                // 其他情况都直接原地编辑
                setShowEditor(true);
              }
            }} 
          />
        </div>
      </div>
      <div
        className={cn(
          "w-full flex flex-col justify-start items-start gap-2",
          nsfw && !showNSFWContent && "blur-lg transition-all duration-200",
          !props.disableClick && "cursor-pointer",
        )}
        onClick={!props.disableClick ? handleMemoClick : undefined}
      >
        <MemoContent
          key={`${memo.name}-${memo.updateTime}`}
          memoName={memo.name}
          nodes={memo.nodes}
          readonly={readonly}
          hideTags={true}
          onClick={handleMemoContentClick}
          onDoubleClick={handleMemoContentDoubleClick}
          compact={memo.pinned ? false : props.compact} // Always show full content when pinned.
          parentPage={parentPage}
        />
        {memo.location && <MemoLocationView location={memo.location} />}
        <MemoAttachmentListView attachments={memo.attachments} />
        <MemoReactionistView memo={memo} reactions={memo.reactions} />
        <MemoReferencesView memo={memo} />
      </div>
      {nsfw && !showNSFWContent && (
        <>
          <div className="absolute inset-0 bg-transparent" />
          <button
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 py-2 px-4 text-sm text-muted-foreground hover:text-foreground hover:bg-accent hover:border-accent border border-border rounded-lg bg-card transition-colors"
            onClick={() => setShowNSFWContent(true)}
          >
            {t("memo.click-to-show-nsfw-content")}
          </button>
        </>
      )}

      <PreviewImageDialog
        open={previewImage.open}
        onOpenChange={(open) => setPreviewImage((prev) => ({ ...prev, open }))}
        imgUrls={previewImage.urls}
        initialIndex={previewImage.index}
      />
    </div>
  );
});

export default memo(MemoView);
