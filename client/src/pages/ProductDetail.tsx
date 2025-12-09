import { useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Thermometer } from "@/components/Thermometer";
import { 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  Package, 
  Target,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ReferenceLine
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

type PeriodType = "7d" | "15d" | "30d" | "month";

export default function ProductDetail() {
  const params = useParams();
  const productId = parseInt(params.id || "0", 10);
  
  const [period, setPeriod] = useState<PeriodType>("30d");
  
  // Calculate date range based on period
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    let start: Date;
    let end: Date = today;
    
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
  }, [period]);
  
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
      };
    }
    
    const totalSales = salesHistory.reduce((sum, day) => sum + day.totalSales, 0);
    const totalDays = salesHistory.length;
    const daysMetGoal = salesHistory.filter(day => day.metGoal).length;
    const avgDaily = totalDays > 0 ? Math.round(totalSales / totalDays * 10) / 10 : 0;
    const goalPercentage = totalDays > 0 ? Math.round((daysMetGoal / totalDays) * 100) : 0;
    
    return {
      totalSales,
      avgDaily,
      daysMetGoal,
      totalDays,
      goalPercentage,
    };
  }, [salesHistory]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    if (!salesHistory) return [];
    return salesHistory.map(day => ({
      date: format(new Date(day.date), "dd/MM"),
      vendas: day.totalSales,
      meta: day.dailyGoal,
      atingiu: day.metGoal ? "Sim" : "Não",
    }));
  }, [salesHistory]);
  
  // Prepare channel chart data
  const channelChartData = useMemo(() => {
    if (!channelSummary) return [];
    return channelSummary.map(ch => ({
      name: ch.channelName,
      vendas: ch.totalSales,
      meta: ch.dailyGoal * (salesHistory?.length || 1),
    }));
  }, [channelSummary, salesHistory]);
  
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
              <p className="text-sm text-gray-500">{product.internalCode}</p>
              <h1 className="text-xl font-bold text-gray-800">{product.description}</h1>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container py-6">
        {/* Period selector */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-gray-500" />
          <div className="flex bg-white rounded-lg border p-1">
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
                  <p className="text-sm text-gray-500">Meta Diária</p>
                  <p className="text-3xl font-bold text-gray-800">{product.dailyGoal}</p>
                </div>
                <Target className="w-10 h-10 text-green-500" />
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
        
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList>
            <TabsTrigger value="daily">Histórico Diário</TabsTrigger>
            <TabsTrigger value="channels">Por Marketplace</TabsTrigger>
            <TabsTrigger value="table">Tabela Detalhada</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle>Vendas Diárias vs Meta</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <ReferenceLine 
                        y={product.dailyGoal} 
                        stroke="#22c55e" 
                        strokeDasharray="5 5"
                        label={{ value: `Meta: ${product.dailyGoal}`, position: "right" }}
                      />
                      <Bar 
                        dataKey="vendas" 
                        fill="#3b82f6" 
                        name="Vendas"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    Nenhum dado disponível para o período selecionado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="channels">
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                {channelChartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={channelChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="vendas" 
                          fill="#3b82f6" 
                          name="Vendas"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    
                    <div className="mt-6 space-y-3">
                      {channelSummary?.map((channel) => {
                        const totalGoal = channel.dailyGoal * (salesHistory?.length || 1);
                        const percentage = totalGoal > 0 
                          ? Math.round((channel.totalSales / totalGoal) * 100) 
                          : 0;
                        
                        return (
                          <div 
                            key={channel.channelId}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{getChannelIcon(channel.channelName)}</span>
                              <div>
                                <p className="font-medium">{channel.channelName}</p>
                                <p className="text-sm text-gray-500">
                                  {channel.daysWithSales} dias com vendas
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-bold text-lg">{channel.totalSales}</p>
                                <p className="text-sm text-gray-500">
                                  Meta: {totalGoal}
                                </p>
                              </div>
                              <Thermometer 
                                value={channel.totalSales} 
                                goal={totalGoal} 
                                size="md"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    Nenhum dado disponível para o período selecionado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="table">
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
                              {format(new Date(day.date), "dd/MM/yyyy", { locale: ptBR })}
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
