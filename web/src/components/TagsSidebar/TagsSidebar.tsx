import { observer } from "mobx-react-lite";
import { cn } from "@/lib/utils";
import SearchBar from "@/components/SearchBar";
import MemoFilters from "@/components/MemoFilters";
import TagsSection from "../HomeSidebar/TagsSection";

interface Props {
  className?: string;
}

const TagsSidebar = observer((props: Props) => {
  return (
    <aside
      className={cn(
        "relative w-full h-full overflow-auto flex flex-col justify-start items-start bg-background text-sidebar-foreground",
        props.className,
      )}
    >
      <div className="w-full px-4 py-6">
        <SearchBar />
        <MemoFilters />
        <TagsSection />
      </div>
    </aside>
  );
});

export default TagsSidebar;