import useResponsiveWidth from "@/hooks/useResponsiveWidth";
import { cn } from "@/lib/utils";
import NavigationDrawer from "./NavigationDrawer";

interface Props {
  className?: string;
  children?: React.ReactNode;
}

const MobileHeader = (props: Props) => {
  const { className, children } = props;
  const { sm } = useResponsiveWidth();

  return (
    <div
      className={cn(
        "pt-3 pb-2 sm:pt-2 px-4 sm:px-6 sm:mb-1 bg-background border-b border-border flex md:hidden flex-row justify-between items-center w-full h-auto flex-nowrap shrink-0 z-1",
        className,
      )}
    >
      <div className="flex flex-row justify-start items-center mr-2 shrink-0 overflow-hidden">{!sm && <NavigationDrawer />}</div>
      <div className="flex flex-row justify-end items-center">{children}</div>
    </div>
  );
};

export default MobileHeader;
