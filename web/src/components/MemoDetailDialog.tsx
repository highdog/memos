import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { Memo } from "@/types/proto/api/v1/memo_service";
import MemoView from "./MemoView";
import { MemoDetailSidebar } from "./MemoDetailSidebar";
import CheckinDetailSidebar from "./MemoDetailSidebar/CheckinDetailSidebar";
import GoalDetailSidebar from "./MemoDetailSidebar/GoalDetailSidebar";
import { isCheckinMemo } from "@/utils/checkin";
import { isGoalMemo } from "@/utils/goal";
import { isTaskMemo } from "@/utils/memo";
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memo: Memo | null;
  parentPage?: string;
  initialEditMode?: boolean;
}

const MemoDetailDialog = observer(({ open, onOpenChange, memo, parentPage = "/", initialEditMode = false }: Props) => {
  const [editMode, setEditMode] = useState(false);
  const [forceEdit, setForceEdit] = useState(false);

  // 当弹框打开时，根据 initialEditMode 设置编辑模式
  useEffect(() => {
    if (open && initialEditMode) {
      setEditMode(true);
      setForceEdit(true);
    } else if (!open) {
      setEditMode(false);
      setForceEdit(false);
    }
  }, [open, initialEditMode]);

  if (!memo) {
    return null;
  }

  const handleEdit = () => {
    setEditMode(true);
    setForceEdit(true);
  };

  const handleEditComplete = () => {
    setEditMode(false);
    setForceEdit(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        {/* 自定义透明度更低的背景遮罩 */}
        <DialogOverlay className="bg-foreground/20" />
        <DialogPrimitive.Content 
          className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 flex flex-col translate-x-[-50%] translate-y-[-50%] rounded-lg border shadow-lg duration-200 w-[80vw] h-[80vh] max-w-[80vw] max-h-[80vh] p-0"
        >
          <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
              <h3 className="text-lg font-semibold">{editMode ? "编辑笔记" : "笔记详情"}</h3>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Left side - Memo content (1:1 ratio) */}
              <div className="flex-1 overflow-y-auto p-6">
                <MemoView 
                  memo={memo} 
                  showVisibility 
                  showPinned 
                  disableClick 
                  onEdit={handleEdit} 
                  onEditComplete={handleEditComplete} 
                  inDialog={true}
                  forceEdit={forceEdit}
                />
              </div>
              
              {/* Right side - Memo detail sidebar (1:1 ratio) */}
              <div className="flex-1 border-l border-border overflow-y-auto">
                {isCheckinMemo(memo) ? (
                  <CheckinDetailSidebar memo={memo} parentPage={parentPage} />
                ) : isGoalMemo(memo) ? (
                  <GoalDetailSidebar memo={memo} parentPage={parentPage} />
                ) : (
                  <MemoDetailSidebar memo={memo} parentPage={parentPage} isTaskMemo={isTaskMemo(memo)} />
                )}
              </div>
            </div>
          </div>
          
          {/* 关闭按钮 */}
          <DialogPrimitive.Close className="ring-offset-background data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
});

export default MemoDetailDialog;