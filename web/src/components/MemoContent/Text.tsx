import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
}

const Text: React.FC<Props> = ({ content }: Props) => {
  // 处理优先级符号转换
  const renderContentWithPriority = (text: string) => {
    // 使用正则表达式匹配优先级符号
    const priorityRegex = /(!{1,3})/g;
    const parts = text.split(priorityRegex);
    
    return parts.map((part, index) => {
      if (part.match(/^!{1,3}$/)) {
        // 根据感叹号数量确定优先级
        const priorityLevel = part.length;
        let priorityText = "";
        let priorityClass = "";
        
        switch (priorityLevel) {
          case 1:
            priorityText = "低";
            priorityClass = "text-green-600 bg-green-50 border border-green-200";
            break;
          case 2:
            priorityText = "中";
            priorityClass = "text-yellow-600 bg-yellow-50 border border-yellow-200";
            break;
          case 3:
            priorityText = "高";
            priorityClass = "text-red-600 bg-red-50 border border-red-200";
            break;
          default:
            return part;
        }
        
        return (
          <span
            key={index}
            className={cn(
              "inline-block px-1.5 py-0.5 text-xs font-medium rounded-md mx-0.5",
              priorityClass
            )}
          >
            {priorityText}
          </span>
        );
      }
      
      return part;
    });
  };

  return <span>{renderContentWithPriority(content)}</span>;
};

export default Text;
