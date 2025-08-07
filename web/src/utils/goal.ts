import dayjs from "dayjs";
import { memoStore } from "@/store";
import { Memo } from "@/types/proto/api/v1/memo_service";

/**
 * 判断是否为目标笔记
 * 目标笔记的格式：-[0] 目标名称 (0/10)
 */
export const isGoalMemo = (memo: Memo): boolean => {
  const content = memo.content.trim();
  // 匹配目标笔记格式：-[0] 后面跟着目标名称和进度
  const goalPattern = /^-\[0\]\s+.+\s+\(\d+\/\d+\)$/m;
  return goalPattern.test(content);
};

/**
 * 从目标笔记中提取目标信息
 */
export const extractGoalInfo = (memo: Memo): {
  title: string;
  current: number;
  target: number;
  isCompleted: boolean;
} | null => {
  const content = memo.content.trim();
  const goalPattern = /^-\[0\]\s+(.+?)\s+\((\d+)\/(\d+)\)$/m;
  const match = content.match(goalPattern);
  
  if (!match) {
    return null;
  }
  
  const [, title, current, target] = match;
  const isCompleted = parseInt(current, 10) >= parseInt(target, 10);
  return {
    title: title.trim(),
    current: parseInt(current, 10),
    target: parseInt(target, 10),
    isCompleted
  };
};

/**
 * 获取目标的完成记录数量
 * 通过查找引用该目标笔记的其他笔记来计算
 */
export const getGoalCompletionCount = async (goalMemo: Memo): Promise<number> => {
  const goalMemoName = goalMemo.name;
  const allMemos = memoStore.state.memos;
  let count = 0;
  
  for (const memo of allMemos) {
    // 检查笔记内容是否包含对目标笔记的引用
    if (memo.content.includes(`@${goalMemoName}`) || 
        memo.content.includes(`[[${goalMemoName}]]`)) {
      // 检查是否是目标完成记录（包含"完成目标"字样）
      if (memo.content.includes('完成目标') || memo.content.includes('目标达成')) {
        count++;
      }
    }
  }
  
  return count;
};

/**
 * 检查今天是否已经完成过目标
 */
export const hasCompletedGoalToday = (goalMemo: Memo): boolean => {
  const goalMemoName = goalMemo.name;
  const allMemos = memoStore.state.memos;
  const today = dayjs().format('YYYY-MM-DD');
  
  for (const memo of allMemos) {
    // 检查是否是今天创建的目标完成记录
    const memoDate = dayjs(memo.displayTime).format('YYYY-MM-DD');
    if (memoDate === today && 
        (memo.content.includes(`@${goalMemoName}`) || 
         memo.content.includes(`[[${goalMemoName}]]`)) &&
        (memo.content.includes('完成目标') || memo.content.includes('目标达成'))) {
      return true;
    }
  }
  
  return false;
};

/**
 * 生成目标完成记录内容
 */
export const generateGoalCompletionRecord = async (goalMemo: Memo): Promise<string> => {
  const goalInfo = extractGoalInfo(goalMemo);
  if (!goalInfo) {
    throw new Error('无法解析目标信息');
  }
  
  const count = await getGoalCompletionCount(goalMemo);
  const newCount = count + 1;
  const today = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  return `完成目标第 ${newCount} 次 - ${goalInfo.title}

完成时间：${today}
目标进度：${newCount}/${goalInfo.target}
原始目标：@${goalMemo.name}

#目标完成记录`;
};

/**
 * 更新目标笔记的进度
 */
export const updateGoalProgress = async (goalMemo: Memo): Promise<string> => {
  const goalInfo = extractGoalInfo(goalMemo);
  if (!goalInfo) {
    throw new Error('无法解析目标信息');
  }
  
  const currentCount = await getGoalCompletionCount(goalMemo);
  const newCount = currentCount + 1;
  const isCompleted = newCount >= goalInfo.target;
  
  // 更新笔记内容中的进度
  const updatedContent = goalMemo.content.replace(
    /^(-\[0\]\s+.+?\s+\()\d+(\/\d+\))$/m,
    `$1${newCount}$2`
  );
  
  return updatedContent;
};

/**
 * 获取目标统计信息
 */
export const getGoalStats = async (goalMemo: Memo) => {
  const goalInfo = extractGoalInfo(goalMemo);
  if (!goalInfo) {
    return null;
  }
  
  const goalMemoName = goalMemo.name;
  const allMemos = memoStore.state.memos;
  const completionRecords: { date: string; count: number }[] = [];
  const dateCountMap = new Map<string, number>();
  
  for (const memo of allMemos) {
    // 检查是否是目标完成记录
    if ((memo.content.includes(`@${goalMemoName}`) || 
         memo.content.includes(`[[${goalMemoName}]]`)) &&
        (memo.content.includes('完成目标') || memo.content.includes('目标达成'))) {
      
      const date = dayjs(memo.displayTime).format('YYYY-MM-DD');
      const currentCount = dateCountMap.get(date) || 0;
      dateCountMap.set(date, currentCount + 1);
    }
  }
  
  // 转换为数组格式
  for (const [date, count] of dateCountMap.entries()) {
    completionRecords.push({ date, count });
  }
  
  // 按日期排序
  completionRecords.sort((a, b) => a.date.localeCompare(b.date));
  
  const totalCount = await getGoalCompletionCount(goalMemo);
  const hasCompletedToday = hasCompletedGoalToday(goalMemo);
  const progress = goalInfo.target > 0 ? (totalCount / goalInfo.target) * 100 : 0;
  
  return {
    ...goalInfo,
    actualCurrent: totalCount, // 实际完成次数
    progress: Math.min(progress, 100), // 进度百分比
    hasCompletedToday,
    completionRecords,
    isGoalAchieved: totalCount >= goalInfo.target
  };
};

/**
 * 创建新的目标笔记内容
 */
export const createGoalMemoContent = (title: string, target: number): string => {
  return `-[0] ${title} (0/${target})

目标描述：${title}
目标次数：${target}
当前进度：0/${target}

#目标笔记`;
};