import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface ListItemProps {
  title: string;
  description?: string;
  meta?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  showArrow?: boolean;
}

export function ListItem({
  title,
  description,
  meta,
  href,
  onClick,
  className,
  showArrow = true,
}: ListItemProps) {
  const content = (
    <div className={cn("list-item p-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          {meta && <div className="mt-2">{meta}</div>}
        </div>
        {showArrow && (href || onClick) && (
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-4" />
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return content;
}