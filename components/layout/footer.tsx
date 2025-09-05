import { Badge } from "@/components/ui/badge";

export function Footer() {
  return (
    <footer className="border-t bg-background px-4 py-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>© 2024 Drouple Church Management System</p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            v2.0.0
          </Badge>
        </div>
      </div>
    </footer>
  );
}