import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";

interface StockUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function StockUpload({ open, onOpenChange, onSuccess }: StockUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  
  const uploadMutation = trpc.stock.uploadStock.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFeedback({ type: null, message: "" });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setFeedback({ type: null, message: "" });
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = (event.target?.result as string).split(",")[1];
          const result = await uploadMutation.mutateAsync({
            fileName: selectedFile.name,
            fileBase64: base64,
          });

          setFeedback({
            type: "success",
            message: `✅ ${result.message || `${result.recordsImported} produtos importados com sucesso!`}`,
          });
          
          setTimeout(() => {
            setSelectedFile(null);
            setFeedback({ type: null, message: "" });
            onOpenChange(false);
            onSuccess?.();
          }, 2000);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
          setFeedback({
            type: "error",
            message: `❌ ${errorMessage}`,
          });
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar arquivo";
      setFeedback({
        type: "error",
        message: `❌ ${errorMessage}`,
      });
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
          
          {/* Feedback de sucesso */}
          {feedback.type === "success" && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-700">{feedback.message}</p>
            </div>
          )}
          
          {/* Feedback de erro */}
          {feedback.type === "error" && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-700">{feedback.message}</p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                "Enviar"
              )}
            </Button>
            <Button
              onClick={() => {
                setSelectedFile(null);
                setFeedback({ type: null, message: "" });
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
