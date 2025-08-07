import { CheckIcon, TargetIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { memoStore } from "@/store";
import { Memo, Visibility } from "@/types/proto/api/v1/memo_service";
import { useTranslate } from "@/utils/i18n";
import { 
  isGoalMemo, 
  getGoalStats, 
  generateGoalCompletionRecord, 
  updateGoalProgress,
  hasCompletedGoalToday 
} from "@/utils/goal";

interface Props {
  memo: Memo;
  className?: string;
}

const GoalButton: React.FC<Props> = observer((props: Props) => {
  const { memo, className } = props;
  const t = useTranslate();
  const [isCreating, setIsCreating] = useState(false);
  const [goalStats, setGoalStats] = useState<any>(null);

  // 检查是否为目标笔记
  if (!isGoalMemo(memo)) {
    return null;
  }

  // 加载目标统计信息
  useEffect(() => {
    const loadGoalStats = async () => {
      try {
        const stats = await getGoalStats(memo);
        setGoalStats(stats);
      } catch (error) {
        console.error('加载目标统计失败:', error);
      }
    };
    
    loadGoalStats();
  }, [memo]);

  if (!goalStats) {
    return null;
  }

  // 检查今天是否已经完成过目标
  const alreadyCompletedToday = hasCompletedGoalToday(memo);
  const isGoalAchieved = goalStats.isGoalAchieved;

  const handleGoalCompletion = async () => {
    if (isCreating || alreadyCompletedToday || isGoalAchieved) {
      return;
    }

    setIsCreating(true);
    try {
      // 生成目标完成记录内容
      const completionContent = await generateGoalCompletionRecord(memo);
      
      // 创建新的目标完成记录笔记
      await memoStore.createMemo({
        memo: Memo.fromPartial({
          content: completionContent,
          visibility: Visibility.PRIVATE,
        }),
        memoId: "",
        validateOnly: false,
        requestId: "",
      });

      // 更新原目标笔记的进度
      const updatedContent = await updateGoalProgress(memo);
      await memoStore.updateMemo(
        {
          ...memo,
          content: updatedContent,
        },
        ["content"]
      );
      
      toast.success("目标完成记录已创建！");
      
      // 重新加载统计信息
      const newStats = await getGoalStats(memo);
      setGoalStats(newStats);
    } catch (error) {
      console.error("目标完成失败:", error);
      toast.error("目标完成失败，请重试");
    } finally {
      setIsCreating(false);
    }
  };

  const getButtonText = () => {
    if (isGoalAchieved) return "目标已达成";
    if (alreadyCompletedToday) return "今日已完成";
    if (isCreating) return "记录中...";
    return "完成目标";
  };

  const getButtonVariant = () => {
    if (isGoalAchieved) return "default";
    if (alreadyCompletedToday) return "secondary";
    return "outline";
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* 进度条 */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{goalStats.title}</span>
          <span>{goalStats.actualCurrent}/{goalStats.target}</span>
        </div>
        <Progress value={goalStats.progress} className="h-2" />
        <div className="text-xs text-muted-foreground text-center">
          {goalStats.progress.toFixed(1)}% 完成
        </div>
      </div>
      
      {/* 完成按钮 */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={getButtonVariant()}
              size="sm"
              onClick={handleGoalCompletion}
              disabled={isCreating || alreadyCompletedToday || isGoalAchieved}
              className="w-full"
            >
              {isGoalAchieved ? (
                <>
                  <CheckIcon className="w-4 h-4 mr-1" />
                  {getButtonText()}
                </>
              ) : alreadyCompletedToday ? (
                <>
                  <CheckIcon className="w-4 h-4 mr-1" />
                  {getButtonText()}
                </>
              ) : (
                <>
                  <TargetIcon className="w-4 h-4 mr-1" />
                  {getButtonText()}
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isGoalAchieved 
              ? "恭喜！目标已经达成" 
              : alreadyCompletedToday 
                ? "今天已经完成过目标了" 
                : "点击记录目标完成"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
});

export default GoalButton;