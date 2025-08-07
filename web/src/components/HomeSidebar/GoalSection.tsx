import { TargetIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { memoStore } from "@/store";
import { State } from "@/types/proto/api/v1/common";
import { Memo } from "@/types/proto/api/v1/memo_service";
import { useTranslate } from "@/utils/i18n";
import { isGoalMemo, extractGoalInfo } from "@/utils/goal";
import GoalButton from "../MemoView/GoalButton";
import MemoDetailDialog from "../MemoDetailDialog";

const GoalSection = observer(() => {
  const t = useTranslate();
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 获取所有目标笔记
  const goalMemos = useMemo(() => {
    const normalMemos = memoStore.state.memos.filter((memo) => memo.state === State.NORMAL);
    const goalMemos = normalMemos.filter((memo) => isGoalMemo(memo));
    
    return goalMemos.sort((a, b) => {
      // 按创建时间排序，最新的在前
      return new Date(b.createTime!).getTime() - new Date(a.createTime!).getTime();
    });
  }, [memoStore.state.memos]);

  const handleMemoClick = (memo: Memo) => {
    setSelectedMemo(memo);
    setDialogOpen(true);
  };

  if (goalMemos.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-sidebar-foreground flex items-center">
          <TargetIcon className="w-4 h-4 mr-1" />
          目标列表
        </h3>
      </div>
      
      <div className="space-y-3">
        {goalMemos.slice(0, 5).map((memo) => {
          const goalInfo = extractGoalInfo(memo);
          if (!goalInfo) return null;
          
          const { title, current, target, isCompleted } = goalInfo;
          const progress = target > 0 ? (current / target) * 100 : 0;
          
          return (
            <div
              key={memo.name}
              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div
                onClick={() => handleMemoClick(memo)}
                className="block mb-2 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-sidebar-foreground truncate">
                    {title}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {current}/{target}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Progress 
                    value={progress} 
                    className="h-1.5 flex-1"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {Math.round(progress)}%
                  </span>
                  {!isCompleted && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <GoalButton memo={memo} compact />
                    </div>
                  )}
                </div>
                
                {isCompleted && (
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-green-600 font-medium">
                      ✅ 已完成
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {goalMemos.length > 5 && (
          <div className="text-xs text-muted-foreground text-center pt-1">
            还有 {goalMemos.length - 5} 个目标...
          </div>
        )}
      </div>

      {/* 目标详情对话框 */}
      <MemoDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        memo={selectedMemo}
        parentPage="/"
      />
    </div>
  );
});

export default GoalSection;