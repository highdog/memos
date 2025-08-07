import { CheckIcon, StarIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { memoStore } from "@/store";
import { Memo, Visibility } from "@/types/proto/api/v1/memo_service";
import { useTranslate } from "@/utils/i18n";
import { isCheckinMemo, getCheckinCount, generateCheckinRecord, hasCheckedInToday } from "@/utils/checkin";

interface Props {
  memo: Memo;
  className?: string;
}

const CheckinButton: React.FC<Props> = observer((props: Props) => {
  const { memo, className } = props;
  const t = useTranslate();
  const [isCreating, setIsCreating] = useState(false);

  // 检查是否为打卡笔记
  if (!isCheckinMemo(memo)) {
    return null;
  }

  const handleCheckin = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      // 生成打卡记录内容
      const checkinContent = await generateCheckinRecord(memo);
      
      // 创建新的打卡记录笔记
      await memoStore.createMemo({
        memo: Memo.fromPartial({
          content: checkinContent,
          visibility: Visibility.PRIVATE,
        }),
        memoId: "",
        validateOnly: false,
        requestId: "",
      });
      
      toast.success("打卡成功！");
    } catch (error) {
      console.error("打卡失败:", error);
      toast.error("打卡失败，请重试");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckin}
            disabled={isCreating}
            className={className}
          >
            <StarIcon className="w-4 h-4 mr-1" />
            {isCreating ? "打卡中..." : "打卡"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          点击进行打卡
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export default CheckinButton;