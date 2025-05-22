import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor: string;
  iconBgColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function StatCard({
  title,
  value,
  icon,
  iconColor,
  iconBgColor,
  trend
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-neutral-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-neutral-500 text-sm">{title}</p>
          <h3 className="text-2xl font-semibold mt-1 text-neutral-800">{value}</h3>
        </div>
        <div className={cn("p-2 rounded-full", iconBgColor)}>
          <span className={cn("material-icons", iconColor)}>{icon}</span>
        </div>
      </div>
      {trend && (
        <div className="mt-2 text-xs">
          <span className={cn(
            "flex items-center",
            trend.isPositive ? "text-green-500" : "text-red-500"
          )}>
            <span className="material-icons text-sm mr-1">
              {trend.isPositive ? "arrow_upward" : "arrow_downward"}
            </span>
            <span>{trend.value}</span>
          </span>
        </div>
      )}
    </div>
  );
}
