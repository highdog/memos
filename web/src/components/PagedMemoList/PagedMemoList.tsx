import { ArrowUpIcon, LoaderIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import { matchPath } from "react-router-dom";
import PullToRefresh from "react-simple-pull-to-refresh";
import { Button } from "@/components/ui/button";
import { DEFAULT_LIST_MEMOS_PAGE_SIZE } from "@/helpers/consts";
import useResponsiveWidth from "@/hooks/useResponsiveWidth";
import { Routes } from "@/router";
import { memoStore, viewStore } from "@/store";
import { State } from "@/types/proto/api/v1/common";
import { Memo } from "@/types/proto/api/v1/memo_service";
import { useTranslate } from "@/utils/i18n";
import { cn } from "@/lib/utils";
import Empty from "../Empty";
import MasonryView from "../MasonryView";
import MemoEditor from "../MemoEditor";

interface Props {
  renderer: (memo: Memo) => JSX.Element;
  listSort?: (list: Memo[]) => Memo[];
  state?: State;
  orderBy?: string;
  filter?: string;
  pageSize?: number;
}

const PagedMemoList = observer((props: Props) => {
  const t = useTranslate();
  const { md } = useResponsiveWidth();

  // Simplified state management - separate state variables for clarity
  const [isRequesting, setIsRequesting] = useState(false);
  const [nextPageToken, setNextPageToken] = useState("");
  const [isScrolling, setIsScrolling] = useState(false);

  // Ref to manage auto-fetch timeout to prevent memory leaks
  const autoFetchTimeoutRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Apply custom sorting if provided, otherwise use store memos directly
  const sortedMemoList = props.listSort ? props.listSort(memoStore.state.memos) : memoStore.state.memos;

  // Show memo editor only on the root route
  const showMemoEditor = Boolean(matchPath(Routes.ROOT, window.location.pathname));

  // Fetch more memos with pagination support
  const fetchMoreMemos = async (pageToken: string) => {
    setIsRequesting(true);

    try {
      const response = await memoStore.fetchMemos({
        state: props.state || State.NORMAL,
        orderBy: props.orderBy || "display_time desc",
        filter: props.filter,
        pageSize: props.pageSize || DEFAULT_LIST_MEMOS_PAGE_SIZE,
        pageToken,
      });

      setNextPageToken(response?.nextPageToken || "");
    } finally {
      setIsRequesting(false);
    }
  };

  // Helper function to check if container has enough content to be scrollable
  const isContainerScrollable = (container: HTMLElement) => {
    return container.scrollHeight > container.clientHeight + 100; // 100px buffer for safe measure
  };

  // Auto-fetch more content if container isn't scrollable and more data is available
  const checkAndFetchIfNeeded = useCallback(async () => {
    // Clear any pending auto-fetch timeout
    if (autoFetchTimeoutRef.current) {
      clearTimeout(autoFetchTimeoutRef.current);
    }

    // Wait for DOM to update before checking scrollability
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Find the scrollable container (the memo list container)
    const scrollContainer = document.querySelector('.flex-1.overflow-y-auto') as HTMLElement;
    
    // Only fetch if: container isn't scrollable, we have more data, not currently loading, and have memos
    const shouldFetch = scrollContainer && !isContainerScrollable(scrollContainer) && nextPageToken && !isRequesting && sortedMemoList.length > 0;

    if (shouldFetch) {
      await fetchMoreMemos(nextPageToken);

      // Schedule another check with delay to prevent rapid successive calls
      autoFetchTimeoutRef.current = window.setTimeout(() => {
        checkAndFetchIfNeeded();
      }, 500);
    }
  }, [nextPageToken, isRequesting, sortedMemoList.length]);

  // Refresh the entire memo list from the beginning
  const refreshList = async () => {
    memoStore.state.updateStateId();
    setNextPageToken("");
    await fetchMoreMemos("");
  };

  // Initial load and reload when props change
  useEffect(() => {
    refreshList();
  }, [props.state, props.orderBy, props.filter, props.pageSize]);

  // Auto-fetch more content when list changes and page isn't full
  useEffect(() => {
    if (!isRequesting && sortedMemoList.length > 0) {
      checkAndFetchIfNeeded();
    }
  }, [sortedMemoList.length, isRequesting, nextPageToken, checkAndFetchIfNeeded]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (autoFetchTimeoutRef.current) {
        clearTimeout(autoFetchTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Infinite scroll: fetch more when user scrolls near bottom of container
  useEffect(() => {
    if (!nextPageToken) return;

    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 300;
      if (nearBottom && !isRequesting) {
        fetchMoreMemos(nextPageToken);
      }
    };

    // Find the scrollable container (the memo list container)
    const scrollContainer = document.querySelector('.flex-1.overflow-y-auto') as HTMLElement;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [nextPageToken, isRequesting]);

  const children = (
    <div className="flex flex-col h-full w-full max-w-full">
      {/* Fixed memo editor at top */}
      {showMemoEditor && (
        <div className="flex-shrink-0 mb-2">
          <MemoEditor className="" cacheKey="home-memo-editor" />
        </div>
      )}
      
      {/* Scrollable memo list */}
      <div 
        className={cn(
          "flex-1 overflow-y-auto transition-all duration-300",
          isScrolling ? "scrollbar-auto" : "scrollbar-hide"
        )}
        onScroll={(e) => {
          setIsScrolling(true);
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }
          scrollTimeoutRef.current = window.setTimeout(() => {
            setIsScrolling(false);
          }, 1000);
        }}
      >
        <MasonryView
          memoList={sortedMemoList}
          renderer={props.renderer}
          listMode={viewStore.state.layout === "LIST"}
        />

        {/* Loading indicator */}
        {isRequesting && (
          <div className="w-full flex flex-row justify-center items-center my-4">
            <LoaderIcon className="animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state or back-to-top button */}
        {!isRequesting && (
          <>
            {!nextPageToken && sortedMemoList.length === 0 ? (
              <div className="w-full mt-12 mb-8 flex flex-col justify-center items-center italic">
                <Empty />
                <p className="mt-2 text-muted-foreground">{t("message.no-data")}</p>
              </div>
            ) : (
              <div className="w-full opacity-70 flex flex-row justify-center items-center my-4">
                <BackToTop />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (md) {
    return children;
  }

  return (
    <PullToRefresh
      onRefresh={() => refreshList()}
      pullingContent={
        <div className="w-full flex flex-row justify-center items-center my-4">
          <LoaderIcon className="opacity-60" />
        </div>
      }
      refreshingContent={
        <div className="w-full flex flex-row justify-center items-center my-4">
          <LoaderIcon className="animate-spin" />
        </div>
      }
    >
      {children}
    </PullToRefresh>
  );
});

const BackToTop = () => {
  const t = useTranslate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      const shouldShow = target.scrollTop > 400;
      setIsVisible(shouldShow);
    };

    // Find the scrollable container (the memo list container)
    const scrollContainer = document.querySelector('.flex-1.overflow-y-auto') as HTMLElement;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const scrollToTop = () => {
    const scrollContainer = document.querySelector('.flex-1.overflow-y-auto') as HTMLElement;
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <Button variant="ghost" onClick={scrollToTop}>
      {t("router.back-to-top")}
      <ArrowUpIcon className="ml-1 w-4 h-auto" />
    </Button>
  );
};

export default PagedMemoList;
