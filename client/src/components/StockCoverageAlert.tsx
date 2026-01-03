import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockCoverageAlertProps {
  fullStock: number;
  averageDailySales: number;
  size?: "sm" | "md" | "lg";
}

export function StockCoverageAlert({
  fullStock,
  averageDailySales,
  size = "md",
}: StockCoverageAlertProps) {
  // Calculate days of coverage: fullStock / averageDailySales
  const daysOfCoverage = averageDailySales > 0 ? fullStock / averageDailySales : 0;

  // Determine alert level and color based on days of coverage
  let alertLevel: "critical" | "sufficient" | "excess";
  let bgColor: string;
  let textColor: string;
  let borderColor: string;
  let icon: React.ReactNode;
  let message: string;
  let subtitle: string;

  if (daysOfCoverage < 30) {
    // CRITICAL: Less than 30 days of coverage
    alertLevel = "critical";
    bgColor = "bg-red-50";
    textColor = "text-red-700";
    borderColor = "border-red-200";
    icon = <AlertCircle className="w-4 h-4" />;
    message = `❌ CRÍTICO: ${daysOfCoverage.toFixed(1)} dias de cobertura`;
    subtitle = `Estoque: ${fullStock} un / Demanda: ${averageDailySales.toFixed(2)}/dia`;
  } else if (daysOfCoverage <= 60) {
    // SUFFICIENT: 30-60 days of coverage
    alertLevel = "sufficient";
    bgColor = "bg-green-50";
    textColor = "text-green-700";
    borderColor = "border-green-200";
    icon = <TrendingUp className="w-4 h-4" />;
    message = `✅ SUFICIENTE: ${daysOfCoverage.toFixed(1)} dias de cobertura`;
    subtitle = `Estoque: ${fullStock} un / Demanda: ${averageDailySales.toFixed(2)}/dia`;
  } else {
    // EXCESS: More than 60 days of coverage
    alertLevel = "excess";
    bgColor = "bg-blue-50";
    textColor = "text-blue-700";
    borderColor = "border-blue-200";
    icon = <TrendingUp className="w-4 h-4" />;
    message = `📦 EXCEDENTE: ${daysOfCoverage.toFixed(1)} dias de cobertura`;
    subtitle = `Estoque: ${fullStock} un / Demanda: ${averageDailySales.toFixed(2)}/dia`;
  }

  // Size variants
  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-2 text-sm gap-2",
    lg: "px-4 py-3 text-base gap-2",
  };

  const iconSize = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border",
        sizeClasses[size],
        bgColor,
        borderColor,
        textColor
      )}
    >
      <div className={cn("flex-shrink-0", iconSize[size])}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{message}</p>
        <p className="text-xs opacity-75">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
