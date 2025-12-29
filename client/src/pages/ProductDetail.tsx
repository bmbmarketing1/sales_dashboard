import { useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer } from "@/components/Thermometer";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Package, 
  Target,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type PeriodType = "7d" | "15d" | "30d" | "month" | "custom";

export default function ProductDetail() {
  const params = useParams();
  const productId = parseInt(params.id || "0", 10);
  
  const [period, setPeriod] = useState<PeriodType>("30d");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  
  // Calculate date range based on period
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    let start: Date;
    let end: Date = today;
    
    if (period === "custom" && customStartDate && customEndDate) {
      return {
        startDate: format(customStartDate, "yyyy-MM-dd"),
        endDate: format(customEndDate, "yyyy-MM-dd"),
      };
    }
    
    switch (period) {
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
      default:
        start = subDays(today, 30);
    }
    
    return {
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    };
  }, [period, customStartDate, customEndDate]);
  
  // Fetch product data
  const { data: product, isLoading: productLoading } = trpc.products.byId.useQuery(
    { productId },
    { enabled: productId > 0 }
  );
  
  // Fetch sales history
  const { data: salesHistory, isLoading: historyLoading } = trpc.products.history.useQuery(
    { productId, startDate, endDate },
    { enabled: productId > 0 }
  );
  
  // Fetch channel summary
  const { data: channelSummary, isLoading: summaryLoading } = trpc.products.channelSummary.useQuery(
    { productId, startDate, endDate },
    { enabled: productId > 0 }
  );
  
  const isLoading = productLoading || historyLoading || summaryLoading;
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (!salesHistory || salesHistory.length === 0) {
      return {
        totalSales: 0,
        avgDaily: 0,
        daysMetGoal: 0,
        totalDays: 0,
        goalPercentage: 0,
        dailyGoal: 0,
        totalGoal: 0,
        totalPercentage: 0,
      };
    }
    
    const totalSales = salesHistory.reduce((sum, day) => sum + day.totalSales, 0);
    const totalDays = salesHistory.length;
    const daysMetGoal = salesHistory.filter(day => day.metGoal).length;
    const avgDaily = totalDays > 0 ? Math.round(totalSales / totalDays * 10) / 10 : 0;
    const goalPercentage = totalDays > 0 ? Math.round((daysMetGoal / totalDays) * 100) : 0;
    
    // Get daily goal from first day (should be consistent)
    const dailyGoal = salesHistory[0]?.dailyGoal || 0;
    // Total goal = daily goal × number of days in period
    const totalGoal = dailyGoal * totalDays;
    // Percentage of total goal achieved
    const totalPercentage = totalGoal > 0 ? Math.round((totalSales / totalGoal) * 100) : 0;
    
    return {
      totalSales,
      avgDaily,
      daysMetGoal,
      totalDays,
      goalPercentage,
      dailyGoal,
      totalGoal,
      totalPercentage,
    };
  }, [salesHistory]);
  
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
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Produto não encontrado</p>
            <Button asChild className="mt-4">
              <Link href="/">Voltar ao Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const getChannelIcon = (name: string) => {
    const iconMap: Record<string, string> = {
      "Amazon": "/marketplace-icons/amazon.svg",
      "Magalu": "/marketplace-icons/magalu.svg",
      "Mercado Livre": "/marketplace-icons/mercado-livre.svg",
      "Shopee": "/marketplace-icons/shopee.svg",
      "TikTok": "/marketplace-icons/tiktok.svg",
    };
    const iconUrl = iconMap[name];
    return iconUrl ? (
      <img src={iconUrl} alt={name} className="w-8 h-8" />
    ) : (
      <Package className="w-8 h-8 text-gray-400" />
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.description}
                className="w-16 h-16 object-cover rounded-lg border shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">{product.internalCode}</p>
              <h1 className="text-xl font-bold text-gray-800">{product.description}</h1>
              {product.category && (
                <p className="text-xs text-blue-600">{product.category}</p>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="container py-6">
        {/* Period selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <CalendarIcon className="w-5 h-5 text-gray-500" />
          <div className="flex flex-wrap bg-white rounded-lg border p-1 gap-1">
            <Button
              variant={period === "7d" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod("7d")}
            >
              7 dias
            </Button>
            <Button
              variant={period === "15d" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod("15d")}
            >
              15 dias
            </Button>
            <Button
              variant={period === "30d" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod("30d")}
            >
              30 dias
            </Button>
            <Button
              variant={period === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod("month")}
            >
              Mês atual
            </Button>
          </div>
          
          {/* Custom date pickers */}
          <div className="flex items-center gap-2 ml-2">
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
        </div>
        
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Vendido</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalSales}</p>
                </div>
                <Package className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Média Diária</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.avgDaily}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Meta do Período</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalGoal}</p>
                  <p className="text-xs text-gray-400">{stats.dailyGoal}/dia × {stats.totalDays} dias</p>
                </div>
                <div className="text-right">
                  <Target className="w-10 h-10 text-green-500" />
                  <span className={`text-lg font-bold ${
                    stats.totalPercentage >= 100 ? "text-green-600" :
                    stats.totalPercentage >= 70 ? "text-yellow-600" :
                    "text-red-600"
                  }`}>
                    {stats.totalPercentage}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Dias na Meta</p>
                  <p className={`text-3xl font-bold ${
                    stats.goalPercentage >= 70 ? "text-green-600" :
                    stats.goalPercentage >= 40 ? "text-yellow-600" :
                    "text-red-600"
                  }`}>
                    {stats.daysMetGoal}/{stats.totalDays}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${
                    stats.goalPercentage >= 70 ? "text-green-600" :
                    stats.goalPercentage >= 40 ? "text-yellow-600" :
                    "text-red-600"
                  }`}>
                    {stats.goalPercentage}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Marketplace thermometers */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Performance por Marketplace</CardTitle>
          </CardHeader>
          <CardContent>
            {channelSummary && channelSummary.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {channelSummary.map((channel) => {
                  const totalGoal = channel.dailyGoal * (salesHistory?.length || 1);
                  const percentage = totalGoal > 0 
                    ? Math.round((channel.totalSales / totalGoal) * 100) 
                    : 0;
                  
                  return (
                    <div 
                      key={channel.channelId}
                      className="flex flex-col items-center p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="mb-2">{getChannelIcon(channel.channelName)}</div>
                      <p className="font-medium text-sm mb-1">{channel.channelName}</p>
                      <Thermometer 
                        value={channel.totalSales} 
                        goal={totalGoal} 
                        size="lg"
                      />
                      <p className="mt-2 text-lg font-bold">{channel.totalSales}</p>
                      <p className="text-xs text-gray-500">Meta: {totalGoal}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                Nenhum dado disponível para o período selecionado
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Detailed table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico Detalhado</CardTitle>
          </CardHeader>
          <CardContent>
            {salesHistory && salesHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Data</th>
                      <th className="text-center py-3 px-2">Total</th>
                      <th className="text-center py-3 px-2">Meta</th>
                      <th className="text-center py-3 px-2">%</th>
                      <th className="text-center py-3 px-2">Status</th>
                      {channelSummary?.map(ch => (
                        <th key={ch.channelId} className="text-center py-3 px-2">
                          {getChannelIcon(ch.channelName)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {salesHistory.map((day) => (
                      <tr key={day.date} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2">
                          {(() => {
                            // Parse date string and add timezone offset to show correct date
                            const [year, month, dayNum] = day.date.split('-').map(Number);
                            return `${String(dayNum).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                          })()}
                        </td>
                        <td className="text-center py-3 px-2 font-medium">
                          {day.totalSales}
                        </td>
                        <td className="text-center py-3 px-2 text-gray-500">
                          {day.dailyGoal}
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className={`font-medium ${
                            day.percentage >= 100 ? "text-green-600" :
                            day.percentage >= 70 ? "text-yellow-600" :
                            "text-red-600"
                          }`}>
                            {day.percentage}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-2">
                          {day.metGoal ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                          )}
                        </td>
                        {day.channelSales.map((ch) => (
                          <td key={ch.channelId} className="text-center py-3 px-2">
                            {ch.quantity > 0 ? ch.quantity : "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                Nenhum dado disponível para o período selecionado
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
