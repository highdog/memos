import { PlusIcon, SendIcon, FlagIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { memoStore } from "@/store";
import { Visibility, Memo } from "@/types/proto/api/v1/memo_service";
import { Priority, getPriorityText, getPriorityColor } from "@/utils/priority";

interface TaskInputProps {
  className?: string;
  placeholder?: string;
  onTaskCreated?: () => void;
}

const TaskInput = observer(({ className, placeholder = "添加新任务...", onTaskCreated }: TaskInputProps) => {
  const [content, setContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<Priority>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // 自动调整高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCreateTask();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleCreateTask = useCallback(async () => {
    if (!content.trim() || isCreating) return;

    setIsCreating(true);
    try {
      // 根据选择的优先级获取标记
      let priorityMark = '';
      if (selectedPriority) {
        switch (selectedPriority) {
          case 'high':
            priorityMark = '!!!';
            break;
          case 'medium':
            priorityMark = '!!';
            break;
          case 'low':
            priorityMark = '!';
            break;
        }
      }

      // 将输入内容转换为任务格式，并在勾选框后添加优先级标记
       let taskContent = content
         .split('\n')
         .map(line => {
           const trimmed = line.trim();
           if (!trimmed) return '';
           
           let taskLine = '';
           // 如果不是以 - [ ] 或 - [x] 开头，自动添加
           if (!trimmed.match(/^-\s*\[[x\s]\]/)) {
             taskLine = `- [ ] ${priorityMark ? priorityMark : ''}${trimmed}`;
           } else {
             // 如果已经是任务格式，在勾选框后添加优先级标记
             if (priorityMark) {
               taskLine = trimmed.replace(/^(-\s*\[[x\s]\]\s*)/, `$1${priorityMark}`);
             } else {
               taskLine = trimmed;
             }
           }
           
           return taskLine;
         })
         .filter(line => line)
         .join('\n');

      // 创建新的笔记
      await memoStore.createMemo({
        memo: Memo.fromPartial({
          content: taskContent,
          visibility: Visibility.PRIVATE,
        }),
        memoId: "",
        validateOnly: false,
        requestId: "",
      });

      setContent("");
      setSelectedPriority(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      onTaskCreated?.();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsCreating(false);
    }
  }, [content, isCreating, selectedPriority, onTaskCreated]);

  const handleCancel = () => {
    setContent("");
    setSelectedPriority(null);
    setIsFocused(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.blur();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    if (!content.trim()) {
      setIsFocused(false);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div 
        className={cn(
          "border rounded-lg transition-all duration-200",
          isFocused || content ? "border-primary shadow-sm" : "border-border"
        )}
      >
        <div className="p-4">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={cn(
              "min-h-[60px] resize-none border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-muted-foreground/60"
            )}
            style={{ height: 'auto' }}
          />
          
          {(isFocused || content) && (
            <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-border">
              {/* 优先级选择 */}
              <div className="flex items-center gap-2">
                <FlagIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">优先级：</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={selectedPriority === null ? 'default' : 'outline'}
                    onClick={() => setSelectedPriority(null)}
                    className="text-xs h-7"
                  >
                    无
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedPriority === 'low' ? 'default' : 'outline'}
                    onClick={() => setSelectedPriority('low')}
                    className="text-xs h-7"
                  >
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor('low')} mr-1`}></div>
                    低
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedPriority === 'medium' ? 'default' : 'outline'}
                    onClick={() => setSelectedPriority('medium')}
                    className="text-xs h-7"
                  >
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor('medium')} mr-1`}></div>
                    中
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedPriority === 'high' ? 'default' : 'outline'}
                    onClick={() => setSelectedPriority('high')}
                    className="text-xs h-7"
                  >
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor('high')} mr-1`}></div>
                    高
                  </Button>
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isCreating}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateTask}
                  disabled={!content.trim() || isCreating}
                  className="min-w-[80px]"
                >
                  {isCreating ? (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      <span>创建中</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <SendIcon className="w-3 h-3" />
                      <span>创建任务</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      

    </div>
  );
});

export default TaskInput;