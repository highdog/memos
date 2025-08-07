import { TargetIcon, CalendarIcon, TrendingUpIcon, CheckCircleIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { memoStore } from "@/store";
import { Memo } from "@/types/proto/api/v1/memo_service";
import { extractGoalInfo } from "@/utils/goal";
import { Progress } from "@/components/ui/progress";
import GoalButton from "../MemoView/GoalButton";
import dayjs from "dayjs";

interface Props {
  memo: Memo;
  className?: string;
  parentPage?: string;
}

const GoalDetailSidebar = observer(({ memo, className, parentPage }: Props) => {
  // 获取目标信息和统计
  const goalInfo = useMemo(() => {
    return extractGoalInfo(memo);
  }, [memo]);

  // 获取所有目标完成记录
  const completionRecords = useMemo(() => {
    const goalMemoName = memo.name;
    const goalTitle = goalInfo?.title;
    const allMemos = memoStore.state.memos;
    
    return allMemos
      .filter((m) => {
        // 检查是否是目标完成记录
        // 格式1: 包含对目标的引用且包含"完成目标"或"目标达成"
        const hasReference = m.content.includes(`@${goalMemoName}`) || 
                            m.content.includes(`[[${goalMemoName}]]`);
        const hasCompletionKeyword = m.content.includes('完成目标') || 
                                   m.content.includes('目标达成');
        
        // 格式2: 以"✅ 完成目标："开头且包含目标标题的记录
        const isCompletionFormat = m.content.includes('✅ 完成目标：') && 
                                  goalTitle && m.content.includes(`完成目标：${goalTitle}`);
        
        return (hasReference && hasCompletionKeyword) || isCompletionFormat;
      })
      .sort((a, b) => {
        // 按创建时间倒序排列，最新的在前
        return new Date(b.createTime!).getTime() - new Date(a.createTime!).getTime();
      });
  }, [memo.name, goalInfo?.title, memoStore.state.memos]);



  // 按日期分组完成记录
  const groupedRecords = useMemo(() => {
    const groups: { [date: string]: Memo[] } = {};
    
    completionRecords.forEach((record) => {
      const date = dayjs(record.createTime).format('YYYY-MM-DD');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
    });
    
    return groups;
  }, [completionRecords]);

  if (!goalInfo) {
    return null;
  }

  const isGoalAchieved = goalInfo.isCompleted;

  return (
    <aside
      className={cn("relative w-full h-auto max-h-screen overflow-auto hide-scrollbar flex flex-col justify-start items-start", className)}
    >
      <div className="flex flex-col justify-start items-start w-full px-1 gap-2 h-auto shrink-0 flex-nowrap hide-scrollbar">
        {/* 目标统计信息 */}
        <div className="mb-4 w-full">
          <div className="w-full flex flex-row justify-between items-center h-8 pl-2 mb-2">
            <div className="flex flex-row justify-start items-center">
              <TrendingUpIcon className="w-4 h-4 mr-1 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">目标统计</span>
            </div>
          </div>
          <div className="w-full p-3 rounded-lg border bg-card">
            <div className="space-y-3">
              {/* 目标标题 */}
              <div className="text-center">
                <h3 className="font-medium text-sm text-foreground mb-1">{goalInfo.title}</h3>
                {isGoalAchieved && (
                  <div className="flex items-center justify-center text-green-600 text-xs">
                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                    目标已达成
                  </div>
                )}
              </div>
              
              {/* 进度条 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>进度</span>
                  <span>{goalInfo.current}/{goalInfo.target}</span>
                </div>
                <Progress value={goalInfo.target > 0 ? (goalInfo.current / goalInfo.target) * 100 : 0} className="h-2" />
                <div className="text-center text-xs text-muted-foreground">
                  {Math.round(goalInfo.target > 0 ? (goalInfo.current / goalInfo.target) * 100 : 0)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 完成记录列表 */}
        <div className="mb-4 w-full">
          <div className="w-full flex flex-row justify-between items-center h-8 pl-2 mb-2">
            <div className="flex flex-row justify-start items-center">
              <TargetIcon className="w-4 h-4 mr-1 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">完成记录</span>
              <span className="text-muted-foreground text-sm ml-1">({completionRecords.length})</span>
            </div>
            <GoalButton memo={memo} compact={true} />
          </div>
          
          {completionRecords.length === 0 ? (
            <div className="w-full p-4 text-center text-muted-foreground text-sm">
              还没有完成记录
            </div>
          ) : (
            <div className="w-full space-y-3">
              {Object.entries(groupedRecords)
                .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                .map(([date, records]) => (
                  <div key={date} className="w-full">
                    {/* 日期标题 */}
                    <div className="flex items-center mb-2 px-2">
                      <CalendarIcon className="w-3 h-3 mr-1 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {dayjs(date).format('MM月DD日')}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({records.length}次)
                      </span>
                    </div>
                    
                    {/* 该日期的完成记录 */}
                    <div className="space-y-2 ml-4">
                      {records.map((record) => {
                        // 提取完成记录的关键信息
                        const extractCompletionInfo = (content: string) => {
                          // 格式1: goal.ts生成的格式
                          const match1 = content.match(/完成目标第\s*(\d+)\s*次\s*-\s*(.+?)[\n\r]/);
                          if (match1) {
                            const [, count, title] = match1;
                            const progressMatch = content.match(/目标进度：(\d+\/\d+)/);
                            const progress = progressMatch ? progressMatch[1] : '';
                            return `完成目标：${title.trim()}，当前进度：${progress}`;
                          }
                          
                          // 格式2: MemoView/GoalButton生成的新格式（单行）
                          const match2 = content.match(/✅ 完成目标：(.+?)，当前进度：(\d+\/\d+)/);
                          if (match2) {
                            const [, title, progress] = match2;
                            return `完成目标：${title.trim()}，当前进度：${progress}`;
                          }
                          
                          // 格式3: MemoView/GoalButton生成的旧格式（多行）
                          const match3 = content.match(/✅ 完成目标：(.+?)[\n\r]/);
                          if (match3) {
                            const title = match3[1];
                            const progressMatch = content.match(/📈 当前进度：(\d+\/\d+)/);
                            const progress = progressMatch ? progressMatch[1] : '';
                            return `完成目标：${title.trim()}，当前进度：${progress}`;
                          }
                          
                          return content.split('\n')[0]; // 默认显示第一行
                        };

                        const displayText = extractCompletionInfo(record.content);
                        
                        return (
                          <div key={`${record.name}-${record.displayTime}`} className="w-full">
                            <div className="text-sm text-muted-foreground bg-gray-50 rounded p-2">
                              {displayText}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
});

export default GoalDetailSidebar;