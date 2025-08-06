import { last } from "lodash-es";
import { observer } from "mobx-react-lite";
import { matchPath, Outlet, useLocation } from "react-router-dom";
import { useDebounce } from "react-use";
import { HomeSidebar, HomeSidebarDrawer } from "@/components/HomeSidebar";
import MobileHeader from "@/components/MobileHeader";
import useCurrentUser from "@/hooks/useCurrentUser";
import useResponsiveWidth from "@/hooks/useResponsiveWidth";
import { cn } from "@/lib/utils";
import { Routes } from "@/router";
import { memoStore, memoDetailStore, userStore } from "@/store";

const HomeLayout = observer(() => {
  const { md, lg } = useResponsiveWidth();
  const currentUser = useCurrentUser();
  const location = useLocation();
  const { isDetailVisible } = memoDetailStore;
  
  // 左侧边栏始终显示，不因为笔记详情而隐藏
  const shouldHideSidebar = false;

  useDebounce(
    async () => {
      let parent: string | undefined = undefined;
      if (location.pathname === Routes.ROOT && currentUser) {
        parent = currentUser.name;
      }
      if (matchPath("/u/:username", location.pathname) !== null) {
        const username = last(location.pathname.split("/"));
        const user = await userStore.getOrFetchUserByUsername(username || "");
        parent = user.name;
      }
      await userStore.fetchUserStats(parent);
    },
    300,
    [memoStore.state.memos.length, userStore.state.statsStateId, location.pathname],
  );

  return (
    <section className="@container w-full h-full flex flex-col justify-start items-center overflow-hidden">
      {!md && !shouldHideSidebar && (
        <MobileHeader>
          <HomeSidebarDrawer />
        </MobileHeader>
      )}
      {md && !shouldHideSidebar && (
        <div className={cn("fixed top-0 left-16 shrink-0 h-svh transition-all", "border-r border-border", lg ? "w-72" : "w-56")}>
          <HomeSidebar className={cn("px-3 py-6")} />
        </div>
      )}
      <div className={cn("w-full h-full flex flex-col", !shouldHideSidebar && (lg ? "pl-72" : md ? "pl-56" : ""))}>
        <div className={cn("w-full h-full mx-auto px-4 sm:px-6 md:pt-6 pb-8 overflow-hidden")}>
          <Outlet />
        </div>
      </div>
    </section>
  );
});

export default HomeLayout;
