import dayjs from "dayjs";
import { Memo } from "@/types/proto/api/v1/memo_service";

export interface ScheduleItem {
  id: string;
  title: string;
  datetime: string;
  memo: Memo;
}

/**
 * 检查笔记是否包含日程标记
 */
export const isScheduleMemo = (memo: Memo): boolean => {
  return memo.content.includes('-{}') || memo.content.includes('{}');
};

/**
 * 从笔记内容中提取日期时间
 * 支持格式：YYYY/MM/DD HH:mm:ss 或 YYYY/MM/DD HH:mm
 */
export const extractDateTime = (content: string): string | null => {
  // 匹配日期时间格式：2025/08/06 09:30:00 或 2025/08/06 09:30
  const dateTimeRegex = /(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}(?::\d{2})?)/;
  const match = content.match(dateTimeRegex);
  
  if (match) {
    const dateTimeStr = match[1];
    // 如果没有秒数，添加 :00
    const normalizedDateTime = dateTimeStr.includes(':') && dateTimeStr.split(':').length === 2 
      ? `${dateTimeStr}:00` 
      : dateTimeStr;
    
    // 验证日期是否有效
    const parsed = dayjs(normalizedDateTime, 'YYYY/MM/DD HH:mm:ss');
    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD HH:mm:ss');
    }
  }
  
  return null;
};

/**
 * 从笔记内容中提取日程标题
 */
export const extractScheduleTitle = (content: string): string => {
  // 移除日程标记 -{} 或 {} 和日期时间，获取剩余的文本作为标题
  let title = content.replace(/-?\{\}\s*/, '').trim();
  
  // 移除日期时间部分
  const dateTimeRegex = /\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}(?::\d{2})?/g;
  title = title.replace(dateTimeRegex, '').trim();
  
  // 如果标题为空，使用默认标题
  if (!title) {
    title = '日程安排';
  }
  
  return title;
};

/**
 * 从笔记中提取日程信息
 */
export const extractScheduleFromMemo = (memo: Memo): ScheduleItem | null => {
  if (!isScheduleMemo(memo)) {
    return null;
  }
  
  const datetime = extractDateTime(memo.content);
  if (!datetime) {
    return null;
  }
  
  const title = extractScheduleTitle(memo.content);
  
  return {
    id: memo.name,
    title,
    datetime,
    memo,
  };
};

/**
 * 从笔记列表中提取所有日程信息
 */
export const extractSchedulesFromMemos = (memos: Memo[]): ScheduleItem[] => {
  const schedules: ScheduleItem[] = [];
  
  for (const memo of memos) {
    const schedule = extractScheduleFromMemo(memo);
    if (schedule) {
      schedules.push(schedule);
    }
  }
  
  // 按日期时间排序
  schedules.sort((a, b) => dayjs(a.datetime).valueOf() - dayjs(b.datetime).valueOf());
  
  return schedules;
};

/**
 * 获取指定日期的日程
 */
export const getSchedulesForDate = (schedules: ScheduleItem[], date: string): ScheduleItem[] => {
  const targetDate = dayjs(date).format('YYYY-MM-DD');
  return schedules.filter(schedule => 
    dayjs(schedule.datetime).format('YYYY-MM-DD') === targetDate
  );
};

/**
 * 获取今天的日程
 */
export const getTodaySchedules = (schedules: ScheduleItem[]): ScheduleItem[] => {
  const today = dayjs().format('YYYY-MM-DD');
  return getSchedulesForDate(schedules, today);
};

/**
 * 获取即将到来的日程（未来7天）
 */
export const getUpcomingSchedules = (schedules: ScheduleItem[]): ScheduleItem[] => {
  const now = dayjs();
  const nextWeek = now.add(7, 'day');
  
  return schedules.filter(schedule => {
    const scheduleTime = dayjs(schedule.datetime);
    return scheduleTime.isAfter(now) && scheduleTime.isBefore(nextWeek);
  });
};