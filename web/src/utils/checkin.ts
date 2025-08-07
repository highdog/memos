import dayjs from "dayjs";
import { Memo } from "@/types/proto/api/v1/memo_service";
import { memoStore } from "@/store";

/**
 * 判断是否为打卡笔记
 * 打卡笔记的特征：包含星号标记 "-[*]"
 */
export const isCheckinMemo = (memo: Memo): boolean => {
  return memo.content.includes('-[*]');
};

/**
 * 从打卡笔记中提取标题
 */
export const extractCheckinTitle = (memo: Memo): string => {
  const lines = memo.content.split('\n');
  for (const line of lines) {
    if (line.includes('-[*]')) {
      // 提取星号后的内容作为标题
      const match = line.match(/-\[\*\]\s*(.+)/);
      return match ? match[1].trim() : '打卡';
    }
  }
  return '打卡';
};

/**
 * 获取打卡笔记的打卡次数
 * 通过查找引用该打卡笔记的其他笔记来计算
 */
export const getCheckinCount = async (checkinMemo: Memo): Promise<number> => {
  const checkinMemoName = checkinMemo.name;
  const allMemos = memoStore.state.memos;
  let count = 0;
  
  for (const memo of allMemos) {
    // 检查笔记内容是否包含对打卡笔记的引用
    if (memo.content.includes(`@${checkinMemoName}`) || 
        memo.content.includes(`[[${checkinMemoName}]]`)) {
      // 检查是否是打卡记录（包含"打卡第"字样）
      if (memo.content.includes('打卡第') && memo.content.includes('次')) {
        count++;
      }
    }
  }
  
  return count;
};

/**
 * 生成打卡记录的内容
 */
export const generateCheckinRecord = async (checkinMemo: Memo): Promise<string> => {
  const checkinCount = await getCheckinCount(checkinMemo);
  const title = extractCheckinTitle(checkinMemo);
  const currentTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const checkinMemoName = checkinMemo.name;
  
  return `✅ ${title} - 打卡第 ${checkinCount + 1} 次

⏰ 打卡时间：${currentTime}
📝 关联任务：[[${checkinMemoName}]]

#打卡记录 #${title.replace(/\s+/g, '')}`;
};

/**
 * 检查今天是否已经打卡
 */
export const hasCheckedInToday = (checkinMemo: Memo): boolean => {
  const checkinMemoName = checkinMemo.name;
  const allMemos = memoStore.state.memos;
  const today = dayjs().format('YYYY-MM-DD');
  
  for (const memo of allMemos) {
    // 检查是否是今天创建的打卡记录
    const memoDate = dayjs(memo.displayTime).format('YYYY-MM-DD');
    if (memoDate === today && 
        (memo.content.includes(`@${checkinMemoName}`) || 
         memo.content.includes(`[[${checkinMemoName}]]`)) &&
        memo.content.includes('打卡第') && 
        memo.content.includes('次')) {
      return true;
    }
  }
  
  return false;
};

/**
 * 获取打卡统计信息
 */
export const getCheckinStats = async (checkinMemo: Memo) => {
  const checkinMemoName = checkinMemo.name;
  const allMemos = memoStore.state.memos;
  const checkinRecords: { date: string; count: number }[] = [];
  const dateCountMap = new Map<string, number>();
  
  for (const memo of allMemos) {
    // 检查是否是打卡记录
    if ((memo.content.includes(`@${checkinMemoName}`) || 
         memo.content.includes(`[[${checkinMemoName}]]`)) &&
        memo.content.includes('打卡第') && 
        memo.content.includes('次')) {
      
      const date = dayjs(memo.displayTime).format('YYYY-MM-DD');
      const currentCount = dateCountMap.get(date) || 0;
      dateCountMap.set(date, currentCount + 1);
    }
  }
  
  // 转换为数组格式
  for (const [date, count] of dateCountMap.entries()) {
    checkinRecords.push({ date, count });
  }
  
  // 按日期排序
  checkinRecords.sort((a, b) => a.date.localeCompare(b.date));
  
  const totalCount = await getCheckinCount(checkinMemo);
  const hasCheckedToday = hasCheckedInToday(checkinMemo);
  
  return {
    totalCount,
    hasCheckedToday,
    checkinRecords,
    streakDays: calculateStreakDays(checkinRecords)
  };
};

/**
 * 计算连续打卡天数
 */
const calculateStreakDays = (checkinRecords: { date: string; count: number }[]): number => {
  if (checkinRecords.length === 0) return 0;
  
  const today = dayjs().format('YYYY-MM-DD');
  const sortedRecords = checkinRecords.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
  
  let streak = 0;
  let currentDate = dayjs();
  
  // 如果今天没有打卡记录，从昨天开始计算
  const hasToday = sortedRecords.some(record => record.date === today);
  if (!hasToday) {
    currentDate = currentDate.subtract(1, 'day');
  }
  
  for (const record of sortedRecords) {
    const recordDate = dayjs(record.date);
    if (recordDate.isSame(currentDate, 'day')) {
      streak++;
      currentDate = currentDate.subtract(1, 'day');
    } else {
      break;
    }
  }
  
  return streak;
};