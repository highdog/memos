import { LoaderIcon, SendIcon, XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { memoStore } from "@/store";
import { Memo } from "@/types/proto/api/v1/memo_service";
import { useTranslate } from "@/utils/i18n";
import { cn } from "@/lib/utils";

export interface Props {
  className?: string;
  placeholder?: string;
  memoName?: string;
  autoFocus?: boolean;
  onConfirm?: (memoName: string) => void;
  onCancel?: () => void;
}

const SimpleMemoEditor = observer((props: Props) => {
  const { className, memoName, autoFocus, onConfirm, onCancel } = props;
  const t = useTranslate();
  const [content, setContent] = useState<string>("");
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      // 将光标移到文本末尾
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [autoFocus]);

  useEffect(() => {
    const loadMemo = async () => {
      if (memoName) {
        const memo = await memoStore.getOrFetchMemoByName(memoName);
        if (memo) {
          setContent(memo.content ?? "");
        }
      }
    };
    loadMemo();
  }, [memoName]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const isMetaKey = event.ctrlKey || event.metaKey;
    if (isMetaKey && event.key === "Enter") {
      event.preventDefault();
      handleSave();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
      return;
    }
  };

  const handleSave = async () => {
    if (isRequesting || !content.trim()) {
      return;
    }

    setIsRequesting(true);
    try {
      if (memoName) {
        const prevMemo = await memoStore.getOrFetchMemoByName(memoName);
        if (prevMemo && content !== prevMemo.content) {
          const memo = await memoStore.updateMemo(
            {
              name: prevMemo.name,
              content: content.trim(),
            },
            ["content", "update_time"]
          );
          if (onConfirm) {
            onConfirm(memo.name);
          }
        } else {
          // 内容没有变化，直接取消编辑
          handleCancel();
        }
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.details || "保存失败");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };

  const allowSave = content.trim() !== "" && !isRequesting;

  return (
    <div
      className={cn(
        "w-full flex flex-col justify-start items-start bg-background p-2 rounded border border-border",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        className="w-full min-h-[80px] resize-none border-none outline-none bg-transparent text-sm leading-relaxed"
        placeholder={props.placeholder ?? t("editor.any-thoughts")}
        value={content}
        onChange={handleContentChange}
        onKeyDown={handleKeyDown}
      />
      
      <div className="w-full flex flex-row justify-end items-center gap-2 mt-2">
        <Button 
          variant="ghost" 
          size="sm"
          disabled={isRequesting} 
          onClick={handleCancel}
          className="h-7 px-2"
        >
          <XIcon className="w-3 h-3 mr-1" />
          {t("common.cancel")}
        </Button>
        <Button 
          size="sm"
          disabled={!allowSave} 
          onClick={handleSave}
          className="h-7 px-2"
        >
          {!isRequesting ? (
            <>
              <SendIcon className="w-3 h-3 mr-1" />
              {t("editor.save")}
            </>
          ) : (
            <>
              <LoaderIcon className="w-3 h-3 mr-1 animate-spin" />
              {t("editor.save")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

export default SimpleMemoEditor;