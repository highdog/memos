import { SearchIcon, TagsIcon, ChevronDownIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { memoFilterStore, userStore } from "@/store";
import { useTranslate } from "@/utils/i18n";
import { MemoFilter } from "@/store/memoFilter";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";

const MemoEditorHeader = observer(() => {
  const t = useTranslate();
  const [queryText, setQueryText] = useState("");
  const [isTagsPopoverOpen, setIsTagsPopoverOpen] = useState(false);

  // 获取所有标签并按使用频率排序
  const allTags = Object.entries(userStore.state.tagCount)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .sort((a, b) => b[1] - a[1]);

  // 只显示前5个最常用的标签
  const topTags = allTags.slice(0, 5);
  const remainingTags = allTags.slice(5);

  const onSearchTextChange = (event: React.FormEvent<HTMLInputElement>) => {
    setQueryText(event.currentTarget.value);
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmedText = queryText.trim();
      if (trimmedText !== "") {
        const words = trimmedText.split(/\s+/);
        words.forEach((word) => {
          memoFilterStore.addFilter({
            factor: "contentSearch",
            value: word,
          });
        });
        setQueryText("");
      }
    }
  };

  const handleTagClick = (tag: string) => {
    const isActive = memoFilterStore.getFiltersByFactor("tagSearch").some((filter: MemoFilter) => filter.value === tag);
    
    if (isActive) {
      // 如果标签已经激活，移除过滤器
      memoFilterStore.removeFilter((f: MemoFilter) => f.factor === "tagSearch" && f.value === tag);
    } else {
      // 如果标签未激活，添加过滤器
      memoFilterStore.addFilter({
        factor: "tagSearch",
        value: tag,
      });
    }
  };

  const isTagActive = (tag: string) => {
    return memoFilterStore.getFiltersByFactor("tagSearch").some((filter: MemoFilter) => filter.value === tag);
  };

  return (
    <div className="w-full flex flex-row justify-between items-center mb-3 gap-4">
      {/* 左侧：搜索框 */}
      <div className="flex-1 max-w-md">
        <div className="relative w-full h-auto flex flex-row justify-start items-center">
          <SearchIcon className="absolute left-2 w-4 h-auto opacity-40 text-muted-foreground" />
          <input
            className={cn(
              "w-full text-foreground leading-6 bg-background border border-border text-sm rounded-lg p-2 pl-8 outline-0",
              "focus:ring-2 focus:ring-primary/20 focus:border-primary"
            )}
            placeholder={t("memo.search-placeholder")}
            value={queryText}
            onChange={onSearchTextChange}
            onKeyDown={onSearchKeyDown}
          />
        </div>
      </div>

      {/* 右侧：标签区域 */}
      <div className="flex flex-row items-center gap-2">
        {/* 显示最常用的标签 */}
        <div className="flex flex-row items-center gap-1">
          {topTags.map(([tag, count]) => (
            <Button
              key={tag}
              variant={isTagActive(tag) ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-7 px-2 text-xs",
                isTagActive(tag) 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-background hover:bg-muted"
              )}
              onClick={() => handleTagClick(tag)}
            >
              #{tag}
              {count > 1 && <span className="ml-1 opacity-60">({count})</span>}
            </Button>
          ))}
        </div>

        {/* 更多标签按钮 */}
        {remainingTags.length > 0 && (
          <Popover open={isTagsPopoverOpen} onOpenChange={setIsTagsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs bg-background hover:bg-muted"
              >
                <TagsIcon className="w-3 h-3 mr-1" />
                更多
                <ChevronDownIcon className="w-3 h-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-2">
              <div className="max-h-48 overflow-y-auto">
                <div className="text-xs font-medium text-muted-foreground mb-2">所有标签</div>
                <div className="flex flex-wrap gap-1">
                  {allTags.map(([tag, count]) => (
                    <Button
                      key={tag}
                      variant={isTagActive(tag) ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-6 px-2 text-xs",
                        isTagActive(tag) 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-background hover:bg-muted"
                      )}
                      onClick={() => {
                        handleTagClick(tag);
                        setIsTagsPopoverOpen(false);
                      }}
                    >
                      #{tag}
                      {count > 1 && <span className="ml-1 opacity-60">({count})</span>}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
});

export default MemoEditorHeader;