import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Package, 
  Zap,
  ArrowRight,
  Calendar,
  BarChart3,
  AlertCircle
} from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface StockProduct {
  id: number;
  internalCode: string;
  description: string;
  totalStock: number;
  daysOfStockAvailable: number;
  stockCoveragePercentage: number;
  riskLevel: 'green' | 'yellow' | 'red';
  periodGoal: number;
  totalSales: number;
  avgSalesPerDay: number;
  reabastecimentoRecomendado: number;
  previsaoFaltaEstoque: number | null;
  marketplaceDistribution: Array<{
    channelId: number;
    channelName: string;
    stock: number;
    percentage: number;
  }>;
}

export default function StockAnalysis() {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRisk, setFilterRisk] = useState<'all' | 'red' | 'yellow' | 'green'>('all');
  const [sortBy, setSortBy] = useState<'days' | 'coverage' | 'restock'>('days');
  
  // Get period data
  const today = new Date();
  const startDate = format(subDays(today, 30), 'yyyy-MM-dd');
  const endDate = format(today, 'yyyy-MM-dd');
  
  const { data: periodData, isLoading } = trpc.sales.byPeriod.useQuery(
    { startDate, endDate },
    { enabled: !!user }
  );

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!periodData?.products) return [];
    
    let products = [...periodData.products] as StockProduct[];
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      products = products.filter(p =>
        p.description.toLowerCase().includes(query) ||
        p.internalCode.toLowerCase().includes(query)
      );
    }
    
    // Filter by risk level
    if (filterRisk !== 'all') {
      products = products.filter(p => p.riskLevel === filterRisk);
    }
    
    // Sort
    if (sortBy === 'days') {
      products.sort((a, b) => (a.daysOfStockAvailable || 0) - (b.daysOfStockAvailable || 0));
    } else if (sortBy === 'coverage') {
      products.sort((a, b) => (a.stockCoveragePercentage || 0) - (b.stockCoveragePercentage || 0));
    } else if (sortBy === 'restock') {
      products.sort((a, b) => (b.reabastecimentoRecomendado || 0) - (a.reabastecimentoRecomendado || 0));
    }
    
    return products;
  }, [periodData?.products, searchQuery, filterRisk, sortBy]);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (!periodData?.products) return {
      criticalProducts: 0,
      warningProducts: 0,
      totalRestockNeeded: 0,
      avgDaysOfStock: 0,
      productsWithoutStock: 0,
    };

    const products = periodData.products as StockProduct[];
    const critical = products.filter(p => p.riskLevel === 'red').length;
    const warning = products.filter(p => p.riskLevel === 'yellow').length;
    const totalRestock = products.reduce((sum, p) => sum + (p.reabastecimentoRecomendado || 0), 0);
    const avgDays = Math.round(
      products.reduce((sum, p) => sum + (p.daysOfStockAvailable || 0), 0) / products.length
    );
    const noStock = products.filter(p => (p.totalStock || 0) === 0).length;

    return {
      criticalProducts: critical,
      warningProducts: warning,
      totalRestockNeeded: totalRestock,
      avgDaysOfStock: avgDays,
      productsWithoutStock: noStock,
    };
  }, [periodData?.products]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto text-gray-400 mb-4 animate-spin" />
          <p className="text-gray-500">Carregando análise de estoque...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Análise de Estoque</h1>
        <p className="text-gray-600 mt-2">Visualize a saúde do seu estoque e identifique produtos em risco</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Críticos</p>
                <p className="text-3xl font-bold text-red-600">{metrics.criticalProducts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Atenção</p>
                <p className="text-3xl font-bold text-yellow-600">{metrics.warningProducts}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sem Estoque</p>
                <p className="text-3xl font-bold text-gray-800">{metrics.productsWithoutStock}</p>
              </div>
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dias Médios</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.avgDaysOfStock}d</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reabastecer</p>
                <p className="text-3xl font-bold text-orange-600">{metrics.totalRestockNeeded}</p>
              </div>
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterRisk} onValueChange={(v) => setFilterRisk(v as any)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filtrar por risco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="red">Críticos</SelectItem>
                <SelectItem value="yellow">Atenção</SelectItem>
                <SelectItem value="green">Adequado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Dias de Estoque</SelectItem>
                <SelectItem value="coverage">Cobertura de Meta</SelectItem>
                <SelectItem value="restock">Reabastecimento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-gray-600">
                  <th className="pb-3 font-semibold">Produto</th>
                  <th className="pb-3 font-semibold">Estoque</th>
                  <th className="pb-3 font-semibold">Dias</th>
                  <th className="pb-3 font-semibold">Cobertura</th>
                  <th className="pb-3 font-semibold">Risco</th>
                  <th className="pb-3 font-semibold">Reabastecer</th>
                  <th className="pb-3 font-semibold">Distribuição</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="py-4">
                        <div>
                          <p className="font-medium text-gray-900">{product.description}</p>
                          <p className="text-xs text-gray-500">{product.internalCode}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="font-semibold">{product.totalStock}</p>
                      </td>
                      <td className="py-4">
                        <p className="font-semibold">
                          {product.daysOfStockAvailable || 0}d
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.avgSalesPerDay.toFixed(1)}/dia
                        </p>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full",
                                product.stockCoveragePercentage >= 100 ? 'bg-green-500' :
                                product.stockCoveragePercentage >= 50 ? 'bg-yellow-500' :
                                'bg-red-500'
                              )}
                              style={{
                                width: `${Math.min(product.stockCoveragePercentage, 100)}%`
                              }}
                            />
                          </div>
                          <p className="text-sm font-medium w-12">
                            {product.stockCoveragePercentage}%
                          </p>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-semibold",
                          product.riskLevel === 'red' ? 'bg-red-100 text-red-800' :
                          product.riskLevel === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        )}>
                          {product.riskLevel === 'red' ? 'Crítico' :
                           product.riskLevel === 'yellow' ? 'Atenção' :
                           'Adequado'}
                        </span>
                      </td>
                      <td className="py-4">
                        <p className="font-semibold text-orange-600">
                          +{product.reabastecimentoRecomendado}
                        </p>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-1">
                          {product.marketplaceDistribution.slice(0, 2).map((dist) => (
                            <span key={dist.channelId} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {dist.channelName.split(' ')[0]}: {dist.percentage}%
                            </span>
                          ))}
                          {product.marketplaceDistribution.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{product.marketplaceDistribution.length - 2} mais
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      Nenhum produto encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {metrics.criticalProducts > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Ações Recomendadas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-800">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-1 shrink-0" />
                <span>
                  <strong>{metrics.criticalProducts} produtos</strong> em nível crítico precisam de reabastecimento urgente
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-1 shrink-0" />
                <span>
                  Total de <strong>{metrics.totalRestockNeeded} unidades</strong> recomendadas para reabastecer
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-1 shrink-0" />
                <span>
                  Priorize produtos com <strong>menos de 7 dias</strong> de estoque estimado
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
