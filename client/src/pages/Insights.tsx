import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Thermometer } from "@/components/Thermometer";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type PeriodType = "7d" | "15d" | "30d" | "month" | "custom";

export default function Insights() {
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
  
  // Fetch insights data
  const { data: insights, isLoading } = trpc.insights.byPeriod.useQuery(
    { startDate, endDate },
    { enabled: !!startDate && !!endDate }
  );
  
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
  
  const meetingGoal = insights?.meetingGoal || [];
  const notMeetingGoal = insights?.notMeetingGoal || [];
  const daysInPeriod = insights?.daysInPeriod || 0;
  
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
            <div>
              <h1 className="text-xl font-bold text-gray-800">Insights de Performance</h1>
              <p className="text-sm text-gray-500">Análise de produtos vs meta</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Batendo Meta</p>
                  <p className="text-4xl font-bold text-green-600">{meetingGoal.length}</p>
                  <p className="text-xs text-green-600">produtos</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Abaixo da Meta</p>
                  <p className="text-4xl font-bold text-red-600">{notMeetingGoal.length}</p>
                  <p className="text-xs text-red-600">produtos</p>
                </div>
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Período Analisado</p>
                  <p className="text-4xl font-bold text-gray-800">{daysInPeriod}</p>
                  <p className="text-xs text-gray-500">dias</p>
                </div>
                <CalendarIcon className="w-12 h-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Products meeting goal */}
            <Card className="border-green-200">
              <CardHeader className="bg-green-50 border-b border-green-200">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <TrendingUp className="w-5 h-5" />
                  Produtos Batendo Meta ({meetingGoal.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {meetingGoal.length > 0 ? (
                  <div className="divide-y">
                    {meetingGoal.map((product) => (
                      <div 
                        key={product.productId}
                        className="flex items-center justify-between p-4 hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">{product.internalCode}</p>
                          <p className="font-medium truncate">{product.description}</p>
                          <p className="text-sm text-gray-500">
                            {product.totalSales} vendas / {product.totalGoal} meta
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <Thermometer 
                            value={product.totalSales} 
                            goal={product.totalGoal} 
                            size="md"
                          />
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/produto/${product.productId}`}>
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    Nenhum produto batendo a meta no período
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Products not meeting goal */}
            <Card className="border-red-200">
              <CardHeader className="bg-red-50 border-b border-red-200">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <TrendingDown className="w-5 h-5" />
                  Produtos Abaixo da Meta ({notMeetingGoal.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {notMeetingGoal.length > 0 ? (
                  <div className="divide-y">
                    {notMeetingGoal.map((product) => (
                      <div 
                        key={product.productId}
                        className="flex items-center justify-between p-4 hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">{product.internalCode}</p>
                          <p className="font-medium truncate">{product.description}</p>
                          <p className="text-sm text-gray-500">
                            {product.totalSales} vendas / {product.totalGoal} meta
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <Thermometer 
                            value={product.totalSales} 
                            goal={product.totalGoal} 
                            size="md"
                          />
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/produto/${product.productId}`}>
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    Todos os produtos estão batendo a meta!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
