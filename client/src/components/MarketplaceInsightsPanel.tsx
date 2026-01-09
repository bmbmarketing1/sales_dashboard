import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProductInsight {
  id: number;
  reference: string;
  name: string;
  totalSales: number;
  periodGoal: number;
  percentageAchieved: number;
  fullStock: number;
  crossStock: number;
  averageDailySales: number;
  daysOfStockRemaining: number;
  isUrgentRestock: boolean;
}

interface MarketplaceInsightsPanelProps {
  meetsGoal: ProductInsight[];
  belowGoal: ProductInsight[];
  urgentRestock: ProductInsight[];
}

export function MarketplaceInsightsPanel({
  meetsGoal,
  belowGoal,
  urgentRestock,
}: MarketplaceInsightsPanelProps) {
  const [expandedMeets, setExpandedMeets] = useState(true);
  const [expandedBelow, setExpandedBelow] = useState(true);
  const [expandedUrgent, setExpandedUrgent] = useState(true);

  const renderProgressBar = (percentage: number) => {
    let bgColor = 'bg-green-500';
    if (percentage < 50) bgColor = 'bg-red-500';
    else if (percentage < 100) bgColor = 'bg-yellow-500';

    const clampedPercentage = Math.min(percentage, 100);

    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all', bgColor)}
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-gray-700 w-12 text-right">
          {Math.round(percentage)}%
        </span>
      </div>
    );
  };

  const renderStockStatus = (product: ProductInsight) => {
    if (product.isUrgentRestock) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
          <AlertCircle className="w-3 h-3" />
          Reabastecimento Urgente
        </div>
      );
    }

    if (product.daysOfStockRemaining > 60) {
      return (
        <div className="text-xs text-gray-600">
          {product.daysOfStockRemaining}+ dias de estoque
        </div>
      );
    }

    if (product.daysOfStockRemaining > 30) {
      return (
        <div className="text-xs text-yellow-600">
          {product.daysOfStockRemaining} dias de estoque
        </div>
      );
    }

    return (
      <div className="text-xs text-red-600">
        {product.daysOfStockRemaining} dias de estoque
      </div>
    );
  };

  const ProductRow = ({ product }: { product: ProductInsight }) => (
    <div className="flex flex-col gap-2 p-3 border-b last:border-b-0 hover:bg-gray-50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-gray-900">{product.reference}</span>
            <span className="text-xs text-gray-500 truncate">{product.name}</span>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {product.totalSales} vendas / {product.periodGoal} meta
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">
            {product.averageDailySales.toFixed(1)}/dia
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {renderProgressBar(product.percentageAchieved)}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {product.percentageAchieved >= 100 ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className="text-xs text-gray-600">
              Estoque: {product.fullStock + product.crossStock} un
            </span>
          </div>
          {renderStockStatus(product)}
        </div>
        
        {/* Stock Necessity Indicator */}
        <div className="flex items-center gap-2 pt-1">
          {(() => {
            const necessity = (product.averageDailySales * 30) - product.fullStock;
            const isSufficient = necessity < 0;
            return (
              <div className="flex-1">
                {isSufficient ? (
                  <div className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium inline-block">
                    Estoque suficiente
                  </div>
                ) : (
                  <div className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded font-medium inline-block">
                    Necessidade: {Math.ceil(necessity)} un
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Meets Goal Section */}
      {meetsGoal.length > 0 && (
        <div className="border border-green-200 rounded-lg bg-green-50 overflow-hidden">
          <button
            onClick={() => setExpandedMeets(!expandedMeets)}
            className="w-full flex items-center justify-between p-3 hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-900">
                Batendo Meta ({meetsGoal.length})
              </span>
            </div>
            {expandedMeets ? (
              <ChevronUp className="w-5 h-5 text-green-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-green-600" />
            )}
          </button>
          {expandedMeets && (
            <div className="border-t border-green-200">
              {meetsGoal.map(product => (
                <ProductRow key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Below Goal Section */}
      {belowGoal.length > 0 && (
        <div className="border border-red-200 rounded-lg bg-red-50 overflow-hidden">
          <button
            onClick={() => setExpandedBelow(!expandedBelow)}
            className="w-full flex items-center justify-between p-3 hover:bg-red-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-900">
                Abaixo da Meta ({belowGoal.length})
              </span>
            </div>
            {expandedBelow ? (
              <ChevronUp className="w-5 h-5 text-red-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-red-600" />
            )}
          </button>
          {expandedBelow && (
            <div className="border-t border-red-200">
              {belowGoal.map(product => (
                <ProductRow key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Urgent Restock Section */}
      {urgentRestock.length > 0 && (
        <div className="border border-orange-200 rounded-lg bg-orange-50 overflow-hidden">
          <button
            onClick={() => setExpandedUrgent(!expandedUrgent)}
            className="w-full flex items-center justify-between p-3 hover:bg-orange-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-orange-900">
                Reabastecimento Urgente ({urgentRestock.length})
              </span>
            </div>
            {expandedUrgent ? (
              <ChevronUp className="w-5 h-5 text-orange-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-orange-600" />
            )}
          </button>
          {expandedUrgent && (
            <div className="border-t border-orange-200">
              {urgentRestock.map(product => (
                <ProductRow key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      )}

      {meetsGoal.length === 0 && belowGoal.length === 0 && urgentRestock.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          Nenhum dado disponível para este período
        </div>
      )}
    </div>
  );
}
