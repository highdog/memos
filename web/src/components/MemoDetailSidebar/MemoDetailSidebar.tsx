import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import MemoEditor from "@/components/MemoEditor";
import MemoView from "@/components/MemoView";
import { cn } from "@/lib/utils";
import { memoStore, memoDetailStore } from "@/store";
import { Memo, MemoRelation_Type } from "@/types/proto/api/v1/memo_service";

interface Props {
  memo: Memo;
  className?: string;
  parentPage?: string;
}

const MemoDetailSidebar = ({ memo, className, parentPage }: Props) => {
  const [showRelatedMemoEditor, setShowRelatedMemoEditor] = useState(false);

  // 获取关联笔记
  const referencingRelations = 
    memo?.relations.filter((relation) => relation.type === MemoRelation_Type.REFERENCE && relation.relatedMemo?.name !== memo.name) || [];
  const referencingMemos = referencingRelations.map((relation) => memoStore.getMemoByName(relation.relatedMemo!.name)).filter((memo) => memo) as any as Memo[];

  const referencedByRelations = 
    memo?.relations.filter((relation) => relation.type === MemoRelation_Type.REFERENCE && relation.relatedMemo?.name === memo.name) || [];
  const referencedByMemos = referencedByRelations.map((relation) => memoStore.getMemoByName(relation.memo!.name)).filter((memo) => memo) as any as Memo[];

  const handleShowRelatedMemoEditor = () => {
    setShowRelatedMemoEditor(true);
  };

  const handleRelatedMemoCreated = async (relatedMemoName: string) => {
    await memoStore.getOrFetchMemoByName(relatedMemoName);
    const updatedMemo = await memoStore.getOrFetchMemoByName(memo.name, { skipCache: true });
    
    // 如果当前笔记是在详情弹窗中显示的，则更新 memoDetailStore 中的数据
    if (memoDetailStore.selectedMemo && memoDetailStore.selectedMemo.name === memo.name) {
      memoDetailStore.updateSelectedMemo(updatedMemo);
    }
    
    setShowRelatedMemoEditor(false);
  };

  return (
    <aside
      className={cn("relative w-full h-auto max-h-screen overflow-auto hide-scrollbar flex flex-col justify-start items-start", className)}
    >
      <div className="flex flex-col justify-start items-start w-full px-1 gap-2 h-auto shrink-0 flex-nowrap hide-scrollbar">
        {/* 当前笔记引用的其他笔记 */}
        {referencingMemos.length > 0 && (
          <div className="mb-4 w-full">
            <div className="w-full flex flex-row justify-between items-center h-8 pl-2 mb-2">
              <div className="flex flex-row justify-start items-center">
                <span className="text-muted-foreground text-sm">引用的笔记</span>
                <span className="text-muted-foreground text-sm ml-1">({referencingMemos.length})</span>
              </div>
            </div>
            <div className="w-full space-y-2">
              {referencingMemos
                .sort((a, b) => new Date(a.createTime!).getTime() - new Date(b.createTime!).getTime())
                .map((referencingMemo) => (
                  <div key={`referencing-${referencingMemo.name}-${referencingMemo.displayTime}`} className="w-full">
                    <MemoView
                      memo={referencingMemo}
                      parentPage={parentPage}
                      showCreator={false}
                      compact={true}
                      className="!mb-0 !w-full min-w-full"
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
        
        {/* 引用当前笔记的其他笔记 (Referenced by) */}
        <div className="mb-4 w-full">
          <div className="w-full flex flex-row justify-between items-center h-8 pl-2 mb-2">
            <div className="flex flex-row justify-start items-center">
              <span className="text-muted-foreground text-sm">Referenced by</span>
              <span className="text-muted-foreground text-sm ml-1">({referencedByMemos.length})</span>
            </div>
            {/* 创建关联笔记按钮 - 加号 */}
            <Button 
              variant="ghost" 
              size="sm"
              className="h-6 w-6 p-0 hover:bg-primary/10"
              onClick={() => {
                console.log('侧边栏创建关联笔记按钮被点击');
                handleShowRelatedMemoEditor();
              }}
              title="创建关联笔记"
            >
              <PlusIcon className="w-3 h-3 text-primary" />
            </Button>
          </div>
          {referencedByMemos.length > 0 && (
            <div className="w-full space-y-2">
              {referencedByMemos
                .sort((a, b) => new Date(a.createTime!).getTime() - new Date(b.createTime!).getTime())
                .map((referencedByMemo) => (
                  <div key={`referenced-by-${referencedByMemo.name}-${referencedByMemo.displayTime}`} className="w-full">
                    <MemoView
                      memo={referencedByMemo}
                      parentPage={parentPage}
                      showCreator={false}
                      compact={true}
                      className="!mb-0 !w-full min-w-full"
                    />
                  </div>
                ))}
            </div>
          )}
          {showRelatedMemoEditor && (
            <div className="w-full mt-2">
              <MemoEditor
                cacheKey={`${memo.name}-${memo.updateTime}-related-sidebar`}
                placeholder="创建一个关联到当前笔记的新笔记..."
                initialRelations={[
                  {
                    memo: { name: "", snippet: "" },
                    relatedMemo: { name: memo.name, snippet: memo.content.substring(0, 100) },
                    type: MemoRelation_Type.REFERENCE,
                  },
                ]}
                autoFocus
                onConfirm={handleRelatedMemoCreated}
                onCancel={() => setShowRelatedMemoEditor(false)}
              />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default MemoDetailSidebar;
