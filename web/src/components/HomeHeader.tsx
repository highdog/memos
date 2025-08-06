import { SearchIcon, TagIcon, XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { memoFilterStore } from "@/store";
import { useTranslate } from "@/utils/i18n";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import TagsSection from "@/components/HomeSidebar/TagsSection";
import MemoDisplaySettingMenu from "./MemoDisplaySettingMenu";

const HomeHeader = observer(() => {
  const t = useTranslate();
  const [queryText, setQueryText] = useState("");
  const [isTagsOpen, setIsTagsOpen] = useState(false);

  const onTextChange = (event: React.FormEvent<HTMLInputElement>) => {
    setQueryText(event.currentTarget.value);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  const removeFilter = (filterToRemove: any) => {
    memoFilterStore.removeFilter((f: any) => f.factor === filterToRemove.factor && f.value === filterToRemove.value);
  };

  const searchFilters = memoFilterStore.filters.filter(f => f.factor === "contentSearch");
  const tagFilters = memoFilterStore.filters.filter(f => f.factor === "tagSearch");
  const hasActiveFilters = searchFilters.length > 0 || tagFilters.length > 0;

  return (
    <div className="mb-6 pt-4">
      {/* Top row: Search bar and Tags button */}
      <div className="flex items-center justify-between gap-4 mb-3">
        {/* Compact Search Bar */}
        <div className="relative w-64 flex-shrink-0">
          <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-40 text-muted-foreground" />
          <input
            className={cn(
              "w-full text-foreground leading-6 bg-background border border-border text-sm rounded-lg p-2 pl-8 pr-10 outline-0 focus:ring-2 focus:ring-primary focus:border-transparent"
            )}
            placeholder={t("memo.search-placeholder")}
            value={queryText}
            onChange={onTextChange}
            onKeyDown={onKeyDown}
          />
          <MemoDisplaySettingMenu className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Tags button */}
        <div className="flex-shrink-0">
          <Popover open={isTagsOpen} onOpenChange={setIsTagsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <TagIcon className="w-4 h-4" />
                <span>{t("common.tags")}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4">
                <TagsSection />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Bottom row: Active filters (search keywords and selected tags) */}
      {hasActiveFilters && (
        <div className="w-full mt-2 flex flex-row justify-start items-center flex-wrap gap-x-2 gap-y-1">
          {/* Search Keywords */}
           {searchFilters.map((filter, index) => (
             <div
               key={`search-${filter.value}-${index}`}
               className="w-auto leading-7 h-7 shrink-0 flex flex-row items-center gap-1 bg-background border pl-1.5 pr-1 rounded-md hover:line-through cursor-pointer"
               onClick={() => removeFilter(filter)}
             >
               <SearchIcon className="w-4 h-auto text-muted-foreground opacity-60" />
               <span className="text-muted-foreground text-sm max-w-32 truncate">{filter.value}</span>
               <button className="text-muted-foreground opacity-60 hover:opacity-100">
                 <XIcon className="w-4 h-auto" />
               </button>
             </div>
           ))}

           {/* Selected Tags */}
           {tagFilters.map((filter, index) => (
             <div
               key={`tag-${filter.value}-${index}`}
               className="w-auto leading-7 h-7 shrink-0 flex flex-row items-center gap-1 bg-background border pl-1.5 pr-1 rounded-md hover:line-through cursor-pointer"
               onClick={() => removeFilter(filter)}
             >
               <TagIcon className="w-4 h-auto text-muted-foreground opacity-60" />
               <span className="text-muted-foreground text-sm max-w-32 truncate">#{filter.value}</span>
               <button className="text-muted-foreground opacity-60 hover:opacity-100">
                 <XIcon className="w-4 h-auto" />
               </button>
             </div>
           ))}
        </div>
      )}
    </div>
  );
});

export default HomeHeader;