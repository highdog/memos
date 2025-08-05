import { CheckSquareIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { TodoSidebarProps } from "@/types/todo";
// import { useTranslate } from "@/utils/i18n";
import TodoSidebar from "./TodoSidebar";

interface TodoSidebarDrawerProps extends TodoSidebarProps {
  triggerClassName?: string;
}

const TodoSidebarDrawer = observer(({ className, associatedMemoId, triggerClassName }: TodoSidebarDrawerProps) => {
  // const t = useTranslate();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("flex items-center gap-2", triggerClassName)}>
          <CheckSquareIcon className="w-4 h-4" />
          <span className="text-sm">Todos</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-96">
        <SheetHeader className="pb-2">
          <SheetTitle>Todo List</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          <TodoSidebar className={cn("w-full h-full border-0", className)} associatedMemoId={associatedMemoId} />
        </div>
      </SheetContent>
    </Sheet>
  );
});

export default TodoSidebarDrawer;
