import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopNavProps {
  title: string;
  onMenuClick: () => void;
}

export default function TopNav({ title, onMenuClick }: TopNavProps) {
  return (
    <div className="flex items-center h-16 px-4 border-b bg-background">
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden mr-2" 
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex items-center justify-between w-full">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="flex items-center space-x-2">
          {/* Additional header items can go here */}
        </div>
      </div>
    </div>
  );
}