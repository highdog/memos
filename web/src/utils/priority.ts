import { Memo } from "@/types/proto/api/v1/memo_service";

// 优先级类型定义
export type Priority = 'high' | 'medium' | 'low' | null;

// 从笔记内容中解析优先级
export function getPriorityFromMemo(memo: Memo): Priority | null {
  const content = memo.content;
  
  // 检查任务行勾选框后是否包含优先级标记
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    // 检查是否是任务行且勾选框后有优先级符号
    if (trimmedLine.match(/^-\s*\[[x\s]\]\s*!!!/)) {
      return 'high';
    } else if (trimmedLine.match(/^-\s*\[[x\s]\]\s*!!/)) {
      return 'medium';
    } else if (trimmedLine.match(/^-\s*\[[x\s]\]\s*!/)) {
      return 'low';
    }
  }
  
  return null;
};

// 获取优先级的数值权重，用于排序
export const getPriorityWeight = (priority: Priority): number => {
  switch (priority) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
};

// 获取优先级的显示文本
export const getPriorityText = (priority: Priority): string => {
  switch (priority) {
    case 'high': return '高';
    case 'medium': return '中';
    case 'low': return '低';
    default: return '无';
  }
};

// 获取优先级的颜色类名
export const getPriorityColor = (priority: Priority): string => {
  switch (priority) {
    case 'high': return 'bg-red-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-300';
  }
};

// 按优先级排序笔记
export const sortMemosByPriority = (memos: Memo[]): Memo[] => {
  return memos.sort((a, b) => {
    const priorityA = getPriorityFromMemo(a);
    const priorityB = getPriorityFromMemo(b);
    const weightA = getPriorityWeight(priorityA);
    const weightB = getPriorityWeight(priorityB);
    
    // 优先级高的排在前面，如果优先级相同则按时间倒序
    if (weightA !== weightB) {
      return weightB - weightA;
    }
    
    // 优先级相同时按显示时间倒序排列
    return new Date(b.displayTime!).getTime() - new Date(a.displayTime!).getTime();
  });
};