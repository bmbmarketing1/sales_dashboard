import { AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductInsightBadgeProps {
  totalQuantity: number;
  expectedQuantity: number;
  totalStock: number;
  dailyAverage: number;
  daysInPeriod: number;
}

export function ProductInsightBadge({
  totalQuantity,
  expectedQuantity,
  totalStock,
  dailyAverage,
  daysInPeriod,
}: ProductInsightBadgeProps) {
  // Calculate insights
  const percentageOfGoal = expectedQuantity > 0 ? (totalQuantity / expectedQuantity) * 100 : 0;
  const isAboveGoal = totalQuantity > expectedQuantity;
  const daysUntilStockOut = dailyAverage > 0 ? Math.floor(totalStock / dailyAverage) : 0;
  const isStockSufficient = totalStock >= expectedQuantity;
  
  // Determine insight type and message
  let insightType: "sufficient" | "above" | "critical" | "warning" = "sufficient";
  let message = "";
  let icon = null;
  let bgColor = "bg-green-50";
  let textColor = "text-green-700";
  let borderColor = "border-green-200";
  
  if (isAboveGoal) {
    insightType = "above";
    message = `Acima da meta! ${percentageOfGoal.toFixed(0)}% ✓`;
    icon = <CheckCircle className="w-4 h-4" />;
    bgColor = "bg-blue-50";
    textColor = "text-blue-700";
    borderColor = "border-blue-200";
  } else if (!isStockSufficient && dailyAverage > 0) {
    insightType = "critical";
    message = `Estoque insuficiente! Faltam ${Math.ceil(expectedQuantity - totalStock)} un`;
    icon = <AlertTriangle className="w-4 h-4" />;
    bgColor = "bg-red-50";
    textColor = "text-red-700";
    borderColor = "border-red-200";
  } else if (isStockSufficient && daysUntilStockOut < 30) {
    insightType = "warning";
    message = `Estoque suficiente por ${daysUntilStockOut} dias`;
    icon = <TrendingUp className="w-4 h-4" />;
    bgColor = "bg-yellow-50";
    textColor = "text-yellow-700";
    borderColor = "border-yellow-200";
  } else {
    insightType = "sufficient";
    message = `Estoque OK! ${daysUntilStockOut}+ dias`;
    icon = <CheckCircle className="w-4 h-4" />;
    bgColor = "bg-green-50";
    textColor = "text-green-700";
    borderColor = "border-green-200";
  }
  
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border",
        bgColor,
        textColor,
        borderColor
      )}
    >
      {icon}
      <span>{message}</span>
    </div>
  );
}
