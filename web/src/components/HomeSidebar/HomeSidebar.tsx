import { observer } from "mobx-react-lite";
import useCurrentUser from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import SearchBar from "@/components/SearchBar";
import MemoFilters from "@/components/MemoFilters";
import StatisticsView from "../StatisticsView";
import ShortcutsSection from "./ShortcutsSection";
import TagsSection from "./TagsSection";

interface Props {
  className?: string;
}

const HomeSidebar = observer((props: Props) => {
  const currentUser = useCurrentUser();

  return (
    <aside
      className={cn(
        "relative w-full h-full overflow-auto flex flex-col justify-start items-start bg-background text-sidebar-foreground",
        props.className,
      )}
    >
      <div className="mt-1 px-1 w-full">
        <StatisticsView />
        <div className="px-3 py-4">
          <SearchBar />
          <MemoFilters />
        </div>
        <TagsSection />
        {currentUser && <ShortcutsSection />}
      </div>
    </aside>
  );
});

export default HomeSidebar;
