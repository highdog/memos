import { StarIcon, CalendarIcon, TrendingUpIcon, TrashIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { memoStore } from "@/store";
import { Memo } from "@/types/proto/api/v1/memo_service";
import { extractCheckinTitle, getCheckinStats } from "@/utils/checkin";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import MemoView from "../MemoView";
import dayjs from "dayjs";

// 简化的打卡记录显示组件
const CheckinRecordView = ({ memo, parentPage, onDelete }: { memo: Memo; parentPage?: string; onDelete: (memo: Memo) => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 过滤掉关联信息，只显示主要内容
  const cleanContent = memo.content
    .replace(/\u200B@[^\u200B]*\u200B/g, '') // 移除零宽度空格包围的关联信息
    .replace(/<!--.*?-->/g, '') // 移除HTML注释
    .trim();

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await onDelete(memo);
      toast.success("打卡记录已删除");
    } catch (error) {
      console.error("删除打卡记录失败:", error);
      toast.error("删除打卡记录失败");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className="text-sm text-foreground group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-muted-foreground">
            {dayjs(memo.displayTime).format('HH:mm:ss')}
          </span>
          <span className="flex-1">{cleanContent}</span>
        </div>
        
        {isHovered && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto min-w-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <TrashIcon className="w-3 h-3 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>删除打卡记录</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

interface Props {
  memo: Memo;
  className?: string;
  parentPage?: string;
}

const CheckinDetailSidebar = observer(({ memo, className, parentPage }: Props) => {
  // 删除打卡记录的函数
  const handleDeleteCheckinRecord = async (recordMemo: Memo) => {
    await memoStore.deleteMemo(recordMemo.name);
  };

  // 获取所有打卡记录
  const checkinRecords = useMemo(() => {
    const checkinMemoName = memo.name;
    const allMemos = memoStore.state.memos;
    
    return allMemos
      .filter((m) => {
        // 检查是否是打卡记录
        return (m.content.includes(`@${checkinMemoName}`) || 
                m.content.includes(`[[${checkinMemoName}]]`)) &&
               m.content.includes('打卡第') && 
               m.content.includes('次');
      })
      .sort((a, b) => {
        // 按创建时间倒序排列，最新的在前
        return new Date(b.createTime!).getTime() - new Date(a.createTime!).getTime();
      });
  }, [memo.name, memoStore.state.memos]);

  // 获取打卡统计信息
  const checkinStats = useMemo(async () => {
    return await getCheckinStats(memo);
  }, [memo, memoStore.state.memos]);

  // 按日期分组打卡记录
  const groupedRecords = useMemo(() => {
    const groups: { [date: string]: Memo[] } = {};
    
    checkinRecords.forEach((record) => {
      const date = dayjs(record.createTime).format('YYYY-MM-DD');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
    });
    
    return groups;
  }, [checkinRecords]);

  const title = extractCheckinTitle(memo);

  return (
    <aside
      className={cn("relative w-full h-auto max-h-screen overflow-auto hide-scrollbar flex flex-col justify-start items-start", className)}
    >
      <div className="flex flex-col justify-start items-start w-full px-4 pt-4 gap-2 h-auto shrink-0 flex-nowrap hide-scrollbar">
        {/* 打卡统计信息 */}
        <div className="mb-4 w-full">
          <div className="w-full flex flex-row justify-between items-center h-8 pl-2 mb-2">
            <div className="flex flex-row justify-start items-center">
              <TrendingUpIcon className="w-4 h-4 mr-1 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">打卡统计</span>
            </div>
          </div>
          <div className="w-full p-3 rounded-lg border bg-card">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-primary">{checkinRecords.length}</div>
                <div className="text-muted-foreground">总打卡次数</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {Object.keys(groupedRecords).length}
                </div>
                <div className="text-muted-foreground">打卡天数</div>
              </div>
            </div>
          </div>
        </div>

        {/* 打卡记录列表 */}
        <div className="mb-4 w-full">
          <div className="w-full flex flex-row justify-between items-center h-8 pl-2 mb-2">
            <div className="flex flex-row justify-start items-center">
              <StarIcon className="w-4 h-4 mr-1 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">打卡记录</span>
              <span className="text-muted-foreground text-sm ml-1">({checkinRecords.length})</span>
            </div>
          </div>
          
          {checkinRecords.length === 0 ? (
            <div className="w-full p-4 text-center text-muted-foreground text-sm">
              还没有打卡记录
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
                    
                    {/* 该日期的打卡记录 */}
                    <div className="space-y-2 ml-4">
                      {records.map((record) => (
                        <div key={`${record.name}-${record.displayTime}`} className="w-full">
                          <CheckinRecordView memo={record} parentPage={parentPage} onDelete={handleDeleteCheckinRecord} />
                        </div>
                      ))}
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

export default CheckinDetailSidebar;