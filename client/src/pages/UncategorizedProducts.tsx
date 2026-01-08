import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { format, subDays } from "date-fns";
import { AlertCircle, Check } from "lucide-react";

export default function UncategorizedProducts() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());

  const { data: uncategorizedProducts = [], isLoading } = trpc.products.withoutCategory.useQuery({
    startDate,
    endDate,
  });

  const updateInfoMutation = trpc.products.updateInfo.useMutation();

  const handleSelectProduct = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === uncategorizedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(uncategorizedProducts.map(p => p.id)));
    }
  };

  const handleCategorizeSelected = async () => {
    if (!selectedCategory || selectedProducts.size === 0) return;

    try {
      for (const productId of Array.from(selectedProducts)) {
        await updateInfoMutation.mutateAsync({
          productId,
          category: selectedCategory,
        });
      }
      setSelectedProducts(new Set());
      setSelectedCategory("");
      // Refetch data
      window.location.reload();
    } catch (error) {
      console.error("Erro ao categorizar produtos:", error);
    }
  };

  const categories = ["Rodados", "Brinquedos", "Utilidades", "Bebês"];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Produtos Sem Categoria</h1>
        <p className="text-gray-600">
          {uncategorizedProducts.length} produto(s) sem categoria com vendas no período
        </p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Data Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Data Fim</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Produtos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Produtos</CardTitle>
            {selectedProducts.size > 0 && (
              <Button
                onClick={handleCategorizeSelected}
                disabled={!selectedCategory || updateInfoMutation.isPending}
              >
                {updateInfoMutation.isPending ? "Categorizando..." : `Categorizar ${selectedProducts.size} produto(s)`}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : uncategorizedProducts.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <AlertCircle className="mr-2" />
              Nenhum produto sem categoria encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.size === uncategorizedProducts.length && uncategorizedProducts.length > 0}
                        onChange={handleSelectAll}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="text-left py-3 px-4">Código</th>
                    <th className="text-left py-3 px-4">Descrição</th>
                    <th className="text-right py-3 px-4">Quantidade</th>
                    <th className="text-right py-3 px-4">Faturamento</th>
                  </tr>
                </thead>
                <tbody>
                  {uncategorizedProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono text-sm">{product.internalCode}</td>
                      <td className="py-3 px-4">{product.description}</td>
                      <td className="py-3 px-4 text-right">{product.quantity}</td>
                      <td className="py-3 px-4 text-right">
                        R$ {((product.revenue || 0) / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
