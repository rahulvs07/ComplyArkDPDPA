import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "small" | "medium" | "large";
}

export function Spinner({ className, size = "medium" }: SpinnerProps) {
  const sizeClass = {
    small: "h-4 w-4 border-2",
    medium: "h-8 w-8 border-3",
    large: "h-12 w-12 border-4",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-solid border-primary-500 border-t-transparent",
        sizeClass[size],
        className
      )}
    />
  );
}
