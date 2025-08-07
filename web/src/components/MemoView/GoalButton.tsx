import { TargetIcon, PlusIcon, CheckIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Memo, Visibility } from "@/types/proto/api/v1/memo_service";
import { memoStore, memoDetailStore } from "@/store";

interface Props {
  memo: Memo;
  className?: string;
  compact?: boolean; // 紧凑模式，只显示按钮
}

// 简化的目标信息提取函数
const extractSimpleGoalInfo = (memo: Memo) => {
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

// 简化的目标进度更新函数
const updateSimpleGoalProgress = (memo: Memo, incrementAmount: number) => {
  const goalInfo = extractSimpleGoalInfo(memo);
  if (!goalInfo) {
    throw new Error('无法解析目标信息');
  }
  
  const newCurrent = Math.min(goalInfo.current + incrementAmount, goalInfo.target);
  const isCompleted = newCurrent >= goalInfo.target;
  
  // 更新笔记内容中的进度
  const updatedContent = memo.content.replace(
    /^(-\[0\]\s+.+?\s+\()\d+(\/\d+\))$/m,
    `$1${newCurrent}$2`
  );
  
  return updatedContent;
};

// 创建目标完成记录笔记
const createGoalCompletionMemo = (goalTitle: string, completedAmount: number, currentProgress: string) => {
  return `✅ 完成目标：${goalTitle}，当前进度：${currentProgress}`;
};

const GoalButton = observer((props: Props) => {
  const { memo, className, compact = false } = props;
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [completionAmount, setCompletionAmount] = useState(1);

  // 从笔记内容中提取目标信息
  const goalInfo = extractSimpleGoalInfo(memo);

  // 如果没有目标信息，不显示按钮
  if (!goalInfo) {
    return null;
  }

  const { title, current, target } = goalInfo;
  const progress = target > 0 ? (current / target) * 100 : 0;
  const isCompleted = current >= target;
  const remainingAmount = target - current;
  
  // 计算预览进度
  const previewCurrent = Math.min(current + completionAmount, target);
  const previewProgress = target > 0 ? (previewCurrent / target) * 100 : 0;

  const handleCompleteGoal = async () => {
    if (isCompleted || isUpdating) return;

    setIsUpdating(true);
    try {
      // 更新目标进度
      const updatedContent = updateSimpleGoalProgress(memo, completionAmount);
      
      // 更新原笔记
      const updatedMemo = await memoStore.updateMemo(
        {
          name: memo.name,
          content: updatedContent,
        },
        ["content"]
      );

      // 创建完成记录笔记
      const newCurrent = Math.min(current + completionAmount, target);
      const progressText = `${newCurrent}/${target}`;
      const completionMemoContent = createGoalCompletionMemo(title, completionAmount, progressText);
      
      await memoStore.createMemo({
        memo: Memo.fromPartial({
          content: completionMemoContent,
          visibility: Visibility.PRIVATE,
        }),
        memoId: "",
        validateOnly: false,
        requestId: "",
      });

      // 如果当前笔记是在详情弹窗中显示的，则更新 memoDetailStore 中的数据
      if (memoDetailStore.selectedMemo && memoDetailStore.selectedMemo.name === memo.name) {
        memoDetailStore.updateSelectedMemo(updatedMemo);
      }

      // 关闭对话框并重置数量
      setIsDialogOpen(false);
      setCompletionAmount(1);
    } catch (error) {
      console.error("Failed to update goal progress:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // 紧凑模式：只显示按钮
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {!isCompleted ? (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUpdating}
                    className={`shrink-0 ${className}`}
                  >
                    <PlusIcon className="w-3 h-3 mr-1" />
                     更新进度
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>完成目标：{title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">本次完成数量</label>
                      <Input
                        type="number"
                        min="1"
                        max={remainingAmount}
                        value={completionAmount}
                        onChange={(e) => setCompletionAmount(Math.max(1, Math.min(remainingAmount, parseInt(e.target.value) || 1)))}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        剩余：{remainingAmount} 个
                      </p>
                    </div>
                    {/* 实时预览进度 */}
                    <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                      <div className="text-sm font-medium text-gray-700">完成后进度预览：</div>
                      <div className="text-sm text-gray-600">
                        进度：{previewCurrent}/{target} ({Math.round(previewProgress)}%)
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${previewProgress}%` }}
                        />
                      </div>
                      {previewCurrent >= target && (
                        <div className="text-sm text-green-600 font-medium">
                          🎉 目标将完成！
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isUpdating}
                      >
                        取消
                      </Button>
                      <Button
                        onClick={handleCompleteGoal}
                        disabled={isUpdating}
                      >
                        <CheckIcon className="w-4 h-4 mr-1" />
                        {isUpdating ? "更新中..." : "确认完成"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <div className={`flex items-center gap-1 text-green-600 text-sm font-medium ${className}`}>
                <CheckIcon className="w-4 h-4" />
                已完成
              </div>
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>目标进度：{current}/{target}</p>
            {!isCompleted && <p>点击按钮选择完成数量</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // 完整模式：显示完整的目标卡片
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 p-2 rounded-lg border bg-card ${className}`}>
            <div className="flex items-center gap-2 flex-1">
              <TargetIcon className="w-4 h-4 text-primary" />
              <div className="flex-1">
                <div className="text-sm font-medium">{title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={progress} className="flex-1 h-2" />
                  <span className="text-xs text-muted-foreground">
                    {current}/{target}
                  </span>
                </div>
              </div>
            </div>
            {!isCompleted && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUpdating}
                    className="shrink-0"
                  >
                    <PlusIcon className="w-3 h-3 mr-1" />
                    更新进度
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>完成目标：{title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">本次完成数量</label>
                      <Input
                        type="number"
                        min="1"
                        max={remainingAmount}
                        value={completionAmount}
                        onChange={(e) => setCompletionAmount(Math.max(1, Math.min(remainingAmount, parseInt(e.target.value) || 1)))}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        剩余：{remainingAmount} 个
                      </p>
                    </div>
                    {/* 实时预览进度 */}
                    <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                      <div className="text-sm font-medium text-gray-700">完成后进度预览：</div>
                      <div className="text-sm text-gray-600">
                        进度：{previewCurrent}/{target} ({Math.round(previewProgress)}%)
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${previewProgress}%` }}
                        />
                      </div>
                      {previewCurrent >= target && (
                        <div className="text-sm text-green-600 font-medium">
                          🎉 目标将完成！
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isUpdating}
                      >
                        取消
                      </Button>
                      <Button
                        onClick={handleCompleteGoal}
                        disabled={isUpdating}
                      >
                        <CheckIcon className="w-4 h-4 mr-1" />
                        {isUpdating ? "更新中..." : "确认完成"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {isCompleted && (
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <CheckIcon className="w-4 h-4" />
                已完成
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>目标进度：{current}/{target}</p>
          {!isCompleted && <p>点击按钮选择完成数量</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export default GoalButton;