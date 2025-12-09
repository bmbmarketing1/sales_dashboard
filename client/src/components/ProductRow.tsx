import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Thermometer } from "./Thermometer";
import { GoalEditor } from "./GoalEditor";
import { Settings, ChevronDown, ChevronUp, ExternalLink, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChannelSale {
  channelId: number;
  channelName: string;
  quantity: number;
  channelGoal: number;
  periodGoal?: number;
}

interface ProductWithSales {
  id: number;
  externalId?: number;
  internalCode: string;
  description: string;
  name?: string;
  dailyGoal: number;
  periodGoal?: number;
  totalSales: number;
  totalRevenue?: number;
  channelSales: ChannelSale[];
}

interface ProductRowProps {
  product: ProductWithSales;
  onGoalUpdated?: () => void;
  periodLabel?: string;
}

export function ProductRow({ product, onGoalUpdated, periodLabel }: ProductRowProps) {
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
      <div className={cn(
        "bg-white rounded-lg border border-l-4 transition-all hover:shadow-md",
        getBorderColor()
      )}>
        {/* Main row */}
        <div className="flex items-center gap-4 p-3">
          {/* Reference (Code) */}
          <div className="w-20 shrink-0">
            <span className="text-sm font-medium text-gray-500">
              {product.internalCode}
            </span>
          </div>
          
          {/* Name */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {product.description}
            </p>
          </div>
          
          {/* Sales / Goal + Thermometer */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-lg font-bold text-gray-800">
                {product.totalSales}
              </span>
              <span className="text-sm text-gray-500 ml-1">
                / {product.dailyGoal}
              </span>
            </div>
            <Thermometer 
              value={product.totalSales} 
              goal={product.dailyGoal} 
              size="lg" 
            />
          </div>
          
          {/* Revenue */}
          <div className="flex items-center gap-1 shrink-0 min-w-[100px]">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-gray-700">
              {((product.totalRevenue || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex items-center gap-1 shrink-0">
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
          
          {/* Expand button */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 shrink-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Ocultar
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Canais
              </>
            )}
          </Button>
        </div>
        
        {/* Channel breakdown (expanded) */}
        {expanded && (
          <div className="px-3 pb-3 pt-0">
            <div className="border-t pt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
              {product.channelSales.map((channel) => {
                const goalToShow = channel.periodGoal ?? channel.channelGoal;
                return (
                  <div 
                    key={channel.channelId}
                    className="flex items-center justify-between bg-gray-50 rounded-lg p-2"
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{getChannelIcon(channel.channelName)}</span>
                      <span className="text-xs text-gray-600">{channel.channelName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {channel.quantity}/{goalToShow || "-"}
                      </span>
                      {goalToShow > 0 && (
                        <Thermometer 
                          value={channel.quantity} 
                          goal={goalToShow} 
                          size="sm" 
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      <GoalEditor
        open={goalEditorOpen}
        onOpenChange={setGoalEditorOpen}
        product={product}
        onSuccess={onGoalUpdated}
      />
    </>
  );
}
