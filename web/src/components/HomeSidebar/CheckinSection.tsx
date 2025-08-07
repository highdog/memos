import { StarIcon, CheckIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { memoStore } from "@/store";
import { State } from "@/types/proto/api/v1/common";
import { Memo } from "@/types/proto/api/v1/memo_service";
import { useTranslate } from "@/utils/i18n";
import { isCheckinMemo, extractCheckinTitle, hasCheckedInToday, getCheckinCount } from "@/utils/checkin";
import CheckinButton from "../CheckinButton";
import MemoDetailDialog from "../MemoDetailDialog";

const CheckinSection = observer(() => {
  const t = useTranslate();
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 获取所有打卡笔记
  const checkinMemos = useMemo(() => {
    return memoStore.state.memos
      .filter((memo) => memo.state === State.NORMAL && isCheckinMemo(memo))
      .sort((a, b) => {
        // 按创建时间排序，最新的在前
        return new Date(b.createTime!).getTime() - new Date(a.createTime!).getTime();
      });
  }, [memoStore.state.memos]);

  const handleMemoClick = (memo: Memo) => {
    setSelectedMemo(memo);
    setDialogOpen(true);
  };

  if (checkinMemos.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-sidebar-foreground flex items-center">
          <StarIcon className="w-4 h-4 mr-1" />
          打卡列表
        </h3>
      </div>
      
      <div className="space-y-2">
        {checkinMemos.slice(0, 5).map((memo) => {
          const title = extractCheckinTitle(memo);
          const alreadyCheckedIn = hasCheckedInToday(memo);
          
          return (
            <div
              key={memo.name}
              className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div
                onClick={() => handleMemoClick(memo)}
                className="flex-1 min-w-0 cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    alreadyCheckedIn ? "bg-green-500" : "bg-gray-300"
                  )} />
                  <span className="text-sm truncate text-sidebar-foreground">
                    {title}
                  </span>
                </div>
              </div>
              
              <CheckinButton memo={memo} className="ml-2" />
            </div>
          );
        })}
        
        {checkinMemos.length > 5 && (
          <div className="text-xs text-muted-foreground text-center pt-1">
            还有 {checkinMemos.length - 5} 个打卡项目...
          </div>
        )}
      </div>

      {/* 打卡详情对话框 */}
      <MemoDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        memo={selectedMemo}
        parentPage="/"
      />
    </div>
  );
});

export default CheckinSection;