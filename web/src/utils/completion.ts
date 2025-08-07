import { Memo } from "@/types/proto/api/v1/memo_service";

/**
 * 检测是否为完成目标的笔记
 * 完成目标笔记的特征：
 * 1. 包含"✅ 完成目标："字样
 * 2. 包含"完成目标"或"目标达成"字样
 */
export const isGoalCompletionMemo = (memo: Memo): boolean => {
  const content = memo.content;
  
  // 检查是否包含完成目标的标记
  return content.includes('✅ 完成目标：') || 
         content.includes('完成目标') || 
         content.includes('目标达成');
};

/**
 * 检测是否为完成打卡的笔记
 * 完成打卡笔记的特征：
 * 1. 包含"✅"和"打卡第"字样
 * 2. 包含"完成打卡"字样
 */
export const isCheckinCompletionMemo = (memo: Memo): boolean => {
  const content = memo.content;
  
  // 检查是否包含完成打卡的标记
  return (content.includes('✅') && content.includes('打卡第') && content.includes('次')) ||
         content.includes('完成打卡');
};

/**
 * 检测是否为完成记录笔记（包括目标完成和打卡完成）
 * 这些笔记不应该显示在主笔记列表中
 */
export const isCompletionMemo = (memo: Memo): boolean => {
  return isGoalCompletionMemo(memo) || isCheckinCompletionMemo(memo);
};