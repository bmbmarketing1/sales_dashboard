import React from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface StockNecessityBadgeProps {
  stockNecessity: number;
  hasStockSufficiency: boolean;
  daysOfCoverage: number;
  fullStock: number;
}

export function StockNecessityBadge({
  stockNecessity,
  hasStockSufficiency,
  daysOfCoverage,
  fullStock,
}: StockNecessityBadgeProps) {
  if (hasStockSufficiency) {
    // Estoque suficiente
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium text-green-700">
          Estoque suficiente por {daysOfCoverage} dias
        </span>
      </div>
    );
  } else {
    // Necessidade de abastecimento
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-md">
        <AlertCircle className="w-4 h-4 text-red-600" />
        <span className="text-sm font-medium text-red-700">
          Necessário reabastecer {Math.ceil(stockNecessity)} un
        </span>
      </div>
    );
  }
}
