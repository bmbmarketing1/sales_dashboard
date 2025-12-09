import { cn } from "@/lib/utils";

interface ThermometerProps {
  value: number;
  goal: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function Thermometer({ value, goal, size = "md", showLabel = true, className }: ThermometerProps) {
  const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  
  // Color based on percentage
  const getColor = () => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 70) return "bg-yellow-500";
    if (percentage >= 40) return "bg-orange-500";
    return "bg-red-500";
  };
  
  const getTextColor = () => {
    if (percentage >= 100) return "text-green-600";
    if (percentage >= 70) return "text-yellow-600";
    if (percentage >= 40) return "text-orange-600";
    return "text-red-600";
  };
  
  const sizeClasses = {
    sm: "h-2 w-16",
    md: "h-3 w-24",
    lg: "h-4 w-32",
  };
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("bg-gray-200 rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn("text-sm font-medium", getTextColor())}>
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

interface ThermometerCardProps {
  title: string;
  value: number;
  goal: number;
  subtitle?: string;
  onClick?: () => void;
}

export function ThermometerCard({ title, value, goal, subtitle, onClick }: ThermometerCardProps) {
  const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  
  const getBgColor = () => {
    if (percentage >= 100) return "border-green-200 bg-green-50";
    if (percentage >= 70) return "border-yellow-200 bg-yellow-50";
    if (percentage >= 40) return "border-orange-200 bg-orange-50";
    return "border-red-200 bg-red-50";
  };
  
  return (
    <div
      className={cn(
        "p-4 rounded-lg border-2 transition-all",
        getBgColor(),
        onClick && "cursor-pointer hover:shadow-md"
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-gray-800">{value}</span>
          <span className="text-sm text-gray-500">/{goal}</span>
        </div>
      </div>
      <Thermometer value={value} goal={goal} size="lg" />
    </div>
  );
}
