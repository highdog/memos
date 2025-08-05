import { observer } from "mobx-react-lite";
import { Outlet } from "react-router-dom";
import MobileHeader from "@/components/MobileHeader";
import useResponsiveWidth from "@/hooks/useResponsiveWidth";
import { cn } from "@/lib/utils";

const NotesLayout = observer(() => {
  const { md } = useResponsiveWidth();

  return (
    <section className="@container w-full h-full flex flex-col justify-start items-center overflow-hidden">
      {!md && (
        <MobileHeader>
          <div className="flex items-center">
            <span className="text-lg font-semibold">笔记</span>
          </div>
        </MobileHeader>
      )}
      <div className="w-full h-full flex flex-col">
        <div className={cn("w-full h-full mx-auto px-4 sm:px-6 md:pt-6 pb-8 overflow-hidden")}>
          <Outlet />
        </div>
      </div>
    </section>
  );
});

export default NotesLayout;