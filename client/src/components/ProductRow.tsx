import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Thermometer } from "./Thermometer";
import { GoalEditor } from "./GoalEditor";
import { ProductListingLinks } from "./ProductListingLinks";
import { Settings, ChevronDown, ChevronUp, ExternalLink, DollarSign, AlertCircle, CheckCircle, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Função para formatar valores monetários grandes de forma compacta
const formatCurrency = (value: number): string => {
  if (value >= 1000000000) {
    return `R$ ${(value / 1000000000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} bi`;
  }
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mi`;
  }
  if (value >= 100000) {
    return `R$ ${(value / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`;
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

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
  avgSalesPerDay?: number;
  channelSales: ChannelSale[];
  totalStock?: number;
  crossdockingStock?: number;
  daysOfStockAvailable?: number;
  stockCoveragePercentage?: number;
  riskLevel?: 'green' | 'yellow' | 'red';
  marketplaceDistribution?: Array<{channelId: number; channelName: string; stock: number; percentage: number}>;
  reabastecimentoRecomendado?: number;
  previsaoFaltaEstoque?: number | null;
}

interface ProductRowProps {
  product: ProductWithSales;
  onGoalUpdated?: () => void;
  periodLabel?: string;
  periodDays?: number;
}

interface ProductRowPropsWithChannel extends ProductRowProps {
  channelId?: number;
}

export function ProductRow({ product, onGoalUpdated, periodLabel, periodDays = 30, channelId }: ProductRowPropsWithChannel) {
  const [expanded, setExpanded] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [goalEditorOpen, setGoalEditorOpen] = useState(false);
  const [stockData, setStockData] = useState<{ fullStock: number; crossStock: number } | null>(null);
  
  const stockQuery = channelId && product.id ? trpc.listings.getByProductAndChannel.useQuery({
    productId: product.id,
    channelId: channelId,
  }) : null;
  const stock = stockQuery?.data || null;
  
  useEffect(() => {
    if (stock) {
      setStockData({
        fullStock: stock.fullStock || 0,
        crossStock: stock.crossStock || 0
      });
    }
  }, [stock]);
  
  
  // Calcular média de vendas por dia usando o período correto
  const averageSalesPerDay = periodDays > 0 ? product.totalSales / periodDays : 0;
  
  const percentage = product.dailyGoal > 0 
    ? Math.min((product.totalSales / product.dailyGoal) * 100, 100) 
    : 0;
  
  const getBorderColor = () => {
    if (percentage >= 100) return "border-l-green-500";
    if (percentage >= 70) return "border-l-yellow-500";
    if (percentage >= 40) return "border-l-orange-500";
    return "border-l-red-500";
  };
  
  const getStockRiskColor = () => {
    if (product.riskLevel === 'red') return 'bg-red-50 border-l-red-500';
    if (product.riskLevel === 'yellow') return 'bg-yellow-50 border-l-yellow-500';
    if (product.riskLevel === 'green') return 'bg-green-50 border-l-green-500';
    return 'bg-white';
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
  
  const getRiskMessage = () => {
    if (product.riskLevel === 'red') {
      return `Crítico: Estoque insuficiente para atingir a meta. Faltarão ${product.reabastecimentoRecomendado} unidades`;
    }
    if (product.riskLevel === 'yellow') {
      return `Atenção: Estoque baixo. Recomendação: reabastecer ${product.reabastecimentoRecomendado} unidades`;
    }
    return `Adequado: ${product.daysOfStockAvailable} dias de estoque disponível. Cobertura: ${product.stockCoveragePercentage}% da meta`;
  };
  
  return (
    <>
      <div className={cn(
        "rounded-lg border border-l-4 transition-all hover:shadow-md",
        getBorderColor(),
        getStockRiskColor()
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
              <div className="text-xs text-gray-400 mt-1">
                Média {averageSalesPerDay.toFixed(1)}/dia
              </div>
            </div>
            <Thermometer 
              value={product.totalSales} 
              goal={product.dailyGoal} 
              size="lg" 
            />
          </div>
          
          {/* Stock with Risk Indicator */}
          {/* Estoque por tipo (FULL e CROSS) */}
          {stockData && (
            <div className="text-xs text-gray-600 mb-1">
              FULL - {stockData.fullStock} | CROSS - {stockData.crossStock}
            </div>
          )}
          <div className="flex items-center gap-2 shrink-0 min-w-[120px]">
            <div className="text-right flex-1">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-sm font-semibold text-gray-700">
                  {product.totalStock || 0}
                </span>
                {product.riskLevel === 'red' && (
                  <div className="w-2 h-2 rounded-full bg-red-500" title="Risco crítico" />
                )}
                {product.riskLevel === 'yellow' && (
                  <div className="w-2 h-2 rounded-full bg-yellow-500" title="Atenção" />
                )}
                {product.riskLevel === 'green' && (
                  <div className="w-2 h-2 rounded-full bg-green-500" title="Adequado" />
                )}
              </div>
              <div className="text-xs text-gray-400">
                {product.daysOfStockAvailable ? `${product.daysOfStockAvailable}d` : 'estoque'}
              </div>
            </div>
          </div>
          
          {/* Revenue */}
          <div className="flex items-center gap-1 shrink-0 min-w-[100px]">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-gray-700">
              {formatCurrency((product.totalRevenue || 0) / 100)}
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
        
        {/* Stock Alert (all levels - red, yellow, green) */}
        {product.riskLevel && (
          <div className={cn(
            "px-3 py-2 border-t flex items-start gap-2",
            product.riskLevel === 'red' ? 'bg-red-50 border-red-200' :
            product.riskLevel === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
            'bg-green-50 border-green-200'
          )}>
            {product.riskLevel === 'green' ? (
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
            ) : (
              <AlertCircle className={cn(
                "w-4 h-4 mt-0.5 shrink-0",
                product.riskLevel === 'red' ? 'text-red-600' : 'text-yellow-600'
              )} />
            )}
            <div className={cn(
              "text-xs",
              product.riskLevel === 'red' ? 'text-red-700' :
              product.riskLevel === 'yellow' ? 'text-yellow-700' :
              'text-green-700'
            )}>
              <p className="font-semibold">
                {product.riskLevel === 'red' ? 'Alerta Crítico' :
                 product.riskLevel === 'yellow' ? 'Atenção' :
                 'Estoque Adequado'}
              </p>
              <p className="mt-1">{getRiskMessage()}</p>
              {product.marketplaceDistribution && product.marketplaceDistribution.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.marketplaceDistribution.map(dist => (
                    <span key={dist.channelId} className="bg-white bg-opacity-50 px-2 py-1 rounded">
                      {dist.channelName}: {dist.stock} ({dist.percentage}%)
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Channel breakdown (expanded) */}
        {expanded && !showLinks && (
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
            
            {/* Links button */}
            <div className="mt-3 pt-3 border-t flex justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLinks(true)}
                className="gap-2"
              >
                <LinkIcon className="w-4 h-4" />
                Ver Links de Anúncios
              </Button>
            </div>
          </div>
        )}
        
        {/* Links view (expanded) */}
        {expanded && showLinks && (
          <div className="px-3 pb-3 pt-0">
            <div className="border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLinks(false)}
                className="mb-3"
              >
                ← Voltar aos Canais
              </Button>
              <ProductListingLinks
                productId={product.id}
                productCode={product.internalCode}
                productName={product.description}
              />
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
