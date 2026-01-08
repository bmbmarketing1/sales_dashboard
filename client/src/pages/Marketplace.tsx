import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Thermometer } from "@/components/Thermometer";
import { ProductListingLinks } from "@/components/ProductListingLinks";
import { StockDisplay } from "@/components/StockDisplay";
import { StockCoverageAlert } from "@/components/StockCoverageAlert";
import { ProductInsightBadge } from "@/components/ProductInsightBadge";
import { MarketplaceInsightsPanel } from "@/components/MarketplaceInsightsPanel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { 
  ArrowLeft, 
  Loader2, 
  Package, 
  Search,
  CalendarIcon,
  RefreshCw,
  Target,
  TrendingUp,
  Store,
  BarChart3,
  Link as LinkIcon
} from "lucide-react";
import { Link, useParams } from "wouter";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";

type PeriodType = "1d" | "7d" | "15d" | "30d" | "month" | "custom";
type SortOrder = "default" | "best" | "worst";

export default function Marketplace() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const params = useParams<{ channelId: string }>();
  const channelId = parseInt(params.channelId || "1");
  
  // Period selection state
  const [period, setPeriod] = useState<PeriodType>("30d");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  
  // Search and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Product history modal state
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  
  // Links view state
  const [expandedLinksProductId, setExpandedLinksProductId] = useState<number | null>(null);
  const [showInsights, setShowInsights] = useState(true);
  
  // Marketplace notes state
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedProductForNotes, setSelectedProductForNotes] = useState<{ id: number; code: string; name: string } | null>(null);
  const [notesText, setNotesText] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  const today = new Date();
  
  // Calculate date range based on period
  const { startDate, endDate, daysInPeriod } = useMemo(() => {
    let start: Date;
    let end: Date = today;
    
    switch (period) {
      case "1d":
        start = subDays(today, 1);
        end = subDays(today, 1);
        break;
      case "7d":
        start = subDays(today, 7);
        break;
      case "15d":
        start = subDays(today, 15);
        break;
      case "30d":
        start = subDays(today, 30);
        break;
      case "month":
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case "custom":
        start = customStartDate || subDays(today, 30);
        end = customEndDate || today;
        break;
      default:
        start = subDays(today, 30);
    }
    
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
      daysInPeriod: days,
    };
  }, [period, customStartDate, customEndDate, today]);
  
  // Fetch channels list
  const { data: channels } = trpc.channels.list.useQuery();
  
  // Fetch marketplace data
  const { data: marketplaceData, isLoading, refetch } = trpc.marketplace.byChannel.useQuery(
    { channelId, startDate, endDate },
    { enabled: isAuthenticated && channelId > 0 }
  );
  
  // Fetch categories
  const { data: categories } = trpc.categories.list.useQuery();
  
  // Fetch product history for modal
  const { data: productHistory, isLoading: historyLoading } = trpc.marketplace.productHistory.useQuery(
    { productId: selectedProductId || 0, channelId, days: 30 },
    { enabled: historyModalOpen && selectedProductId !== null }
  );
  
  // Fetch marketplace insights
  const { data: insights, isLoading: insightsLoading } = trpc.insights.byMarketplace.useQuery(
    { channelId, startDate, endDate, periodDays: daysInPeriod },
    { enabled: isAuthenticated && channelId > 0 }
  );
  
  // Fetch marketplace notes
  const { data: currentNote } = trpc.products.getMarketplaceNote.useQuery(
    { productId: selectedProductForNotes?.id || 0, channelId },
    { enabled: notesModalOpen && selectedProductForNotes !== null }
  );
  
  // Update marketplace notes mutation
  const updateNoteMutation = trpc.products.updateMarketplaceNote.useMutation({
    onSuccess: () => {
      setNotesModalOpen(false);
      setNotesText("");
      setSelectedProductForNotes(null);
    },
  });
  
  const handleOpenNotesModal = (productId: number, code: string, name: string) => {
    setSelectedProductForNotes({ id: productId, code, name });
    setNotesText(currentNote || "");
    setNotesModalOpen(true);
  };
  
  const handleSaveNotes = async () => {
    if (!selectedProductForNotes) return;
    setIsSavingNotes(true);
    try {
      await updateNoteMutation.mutateAsync({
        productId: selectedProductForNotes.id,
        channelId,
        notes: notesText,
      });
    } finally {
      setIsSavingNotes(false);
    }
  }
  
  const handleCustomDateSelect = (type: "start" | "end", date: Date | undefined) => {
    if (type === "start") {
      setCustomStartDate(date);
      setStartPickerOpen(false);
      if (date && customEndDate) {
        setPeriod("custom");
      }
    } else {
      setCustomEndDate(date);
      setEndPickerOpen(false);
      if (customStartDate && date) {
        setPeriod("custom");
      }
    }
  };
  
  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!marketplaceData?.products) return [];
    
    let products = [...marketplaceData.products];
    
    // Filter by category
    if (selectedCategory !== "all") {
      products = products.filter(p => p.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      products = products.filter(p => 
        p.description.toLowerCase().includes(query) ||
        p.internalCode.toLowerCase().includes(query)
      );
    }
    
    // Sort by performance
    if (sortOrder === "best") {
      products.sort((a, b) => b.percentage - a.percentage);
    } else if (sortOrder === "worst") {
      products.sort((a, b) => a.percentage - b.percentage);
    }
    
    return products;
  }, [marketplaceData?.products, searchQuery, sortOrder, selectedCategory]);
  
  // Calculate totals from filtered products
  const totalSales = filteredProducts.reduce((sum, p) => sum + p.totalSales, 0);
  const totalGoals = filteredProducts.reduce((sum, p) => sum + p.periodGoal, 0);
  const overallPercentage = totalGoals > 0 ? Math.round((totalSales / totalGoals) * 100) : 0;
  
  // Period label for display
  const getPeriodLabel = () => {
    if (period === "custom" && customStartDate && customEndDate) {
      return `${format(customStartDate, "dd/MM/yyyy")} - ${format(customEndDate, "dd/MM/yyyy")}`;
    }
    switch (period) {
      case "1d": return "Ontem";
      case "7d": return "Últimos 7 dias";
      case "15d": return "Últimos 15 dias";
      case "30d": return "Últimos 30 dias";
      case "month": return format(today, "MMMM yyyy", { locale: ptBR });
      default: return "";
    }
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Store className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">Faça login para acessar o dashboard</p>
            <Button asChild>
              <a href={getLoginUrl()}>Fazer Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const channelName = marketplaceData?.channel?.name || channels?.find(c => c.id === channelId)?.name || "Marketplace";
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Store className="w-6 h-6 text-blue-600" />
                  {channelName}
                </h1>
                <p className="text-sm text-gray-500">Visão por Marketplace</p>
              </div>
            </div>
            
            {/* Channel selector */}
            <Select value={String(channelId)} onValueChange={(v) => window.location.href = `/marketplace/${v}`}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecionar marketplace" />
              </SelectTrigger>
              <SelectContent>
                {channels?.map(channel => (
                  <SelectItem key={channel.id} value={String(channel.id)}>
                    {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
      
      <main className="container py-6">
        {/* Period selector */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex gap-2">
            {(["1d", "7d", "15d", "30d", "month"] as PeriodType[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p === "1d" ? "Ontem" : p === "7d" ? "7 dias" : p === "15d" ? "15 dias" : p === "30d" ? "30 dias" : "Mês"}
              </Button>
            ))}
          </div>
          
          {/* Custom date pickers */}
          <div className="flex items-center gap-2">
            <Popover open={startPickerOpen} onOpenChange={setStartPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {customStartDate ? format(customStartDate, "dd/MM/yyyy") : "Data início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={(date) => handleCustomDateSelect("start", date)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            
            <span className="text-gray-500">até</span>
            
            <Popover open={endPickerOpen} onOpenChange={setEndPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {customEndDate ? format(customEndDate, "dd/MM/yyyy") : "Data fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={(date) => handleCustomDateSelect("end", date)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          Período: <span className="font-medium">{getPeriodLabel()}</span> ({daysInPeriod} dias)
        </p>
        
        {/* Search and filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar produto por nome ou código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {categories && categories.length > 0 && (
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas Categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <div className="flex gap-2">
            <Button
              variant={sortOrder === "default" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortOrder("default")}
            >
              Padrão
            </Button>
            <Button
              variant={sortOrder === "best" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortOrder("best")}
              className={sortOrder === "best" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              Melhor ↑
            </Button>
            <Button
              variant={sortOrder === "worst" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortOrder("worst")}
              className={sortOrder === "worst" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              Pior ↓
            </Button>
          </div>
        </div>
        
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Vendas do Período</p>
                  <p className="text-3xl font-bold">{totalSales}</p>
                </div>
                <Package className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Meta do Período</p>
                  <p className="text-3xl font-bold">{totalGoals}</p>
                </div>
                <Target className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Atingimento</p>
                  <p className={cn(
                    "text-3xl font-bold",
                    overallPercentage >= 100 ? "text-green-600" :
                    overallPercentage >= 50 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {overallPercentage}%
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Insights Panel */}
        {insights && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Insights de Performance</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInsights(!showInsights)}
              >
                {showInsights ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
            {showInsights && (
              <MarketplaceInsightsPanel
                meetsGoal={insights.meetsGoal}
                belowGoal={insights.belowGoal}
                urgentRestock={insights.urgentRestock}
              />
            )}
          </div>
        )}
        
        {/* Products list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Produtos ({filteredProducts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <div key={product.id}>
                    <div
                      className="flex items-center gap-4 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                    >
                    <div className={cn(
                      "w-1 h-12 rounded-full",
                      product.percentage >= 100 ? "bg-green-500" :
                      product.percentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                    )} />
                    
                    <div className="w-20 text-sm font-mono text-gray-600">
                      {product.internalCode}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.description}</p>
                      {product.category && (
                        <p className="text-xs text-gray-500">{product.category}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-bold">{product.totalSales}</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-gray-600">{product.periodGoal}</span>
                      </div>
                      
                      <div className="w-32">
                        <Thermometer value={product.totalSales} goal={product.periodGoal} size="sm" showLabel={false} />
                      </div>
                      
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Média</p>
                        <p className="font-semibold text-sm">{(product.totalSales / daysInPeriod).toFixed(1)}/dia</p>
                      </div>
                      
                      <StockDisplay productId={product.id} channelId={channelId} />
                      
                      <ProductInsightBadge
                        totalQuantity={product.totalSales}
                        expectedQuantity={product.periodGoal}
                        totalStock={product.fullStock || 0}
                        dailyAverage={product.averageDailySales || 0}
                        daysInPeriod={daysInPeriod}
                      />
                      
                      <div className="text-right">
                        <div className={cn(
                          "w-16 text-right font-bold",
                          product.percentage >= 100 ? "text-green-600" :
                          product.percentage >= 50 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {product.percentage}%
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedProductId(product.id);
                          setHistoryModalOpen(true);
                        }}
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Histórico
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/produto/${product.id}`}>
                          Detalhes
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenNotesModal(product.id, product.internalCode, product.description)}
                        className="gap-2"
                      >
                        <Package className="w-4 h-4" />
                        Notas
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setExpandedLinksProductId(expandedLinksProductId === product.id ? null : product.id)}
                        className="gap-2"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Links
                      </Button>
                      </div>
                    </div>
                    
                    {/* Expanded links section */}
                    {expandedLinksProductId === product.id && (
                      <div className="w-full mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200 ml-1 mr-1">
                        <ProductListingLinks 
                          productId={product.id} 
                          productCode={product.internalCode}
                          productName={product.description}
                          channelId={channelId}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchQuery ? `Nenhum produto encontrado para "${searchQuery}"` : "Nenhum dado disponível para este período"}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* Product History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Histórico de 30 dias - {productHistory && 'product' in productHistory ? productHistory.product?.description || 'Produto' : 'Produto'}
            </DialogTitle>
          </DialogHeader>
          
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : productHistory && 'history' in productHistory ? (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">Total Vendido</p>
                    <p className="text-2xl font-bold">{productHistory.totalSales}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">Meta do Período</p>
                    <p className="text-2xl font-bold">{productHistory.totalGoal}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">Atingimento</p>
                    <p className={cn(
                      "text-2xl font-bold",
                      productHistory.totalGoal > 0 && (productHistory.totalSales / productHistory.totalGoal) >= 1 ? "text-green-600" :
                      productHistory.totalGoal > 0 && (productHistory.totalSales / productHistory.totalGoal) >= 0.5 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {productHistory.totalGoal > 0 ? Math.round((productHistory.totalSales / productHistory.totalGoal) * 100) : 0}%
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Vendas diárias no {productHistory.channel?.name || ''}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    {productHistory.history && productHistory.history.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productHistory.history.map((h: { date: string; quantity: number }) => ({
                          ...h,
                          date: h.date.split('-').slice(1).reverse().join('/'),
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                          <YAxis />
                          <Tooltip />
                          <ReferenceLine y={productHistory.dailyGoal} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Meta', position: 'right' }} />
                          <Bar 
                            dataKey="quantity" 
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Sem dados disponíveis
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <p className="text-xs text-gray-500 text-center">
                Meta diária: {'dailyGoal' in productHistory ? productHistory.dailyGoal : 0} unidades | Canal: {'channel' in productHistory ? productHistory.channel?.name : ''}
              </p>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Nenhum dado disponível</p>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Marketplace Notes Modal */}
      <Dialog open={notesModalOpen} onOpenChange={setNotesModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Notas - {selectedProductForNotes?.code} ({selectedProductForNotes?.name})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Adicione observações específicas deste marketplace..."
              className="w-full h-32 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setNotesModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
              >
                {isSavingNotes ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
