import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockCoverageAlertProps {
  stockCoverage: number;
  stockExcess?: number;
  stockDeficit?: number;
  fullStock: number;
  averageDailySales: number;
  size?: "sm" | "md" | "lg";
}

export function StockCoverageAlert({
  stockCoverage,
  stockExcess = 0,
  stockDeficit = 0,
  fullStock,
  averageDailySales,
  size = "md",
}: StockCoverageAlertProps) {
  // Determine alert level and color
  let alertLevel: "critical" | "warning" | "good" | "excess";
  let bgColor: string;
  let textColor: string;
  let borderColor: string;
  let icon: React.ReactNode;
  let message: string;

  // CRITICAL: Média de vendas > 0 mas estoque FULL = 0
  if (averageDailySales > 0 && fullStock === 0) {
    alertLevel = "critical";
    bgColor = "bg-red-50";
    textColor = "text-red-700";
    borderColor = "border-red-200";
    icon = <AlertCircle className="w-4 h-4" />;
    message = `❌ CRÍTICO: Sem estoque FULL (demanda: ${averageDailySales}/dia)`;
  } else if (stockCoverage > 100) {
    // Insufficient stock
    if (stockCoverage > 200) {
      alertLevel = "critical";
      bgColor = "bg-red-50";
      textColor = "text-red-700";
      borderColor = "border-red-200";
      icon = <AlertCircle className="w-4 h-4" />;
      message = `❌ CRÍTICO: Faltam ${stockDeficit} unidades`;
    } else {
      alertLevel = "warning";
      bgColor = "bg-yellow-50";
      textColor = "text-yellow-700";
      borderColor = "border-yellow-200";
      icon = <TrendingDown className="w-4 h-4" />;
      message = `⚠️ ATENÇÃO: Faltam ${stockDeficit} unidades`;
    }
  } else {
    // Sufficient stock
    if (stockCoverage < 20) {
      alertLevel = "excess";
      bgColor = "bg-blue-50";
      textColor = "text-blue-700";
      borderColor = "border-blue-200";
      icon = <TrendingUp className="w-4 h-4" />;
      message = `✅ Excedente: ${stockExcess} unidades`;
    } else {
      alertLevel = "good";
      bgColor = "bg-green-50";
      textColor = "text-green-700";
      borderColor = "border-green-200";
      icon = <TrendingUp className="w-4 h-4" />;
      message = `✅ Adequado: ${stockExcess} unidades`;
    }
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
          Cobertura: {stockCoverage}% ({fullStock} un / {averageDailySales}/dia)
        </p>
      </div>
    </div>
  );
}
