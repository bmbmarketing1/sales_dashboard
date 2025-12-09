import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { FileUpload } from "@/components/FileUpload";
import { 
  Upload, 
  Calendar, 
  TrendingUp, 
  Package, 
  Target,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Trash2,
  AlertTriangle
} from "lucide-react";
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
  Legend
} from "recharts";
import { format, parse, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLoginUrl } from "@/const";

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return format(today, "yyyy-MM-dd");
  });
  const [uploadOpen, setUploadOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  
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
  
  // Fetch data
  const { data: salesData, isLoading: salesLoading, refetch: refetchSales } = trpc.sales.byDate.useQuery(
    { date: selectedDate },
    { enabled: !!selectedDate }
  );
  
  const currentDate = parse(selectedDate, "yyyy-MM-dd", new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  
  const { data: dailyTotals } = trpc.sales.dailyTotals.useQuery(
    { year, month },
    { enabled: !!selectedDate }
  );
  
  const { data: monthlyAverages } = trpc.sales.monthlyAverages.useQuery(
    { year, month },
    { enabled: !!selectedDate }
  );
  
  const { data: importedFiles } = trpc.import.list.useQuery();
  
  // Navigation
  const goToPreviousDay = () => {
    const prev = subDays(currentDate, 1);
    setSelectedDate(format(prev, "yyyy-MM-dd"));
  };
  
  const goToNextDay = () => {
    const next = addDays(currentDate, 1);
    setSelectedDate(format(next, "yyyy-MM-dd"));
  };
  
  const handleImportSuccess = () => {
    refetchSales();
    utils.sales.dailyTotals.invalidate();
    utils.sales.monthlyAverages.invalidate();
    utils.import.list.invalidate();
  };
  
  // Calculate totals
  const totalSales = salesData?.reduce((sum, p) => sum + p.totalSales, 0) || 0;
  const totalGoals = salesData?.reduce((sum, p) => sum + p.dailyGoal, 0) || 0;
  const overallPercentage = totalGoals > 0 ? Math.round((totalSales / totalGoals) * 100) : 0;
  
  // Prepare chart data
  const chartData = dailyTotals?.map(d => ({
    date: format(new Date(d.saleDate), "dd/MM"),
    vendas: d.totalQuantity,
  })) || [];
  
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
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar Planilha
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container py-6">
        {/* Date selector */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={goToPreviousDay}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-medium">
              {format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={goToNextDay}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => refetchSales()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Vendas do Dia</p>
                  <p className="text-3xl font-bold text-gray-800">{totalSales}</p>
                </div>
                <Package className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Meta Total</p>
                  <p className="text-3xl font-bold text-gray-800">{totalGoals}</p>
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
                  <p className={`text-3xl font-bold ${
                    overallPercentage >= 100 ? "text-green-600" :
                    overallPercentage >= 70 ? "text-yellow-600" :
                    "text-red-600"
                  }`}>
                    {overallPercentage}%
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="chart">Gráfico Mensal</TabsTrigger>
            <TabsTrigger value="imports">Importações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            {salesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : salesData && salesData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salesData.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onGoalUpdated={handleImportSuccess}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    Nenhum dado de vendas para esta data.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Importe uma planilha para começar.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="chart">
            <Card>
              <CardHeader>
                <CardTitle>Vendas do Mês</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="vendas" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6" }}
                        name="Vendas"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    Nenhum dado disponível para o gráfico
                  </div>
                )}
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
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{file.fileName}</p>
                          <p className="text-sm text-gray-500">
                            {file.recordsImported} registros importados
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {format(new Date(file.importedAt), "dd/MM/yyyy HH:mm")}
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
    </div>
  );
}
