import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
}

const Text: React.FC<Props> = ({ content }: Props) => {
  // 处理符号转换（优先级、目标、打卡）
  const renderContentWithSymbols = (text: string) => {
    // 使用正则表达式匹配各种符号
    const symbolRegex = /(!{1,3}|-\[0\]|-\[\*\])/g;
    const parts = text.split(symbolRegex);
    
    return parts.map((part, index) => {
      // 处理优先级符号
      if (part.match(/^!{1,3}$/)) {
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
      
      // 处理目标符号 -[0]
      if (part === "-[0]") {
        return (
          <span
            key={index}
            className="inline-block text-blue-600 font-medium mx-0.5"
            title="目标"
          >
            🎯
          </span>
        );
      }
      
      // 处理打卡符号 -[*]
      if (part === "-[*]") {
        return (
          <span
            key={index}
            className="inline-block text-yellow-600 font-medium mx-0.5"
            title="打卡"
          >
            ⭐
          </span>
        );
      }
      
      return part;
    });
  };

  return <span>{renderContentWithSymbols(content)}</span>;
};

export default Text;
