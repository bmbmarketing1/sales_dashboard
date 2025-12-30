import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";

interface StockUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function StockUpload({ open, onOpenChange, onSuccess }: StockUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const uploadMutation = trpc.stock.uploadStock.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = (event.target?.result as string).split(",")[1];
          const result = await uploadMutation.mutateAsync({
            fileName: selectedFile.name,
            fileBase64: base64,
          });

          console.log(`${result.recordsImported} produtos com estoque importados`);
          setSelectedFile(null);
          onOpenChange(false);
          onSuccess?.();
        } catch (error) {
          console.error("Erro ao importar estoque:", error);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Estoque</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione uma planilha XLS com as colunas de estoque (Crossdocking e Fulfillment por marketplace)
          </p>
          <input
            type="file"
            accept=".xls,.xlsx"
            onChange={handleFileSelect}
            disabled={isLoading}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {selectedFile && (
            <p className="text-sm text-gray-600">
              Arquivo selecionado: <strong>{selectedFile.name}</strong>
            </p>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isLoading}
              className="flex-1"
            >
              {isLoading ? "Importando..." : "Enviar"}
            </Button>
            <Button
              onClick={() => {
                setSelectedFile(null);
                onOpenChange(false);
              }}
              variant="outline"
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
