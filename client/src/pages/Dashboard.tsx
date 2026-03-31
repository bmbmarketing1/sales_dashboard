import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProductRow } from "@/components/ProductRow";
import { FileUpload } from "@/components/FileUpload";
import { CategoryUpload } from "@/components/CategoryUpload";
import { ProductUpload } from "@/components/ProductUpload";
import { ImageUpload } from "@/components/ImageUpload";
import { StockUpload } from "@/components/StockUpload";
import { ListingsUpload } from "@/components/ListingsUpload";
import { RevenueByCategoryCards } from "@/components/RevenueByCategoryCards";
import { ExportReportButton } from "@/components/ExportReportButton";
import { GoalsUploadButton } from "@/components/GoalsUploadButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Package, 
  Target,
  Loader2,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Lightbulb,
  Search,
  FolderTree,
  Plus,
  Store,
  X as XIcon,
  DollarSign,
  Image,
  ShoppingBag,
  Package2
} from "lucide-react";
import { Link } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLoginUrl } from "@/const";
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

type PeriodType = "1d" | "7d" | "15d" | "30d" | "month" | "custom";

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  
  // Period selection state
  const [period, setPeriod] = useState<PeriodType>("30d");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sort state
  const [sortOrder, setSortOrder] = useState<"default" | "best" | "worst">("default");
  
  const [uploadOpen, setUploadOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  
  // Query para arquivos importados
  const { data: importedFiles, refetch: refetchImportedFiles } = trpc.import.list.useQuery();
  
  // Mutation para deletar arquivo individual
  const deleteFileMutation = trpc.import.deleteFile.useMutation({
    onSuccess: () => {
      refetchImportedFiles();
    },
    onError: (error: any) => {
      console.error("Erro ao deletar arquivo:", error);
    },
  });
  const [categoryUploadOpen, setCategoryUploadOpen] = useState(false);
  const [productUploadOpen, setProductUploadOpen] = useState(false);
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [stockUploadOpen, setStockUploadOpen] = useState(false);
  const [listingsUploadOpen, setListingsUploadOpen] = useState(false);
  
  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Calculate date range based on period
  const { startDate, endDate, daysInPeriod } = useMemo(() => {
    const today = new Date();
    let start: Date;
    let end: Date = today;
    
    if (period === "custom" && customStartDate && customEndDate) {
      const days = Math.ceil((customEndDate.getTime() - customStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return {
        startDate: format(customStartDate, "yyyy-MM-dd"),
        endDate: format(customEndDate, "yyyy-MM-dd"),
        daysInPeriod: days,
      };
    }
    
    switch (period) {
      case "1d":
        start = subDays(today, 1);
        end = subDays(today, 1);
        break;
      case "7d":
        start = subDays(today, 6);
        break;
      case "15d":
        start = subDays(today, 14);
        break;
      case "30d":
        start = subDays(today, 29);
        break;
      case "month":
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      default:
        start = subDays(today, 29);
    }
    
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
      daysInPeriod: days,
    };
  }, [period, customStartDate, customEndDate]);
  
  // Handle custom date selection
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
  
  // Clear data mutation
  const clearDataMutation = trpc.data.clearAll.useMutation({
    onSuccess: (result) => {
      toast.success(`Dados limpos: ${result.salesDeleted} vendas e ${result.importsDeleted} importações removidas`);
      handleImportSuccess();
      setClearDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao limpar dados: ${error.message}`);
    },
  });
  
  const utils = trpc.useUtils();
  
  // Initialize database on first load
  const seedMutation = trpc.init.seed.useMutation();
  
  useEffect(() => {
    if (isAuthenticated) {
      seedMutation.mutate();
    }
  }, [isAuthenticated]);
  
  // Fetch data by period
  const { data: periodData, isLoading: salesLoading, refetch: refetchSales } = trpc.sales.byPeriod.useQuery(
    { startDate, endDate },
    { enabled: !!startDate && !!endDate }
  );
  
  // Extract year and month for chart
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  
  const { data: dailyTotals } = trpc.sales.dailyTotals.useQuery(
    { year, month },
    { enabled: true }
  );
  
  // Fetch categories
  const { data: categories, refetch: refetchCategories } = trpc.categories.list.useQuery();
  
  // Fetch revenue by category
  const { data: revenueByCategory, isLoading: revenueLoading } = trpc.marketplace.revenueByCategory.useQuery(
    { startDate, endDate },
    { enabled: !!startDate && !!endDate }
  );
  
  const handleImportSuccess = () => {
    refetchSales();
    utils.sales.dailyTotals.invalidate();
    utils.sales.byPeriod.invalidate();
    utils.import.list.invalidate();
  };
  
  const handleCategoryImportSuccess = () => {
    refetchCategories();
    refetchSales();
  };
  
  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!periodData?.products) return [];
    
    let products = [...periodData.products];
    
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
    if (sortOrder !== "default") {
      products.sort((a, b) => {
        const percA = a.periodGoal > 0 ? (a.totalSales / a.periodGoal) * 100 : 0;
        const percB = b.periodGoal > 0 ? (b.totalSales / b.periodGoal) * 100 : 0;
        return sortOrder === "best" ? percB - percA : percA - percB;
      });
    }
    
    return products;
  }, [periodData?.products, searchQuery, sortOrder, selectedCategory]);
  
  // Calculate totals from period data
  const totalSales = filteredProducts.reduce((sum, p) => sum + p.totalSales, 0);
  const totalGoals = filteredProducts.reduce((sum, p) => sum + p.periodGoal, 0);
  const totalRevenue = filteredProducts.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
  const skusWithSales = filteredProducts.filter(p => p.totalSales > 0).length;
  const totalSkus = filteredProducts.length;
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
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sales Dashboard</CardTitle>
            <p className="text-gray-500 mt-2">
              Sistema de Consulta de Histórico de Vendas
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Package className="w-16 h-16 text-blue-600" />
            <p className="text-center text-gray-600">
              Faça login para acessar o dashboard de vendas
            </p>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Entrar</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Sales Dashboard</h1>
              <p className="text-sm text-gray-500">Olá, {user?.name || "Usuário"}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setProductUploadOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Produtos
              </Button>
              <Button variant="outline" onClick={() => setCategoryUploadOpen(true)}>
                <FolderTree className="w-4 h-4 mr-2" />
                Categorias
              </Button>
              <Button variant="outline" onClick={() => setImageUploadOpen(true)}>
                <Image className="w-4 h-4 mr-2" />
                Fotos
              </Button>
              <Button variant="outline" onClick={() => setStockUploadOpen(true)}>
                <Package2 className="w-4 h-4 mr-2" />
                Estoque
              </Button>
              <Button variant="outline" onClick={() => setListingsUploadOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Links
              </Button>
              <GoalsUploadButton />
              <Button onClick={() => setUploadOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importar Planilha
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container py-6">
        {/* Period selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <div className="flex gap-1 bg-white rounded-lg border p-1">
            {(["1d", "7d", "15d", "30d", "month"] as PeriodType[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p === "1d" ? "Ontem" : p === "7d" ? "7 dias" : p === "15d" ? "15 dias" : p === "30d" ? "30 dias" : "Mês"}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <Popover open={startPickerOpen} onOpenChange={setStartPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={period === "custom" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    !customStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {customStartDate ? format(customStartDate, "dd/MM/yyyy") : "Data início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={(date) => handleCustomDateSelect("start", date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            
            <span className="text-gray-400">até</span>
            
            <Popover open={endPickerOpen} onOpenChange={setEndPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={period === "custom" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    !customEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {customEndDate ? format(customEndDate, "dd/MM/yyyy") : "Data fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={(date) => handleCustomDateSelect("end", date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <Button variant="ghost" size="icon" onClick={() => refetchSales()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Period label */}
        <div className="text-center mb-4">
          <span className="text-sm text-gray-500">
            Período: <strong>{getPeriodLabel()}</strong> ({daysInPeriod} dias)
          </span>
        </div>
        
        {/* Search bar, category filter and sort options */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar produto por nome ou código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Category filter */}
          {categories && categories.length > 0 && (
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <FolderTree className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Categoria" />
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
        
        {/* Marketplace buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <span className="text-sm text-gray-500 self-center mr-2">Ver por Marketplace:</span>
          <Button variant="outline" size="sm" asChild>
            <Link href="/marketplace/1">
              <Store className="w-4 h-4 mr-1" />
              Amazon
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/marketplace/2">
              <Store className="w-4 h-4 mr-1" />
              Magalu
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/marketplace/3">
              <Store className="w-4 h-4 mr-1" />
              Mercado Livre
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/marketplace/4">
              <Store className="w-4 h-4 mr-1" />
              Shopee
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/marketplace/5">
              <Store className="w-4 h-4 mr-1" />
              TikTok
            </Link>
          </Button>
        </div>
        
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Vendas do Período</p>
                  <p className="text-3xl font-bold text-gray-800">{totalSales}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    <ShoppingBag className="w-3 h-3 inline mr-1" />
                    {skusWithSales}/{totalSkus} SKUs
                  </p>
                </div>
                <Package className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Faturamento</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {formatCurrency(totalRevenue / 100)}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Meta do Período</p>
                  <p className="text-3xl font-bold text-gray-800">{totalGoals}</p>
                  <p className={`text-xs mt-1 font-semibold ${
                    overallPercentage >= 100 ? "text-green-600" :
                    overallPercentage >= 70 ? "text-yellow-600" :
                    "text-red-600"
                  }`}>
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    {overallPercentage}% atingido
                  </p>
                </div>
                <Target className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ticket Médio</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {totalSales > 0 ? ((totalRevenue / 100) / totalSales).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Revenue by Category Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Faturamento por Linha de Produto</h2>
            <div className="flex gap-2">
              <Link href="/sem-categoria">
                <Button variant="outline" size="sm">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Produtos Sem Categoria
                </Button>
              </Link>
              <ExportReportButton startDate={startDate} endDate={endDate} periodLabel={getPeriodLabel()} />
            </div>
          </div>
          <RevenueByCategoryCards data={revenueByCategory || []} isLoading={revenueLoading} />
        </div>
        
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="imports">Importações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            {salesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredProducts && filteredProducts.length > 0 ? (
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={{
                      ...product,
                      dailyGoal: product.periodGoal, // Use period goal for display
                    }}
                    onGoalUpdated={handleImportSuccess}
                    periodLabel={`${daysInPeriod} dias`}
                    periodDays={daysInPeriod}
                  />
                ))}
              </div>
            ) : searchQuery ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    Nenhum produto encontrado para "{searchQuery}"
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    Nenhum dado de vendas para este período.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Importe uma planilha para começar.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Análise de Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  Veja quais produtos estão batendo a meta e quais precisam de atenção.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Selecione um período personalizado para análise detalhada.
                </p>
                <Button asChild>
                  <Link href="/insights">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Abrir Insights
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="imports">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Histórico de Importações</CardTitle>
                <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Limpar Dados
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Limpar todos os dados?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá remover <strong>todas as vendas</strong> e <strong>todos os registros de importação</strong>.
                        <br /><br />
                        Os arquivos originais continuarão salvos no backup (S3), mas você precisará reimportar as planilhas.
                        <br /><br />
                        <strong>Esta ação não pode ser desfeita.</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => clearDataMutation.mutate()}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={clearDataMutation.isPending}
                      >
                        {clearDataMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Limpando...</>
                        ) : (
                          "Sim, limpar tudo"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              <CardContent>
                {importedFiles && importedFiles.length > 0 ? (
                  <div className="space-y-2">
                    {importedFiles.map((file) => (
                      <div 
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{file.fileName}</p>
                          <p className="text-sm text-gray-500">
                            {file.recordsImported} registros importados
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right text-sm text-gray-500">
                            {format(new Date(file.importedAt), "dd/MM/yyyy HH:mm")}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteFileMutation.mutate({ fileId: file.id })}
                            disabled={deleteFileMutation.isPending}
                          >
                            <XIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    Nenhum arquivo importado ainda
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <FileUpload
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={handleImportSuccess}
      />
      
      <CategoryUpload
        open={categoryUploadOpen}
        onOpenChange={setCategoryUploadOpen}
        onSuccess={handleCategoryImportSuccess}
      />
      
      <ProductUpload
        open={productUploadOpen}
        onOpenChange={setProductUploadOpen}
        onSuccess={handleImportSuccess}
      />
      
      <ImageUpload
        open={imageUploadOpen}
        onOpenChange={setImageUploadOpen}
        onSuccess={handleImportSuccess}
      />
      
      <StockUpload
        open={stockUploadOpen}
        onOpenChange={setStockUploadOpen}
        onSuccess={handleImportSuccess}
      />
      <ListingsUpload
        open={listingsUploadOpen}
        onOpenChange={setListingsUploadOpen}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
