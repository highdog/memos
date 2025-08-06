import dayjs from "dayjs";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useLoading from "@/hooks/useLoading";
import memoStore from "@/store/memo";
import { Memo, Visibility } from "@/types/proto/api/v1/memo_service";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function AddScheduleDialog({ open, onOpenChange, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [time, setTime] = useState(dayjs().format("HH:mm"));
  const requestState = useLoading(false);

  const handleConfirm = async () => {
    if (!title.trim()) {
      toast.error("请输入日程标题");
      return;
    }

    if (!date || !time) {
      toast.error("请选择日期和时间");
      return;
    }

    try {
      requestState.setLoading();

      // 构建日程内容，格式：{} 标题 日期时间 内容
      const datetime = `${date.replace(/-/g, "/")} ${time}:00`;
      let memoContent = `{} ${title} ${datetime}`;
      
      if (content.trim()) {
        memoContent += `\n\n${content.trim()}`;
      }

      await memoStore.createMemo({
        memo: Memo.fromPartial({
          content: memoContent,
          visibility: Visibility.PRIVATE, // 日程默认为私有
        }),
        memoId: "",
        validateOnly: false,
        requestId: "",
      });

      toast.success("日程添加成功");
      requestState.setFinish();
      
      // 重置表单
      setTitle("");
      setContent("");
      setDate(dayjs().format("YYYY-MM-DD"));
      setTime(dayjs().format("HH:mm"));
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.details || "添加日程失败");
      requestState.setError();
    }
  };

  const handleCancel = () => {
    // 重置表单
    setTitle("");
    setContent("");
    setDate(dayjs().format("YYYY-MM-DD"));
    setTime(dayjs().format("HH:mm"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>添加日程</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">日程标题 *</Label>
            <Input
              id="title"
              type="text"
              placeholder="请输入日程标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">日期 *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">时间 *</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content">日程内容</Label>
            <Textarea
              id="content"
              rows={3}
              placeholder="请输入日程详细内容（可选）"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" disabled={requestState.isLoading} onClick={handleCancel}>
            取消
          </Button>
          <Button disabled={requestState.isLoading} onClick={handleConfirm}>
            {requestState.isLoading ? "添加中..." : "确认添加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddScheduleDialog;