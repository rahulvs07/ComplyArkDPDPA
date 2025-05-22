import React from "react";
import { cn } from "@/lib/utils";
import { Check, Edit, Clock, AlertCircle } from "lucide-react";

export type TimelineItem = {
  title: string;
  date: string;
  description?: string;
  icon?: "check" | "edit" | "clock" | "alert";
  color?: string;
};

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  if (!items.length) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <ol className="relative border-l border-muted-foreground/20">
        {items.map((item, index) => (
          <li key={index} className="mb-6 ml-6">
            <span
              className={cn(
                "absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-4 ring-background",
                item.color || "bg-primary text-primary-foreground"
              )}
            >
              {item.icon === "edit" ? (
                <Edit className="w-4 h-4" />
              ) : item.icon === "clock" ? (
                <Clock className="w-4 h-4" />
              ) : item.icon === "alert" ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </span>
            <h3 className="font-semibold leading-tight pt-2">{item.title}</h3>
            <time className="text-sm text-muted-foreground">{item.date}</time>
            {item.description && (
              <p className="text-base mt-2">{item.description}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}