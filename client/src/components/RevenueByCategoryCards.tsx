import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevenueCategory {
  category: string;
  revenue: number;
  quantity: number;
  formattedRevenue: string;
}

interface RevenueByCategoryCardsProps {
  data: RevenueCategory[];
  isLoading?: boolean;
}

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  "Rodados": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  "Brinquedos": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  "Utilidades": { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  "Bebês": { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700" },
};

function getCategoryColor(category: string) {
  return categoryColors[category] || { 
    bg: "bg-gray-50", 
    border: "border-gray-200", 
    text: "text-gray-700" 
  };
}

export function RevenueByCategoryCards({ data, isLoading }: RevenueByCategoryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum dado de faturamento disponível
      </div>
    );
  }

  // Calculate total revenue for percentage calculation
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {data.map((item) => {
        const colors = getCategoryColor(item.category);
        const percentage = totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : "0";

        return (
          <Card 
            key={item.category} 
            className={cn("border-2", colors.border, colors.bg)}
          >
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", colors.text)}>
                <TrendingUp className="w-4 h-4" />
                {item.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className={cn("text-2xl font-bold", colors.text)}>
                    R$ {item.formattedRevenue}
                  </p>
                  <p className="text-xs text-gray-600">
                    {percentage}% do total
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    {item.quantity} unidades vendidas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
