import dayjs from "dayjs";
import { CalendarIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState, useCallback } from "react";
import { useStatisticsData } from "@/hooks/useStatisticsData";
import memoFilterStore from "@/store/memoFilter";
import { useTranslate } from "@/utils/i18n";
import ActivityCalendar from "../ActivityCalendar";
import { MonthNavigator } from "./MonthNavigator";

const StatisticsView = observer(() => {
  const t = useTranslate();
  const { activityStats } = useStatisticsData();
  const [selectedDate] = useState(new Date());
  const [visibleMonthString, setVisibleMonthString] = useState(dayjs().format("YYYY-MM"));

  const handleCalendarClick = useCallback((date: string) => {
    memoFilterStore.removeFilter((f) => f.factor === "displayTime");
    memoFilterStore.addFilter({ factor: "displayTime", value: date });
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
        <div className="flex flex-row justify-start items-center w-full gap-1 mb-2 text-sm leading-6 text-muted-foreground select-none">
          <CalendarIcon className="w-4 h-auto mr-1" />
          <span>日程</span>
        </div>
        <div className="w-full bg-muted/30 rounded-lg p-3 min-h-[80px]">
          <div className="text-center text-sm text-muted-foreground">
            暂无日程安排
          </div>
        </div>
      </div>
    </div>
  );
});

export default StatisticsView;
