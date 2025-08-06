import { CalendarIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/utils/i18n";
import { EditorRefActions } from "../Editor";

interface Props {
  editorRef: React.RefObject<EditorRefActions>;
}

const ScheduleButton = observer((props: Props) => {
  const t = useTranslate();
  const { editorRef } = props;

  const handleScheduleClick = () => {
    const current = editorRef.current;
    if (current === null) return;

    const content = current.getContent();
    const cursorPosition = current.getCursorPosition();
    
    // 找到当前行的开始位置
    const beforeCursor = content.substring(0, cursorPosition);
    const lastNewlineIndex = beforeCursor.lastIndexOf('\n');
    const lineStart = lastNewlineIndex === -1 ? 0 : lastNewlineIndex + 1;
    const currentLine = content.substring(lineStart, content.indexOf('\n', lineStart) === -1 ? content.length : content.indexOf('\n', lineStart));

    // 如果当前行为空，直接插入日程标记
    if (currentLine.trim() === '') {
      current.insertText('-{} ');
    } else {
      // 如果当前行有内容，在新行插入日程标记
      const lineEnd = content.indexOf('\n', lineStart);
      if (lineEnd === -1) {
        // 当前行是最后一行
        current.setCursorPosition(content.length);
        current.insertText('\n-{} ');
      } else {
        // 在当前行末尾插入新行和日程标记
        current.setCursorPosition(lineEnd);
        current.insertText('\n-{} ');
      }
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleScheduleClick} title="添加日程">
      <CalendarIcon className="size-5" />
    </Button>
  );
});

export default ScheduleButton;