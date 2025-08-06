import dayjs from "dayjs";
import { ClockIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { memoStore } from "@/store";
import { ScheduleItem, extractSchedulesFromMemos, getTodaySchedules, getUpcomingSchedules } from "@/utils/schedule";

interface Props {
  className?: string;
  onScheduleClick?: (schedule: ScheduleItem) => void;
}

const ScheduleList = observer((props: Props) => {
  const { className, onScheduleClick } = props;

  // 从所有笔记中提取日程信息
  const allSchedules = useMemo(() => {
    return extractSchedulesFromMemos(memoStore.state.memos);
  }, [memoStore.state.stateId]);

  // 获取今天的日程
  const todaySchedules = useMemo(() => {
    return getTodaySchedules(allSchedules);
  }, [allSchedules]);

  // 获取即将到来的日程
  const upcomingSchedules = useMemo(() => {
    return getUpcomingSchedules(allSchedules);
  }, [allSchedules]);

  // 合并今天和即将到来的日程，去重
  const displaySchedules = useMemo(() => {
    const scheduleMap = new Map<string, ScheduleItem>();
    
    // 添加今天的日程
    todaySchedules.forEach(schedule => {
      scheduleMap.set(schedule.id, schedule);
    });
    
    // 添加即将到来的日程
    upcomingSchedules.forEach(schedule => {
      scheduleMap.set(schedule.id, schedule);
    });
    
    return Array.from(scheduleMap.values()).sort((a, b) => 
      dayjs(a.datetime).valueOf() - dayjs(b.datetime).valueOf()
    );
  }, [todaySchedules, upcomingSchedules]);

  const handleScheduleClick = (schedule: ScheduleItem) => {
    if (onScheduleClick) {
      onScheduleClick(schedule);
    }
  };

  const formatScheduleTime = (datetime: string) => {
    const scheduleTime = dayjs(datetime);
    const now = dayjs();
    
    if (scheduleTime.isSame(now, 'day')) {
      return `今天 ${scheduleTime.format('HH:mm')}`;
    } else if (scheduleTime.isSame(now.add(1, 'day'), 'day')) {
      return `明天 ${scheduleTime.format('HH:mm')}`;
    } else if (scheduleTime.isSame(now, 'year')) {
      return scheduleTime.format('MM/DD HH:mm');
    } else {
      return scheduleTime.format('YYYY/MM/DD HH:mm');
    }
  };

  const getScheduleStatus = (datetime: string) => {
    const scheduleTime = dayjs(datetime);
    const now = dayjs();
    
    if (scheduleTime.isBefore(now)) {
      return 'past';
    } else if (scheduleTime.isSame(now, 'day')) {
      return 'today';
    } else {
      return 'upcoming';
    }
  };

  if (displaySchedules.length === 0) {
    return (
      <div className={cn("w-full bg-muted/30 rounded-lg p-3 min-h-[80px]", className)}>
        <div className="text-center text-sm text-muted-foreground">
          暂无日程安排
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full bg-muted/30 rounded-lg p-3 space-y-2", className)}>
      {displaySchedules.map((schedule) => {
        const status = getScheduleStatus(schedule.datetime);
        return (
          <div
            key={schedule.id}
            className={cn(
              "flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors",
              "hover:bg-muted/50",
              status === 'past' && "opacity-60",
              status === 'today' && "bg-primary/10 border border-primary/20",
            )}
            onClick={() => handleScheduleClick(schedule)}
          >
            <div className={cn(
              "flex-shrink-0 w-2 h-2 rounded-full",
              status === 'past' && "bg-muted-foreground",
              status === 'today' && "bg-primary",
              status === 'upcoming' && "bg-blue-500",
            )} />
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {schedule.title}
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <ClockIcon className="w-3 h-3" />
                <span>{formatScheduleTime(schedule.datetime)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default ScheduleList;