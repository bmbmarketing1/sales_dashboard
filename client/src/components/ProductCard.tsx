import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Thermometer } from "./Thermometer";
import { GoalEditor } from "./GoalEditor";
import { Settings, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChannelSale {
  channelId: number;
  channelName: string;
  quantity: number;
  channelGoal: number;
}

interface ProductWithSales {
  id: number;
  externalId: number;
  internalCode: string;
  description: string;
  dailyGoal: number;
  totalSales: number;
  channelSales: ChannelSale[];
}

interface ProductCardProps {
  product: ProductWithSales;
  onGoalUpdated?: () => void;
}

export function ProductCard({ product, onGoalUpdated }: ProductCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [goalEditorOpen, setGoalEditorOpen] = useState(false);
  
  const percentage = product.dailyGoal > 0 
    ? Math.min((product.totalSales / product.dailyGoal) * 100, 100) 
    : 0;
  
  const getBorderColor = () => {
    if (percentage >= 100) return "border-l-green-500";
    if (percentage >= 70) return "border-l-yellow-500";
    if (percentage >= 40) return "border-l-orange-500";
    return "border-l-red-500";
  };
  
  const getChannelIcon = (name: string) => {
    const icons: Record<string, string> = {
      "Amazon": "🛒",
      "Magalu": "🏪",
      "Mercado Livre": "🛍️",
      "Shopee": "🧡",
      "TikTok": "🎵",
    };
    return icons[name] || "📦";
  };
  
  return (
    <>
      <Card className={cn("border-l-4 transition-all hover:shadow-md", getBorderColor())}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-sm font-medium text-gray-500">
                {product.internalCode}
              </CardTitle>
              <p className="text-base font-semibold text-gray-800 line-clamp-1">
                {product.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                asChild
              >
                <Link href={`/produto/${product.id}`}>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setGoalEditorOpen(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Main thermometer */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-800">
                {product.totalSales}
              </span>
              <span className="text-sm text-gray-500">
                / {product.dailyGoal} meta
              </span>
            </div>
            <Thermometer 
              value={product.totalSales} 
              goal={product.dailyGoal} 
              size="lg" 
            />
          </div>
          
          {/* Expand/collapse button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-gray-500 hover:text-gray-700"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Ocultar canais
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Ver por canal
              </>
            )}
          </Button>
          
          {/* Channel breakdown */}
          {expanded && (
            <div className="mt-3 space-y-2 pt-3 border-t">
              {product.channelSales.map((channel) => (
                <div 
                  key={channel.channelId}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center gap-2">
                    <span>{getChannelIcon(channel.channelName)}</span>
                    <span className="text-sm text-gray-700">{channel.channelName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {channel.quantity}/{channel.channelGoal || "-"}
                    </span>
                    {channel.channelGoal > 0 && (
                      <Thermometer 
                        value={channel.quantity} 
                        goal={channel.channelGoal} 
                        size="sm" 
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <GoalEditor
        open={goalEditorOpen}
        onOpenChange={setGoalEditorOpen}
        product={product}
        onSuccess={onGoalUpdated}
      />
    </>
  );
}
