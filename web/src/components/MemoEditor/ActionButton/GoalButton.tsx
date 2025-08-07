import { TargetIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EditorRefActions } from "../Editor";

interface Props {
  editorRef: React.RefObject<EditorRefActions>;
}

const GoalButton = observer((props: Props) => {
  const { editorRef } = props;

  const handleGoalClick = () => {
    const current = editorRef.current;
    if (current === null) return;

    const content = current.getContent();
    const cursorPosition = current.getCursorPosition();
    
    // 找到当前行的开始位置
    const beforeCursor = content.substring(0, cursorPosition);
    const lastNewlineIndex = beforeCursor.lastIndexOf('\n');
    const lineStart = lastNewlineIndex === -1 ? 0 : lastNewlineIndex + 1;
    const currentLine = content.substring(lineStart, content.indexOf('\n', lineStart) === -1 ? content.length : content.indexOf('\n', lineStart));

    // 如果当前行为空，直接插入目标标记
    if (currentLine.trim() === '') {
      current.insertText('-[0] 目标名称 (0/10)');
    } else {
      // 如果当前行有内容，在新行插入目标标记
      const lineEnd = content.indexOf('\n', lineStart);
      if (lineEnd === -1) {
        // 当前行是最后一行
        current.setCursorPosition(content.length);
        current.insertText('\n-[0] 目标名称 (0/10)');
      } else {
        // 在当前行末尾插入新行和目标标记
        current.setCursorPosition(lineEnd);
        current.insertText('\n-[0] 目标名称 (0/10)');
      }
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={handleGoalClick}>
            <TargetIcon className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>添加目标</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export default GoalButton;