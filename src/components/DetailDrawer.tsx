import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Minus, Check } from "lucide-react";

export interface DetailDrawerItem {
  name: string;
  description: string;
  tags?: string[];
  source?: { book: string; page: number };
  meta?: { label: string; value: string }[];
}

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: DetailDrawerItem | null;
  actions?: {
    label: string;
    icon?: React.ReactNode;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
    onClick: () => void;
    disabled?: boolean;
  }[];
}

export function DetailDrawer({ open, onOpenChange, item, actions }: DetailDrawerProps) {
  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[450px] overflow-y-auto" aria-describedby="detail-drawer-desc">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">{item.name}</SheetTitle>
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </SheetHeader>

        <div id="detail-drawer-desc" className="space-y-4 pb-6">
          {/* Meta info */}
          {item.meta && item.meta.length > 0 && (
            <div className="rounded-lg border bg-secondary/30 p-3 space-y-1.5">
              {item.meta.map((m) => (
                <div key={m.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-medium">{m.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {item.description}
          </div>

          {/* Source */}
          {item.source && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <span>
                {item.source.book}
                {item.source.page > 0 && `, p. ${item.source.page}`}
              </span>
            </div>
          )}

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="flex flex-col gap-2 pt-2">
              {actions.map((action, i) => (
                <Button
                  key={i}
                  variant={action.variant ?? "default"}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="w-full"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
