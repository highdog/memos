import dayjs from "dayjs";
import { CalendarIcon, PlusIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState, useCallback } from "react";
import { useStatisticsData } from "@/hooks/useStatisticsData";
import memoFilterStore from "@/store/memoFilter";
import { memoDetailStore } from "@/store";
import { useTranslate } from "@/utils/i18n";
import { ScheduleItem } from "@/utils/schedule";
import ActivityCalendar from "../ActivityCalendar";
import AddScheduleDialog from "../AddScheduleDialog";
import ScheduleList from "../ScheduleList";
import { Button } from "../ui/button";
import { MonthNavigator } from "./MonthNavigator";

const StatisticsView = observer(() => {
  const t = useTranslate();
  const { activityStats } = useStatisticsData();
  const [selectedDate] = useState(new Date());
  const [visibleMonthString, setVisibleMonthString] = useState(dayjs().format("YYYY-MM"));
  const [isAddScheduleDialogOpen, setIsAddScheduleDialogOpen] = useState(false);

  const handleCalendarClick = useCallback((date: string) => {
    memoFilterStore.removeFilter((f) => f.factor === "displayTime");
    memoFilterStore.addFilter({ factor: "displayTime", value: date });
  }, []);

  const handleScheduleClick = useCallback((schedule: ScheduleItem) => {
    // 打开笔记详情
    memoDetailStore.setSelectedMemo(schedule.memo);
  }, []);

  const handleAddScheduleClick = useCallback(() => {
    setIsAddScheduleDialogOpen(true);
  }, []);

  const handleAddScheduleSuccess = useCallback(() => {
    // 日程添加成功后可以刷新数据或显示提示
  }, []);

  return (
    <div className="group w-full mt-2 space-y-1 text-muted-foreground animate-fade-in">
      <MonthNavigator visibleMonth={visibleMonthString} onMonthChange={setVisibleMonthString} />

      <div className="w-full animate-scale-in">
        <ActivityCalendar
          month={visibleMonthString}
          selectedDate={selectedDate.toDateString()}
          data={activityStats}
          onClick={handleCalendarClick}
        />
      </div>

      {/* 日程显示区域 */}
      <div className="pt-3 w-full">
        <div className="flex flex-row justify-between items-center w-full gap-1 mb-2 text-sm leading-6 text-muted-foreground select-none">
          <div className="flex flex-row justify-start items-center gap-1">
            <CalendarIcon className="w-4 h-auto mr-1" />
            <span>日程</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted/50"
            onClick={handleAddScheduleClick}
          >
            <PlusIcon className="w-4 h-4" />
          </Button>
        </div>
        <ScheduleList onScheduleClick={handleScheduleClick} />
      </div>

      {/* 添加日程对话框 */}
      <AddScheduleDialog
        open={isAddScheduleDialogOpen}
        onOpenChange={setIsAddScheduleDialogOpen}
        onSuccess={handleAddScheduleSuccess}
      />
    </div>
  );
});

export default StatisticsView;
