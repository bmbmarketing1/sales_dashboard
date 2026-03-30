import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { CategorySelector } from "./CategorySelector";

interface ExportReportButtonProps {
  startDate: string;
  endDate: string;
  periodLabel: string;
  availableCategories?: string[];
}

export function ExportReportButton({ 
  startDate, 
  endDate, 
  periodLabel,
  availableCategories = []
}: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const exportMutation = trpc.reports.exportMarketplaceReport.useMutation();
  
  // Fetch categories if not provided
  const { data: categories } = trpc.categories.list.useQuery();
  const categoryList = useMemo(() => 
    availableCategories.length > 0 ? availableCategories : (categories || []),
    [availableCategories, categories]
  );
  
  const handleExport = async () => {
    try {
      setIsExporting(true);
      console.log('[ExportReportButton] Starting export with:', { startDate, endDate, selectedCategories });
      
      // Call tRPC mutation with categories filter
      const result = await exportMutation.mutateAsync({
        startDate,
        endDate,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      });
      
      console.log('[ExportReportButton] Got result:', result);
      
      if (!result || !result.success) {
        const errorMsg = result?.error || "Erro ao gerar relatório";
        throw new Error(errorMsg);
      }
      
      if (!result.url) {
        throw new Error("Nenhuma URL retornada do servidor");
      }
      
      // Download direto do S3 via link
      console.log('[ExportReportButton] Downloading from S3 URL');
      const link = document.createElement('a');
      link.href = result.url;
      
      // Build filename with category info
      const categoryLabel = selectedCategories.length > 0 
        ? `_${selectedCategories.join('-')}`
        : '';
      link.download = `Relatorio_Vendas_${periodLabel.replace(/\s+/g, '_')}${categoryLabel}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('[ExportReportButton] Export completed successfully');
      toast.success("Relatório exportado com sucesso!");
    } catch (error: any) {
      console.error("[ExportReportButton] Export error:", error);
      const errorMsg = error?.message || error?.toString?.() || "Erro desconhecido ao exportar";
      toast.error(`Erro ao exportar relatório: ${errorMsg}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      {categoryList.length > 0 && (
        <CategorySelector
          categories={categoryList}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
        />
      )}
      <Button
        onClick={handleExport}
        disabled={isExporting}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        {isExporting ? "Exportando..." : "Exportar Excel"}
      </Button>
    </div>
  );
}
