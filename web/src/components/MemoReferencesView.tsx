import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { memoStore, memoDetailStore } from "@/store";
import { Memo, MemoRelation_Type } from "@/types/proto/api/v1/memo_service";

interface Props {
  memo: Memo;
  className?: string;
}

const MemoReferencesView: React.FC<Props> = observer(({ memo, className }: Props) => {
  // 获取当前笔记引用的其他笔记
  const referencedMemos = useMemo(() => {
    const referencingRelations = memo.relations.filter(
      (relation) => 
        relation.type === MemoRelation_Type.REFERENCE && 
        relation.relatedMemo?.name !== memo.name &&
        relation.memo?.name === memo.name
    );
    
    return referencingRelations
      .map((relation) => {
        const referencedMemo = memoStore.getMemoByName(relation.relatedMemo!.name);
        return referencedMemo ? { memo: referencedMemo, snippet: relation.relatedMemo!.snippet } : null;
      })
      .filter((item) => item !== null) as { memo: Memo; snippet: string }[];
  }, [memo.relations, memo.name]);

  const handleReferenceClick = (referencedMemo: Memo) => {
    // 以弹窗形式显示被引用的笔记
    memoDetailStore.setSelectedMemo(referencedMemo);
  };

  // 获取显示文本：优先使用 snippet，否则使用笔记内容的前30个字符
  const getDisplayText = (memo: Memo, snippet: string) => {
    if (snippet && snippet.trim()) {
      return snippet.trim();
    }
    // 如果没有 snippet，使用笔记内容的前30个字符
    const content = memo.content.trim();
    if (content.length > 30) {
      return content.substring(0, 30) + '...';
    }
    return content;
  };

  if (referencedMemos.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1 items-center mt-2 pt-2 border-t border-border/50">
        {referencedMemos.map(({ memo: referencedMemo, snippet }, index) => (
          <span key={referencedMemo.name} className="inline-flex items-center">
            <span
              className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-sm"
              onClick={() => handleReferenceClick(referencedMemo)}
              title={referencedMemo.content.substring(0, 100)}
            >
              @{getDisplayText(referencedMemo, snippet)}
            </span>
            {index < referencedMemos.length - 1 && (
              <span className="text-muted-foreground mx-1 text-xs">·</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
});

export default MemoReferencesView;