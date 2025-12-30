import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface GoalsUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function GoalsUpload({ open, onOpenChange, onSuccess }: GoalsUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const importMutation = trpc.goals.importFromFile.useMutation();
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMessage(null);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setLoading(true);
      setMessage(null);
      
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        
        try {
          const result = await importMutation.mutateAsync({
            fileName: selectedFile.name,
            fileBase64: base64,
          });
          
          setMessage({
            type: 'success',
            text: `✅ ${result.recordsImported} metas importadas com sucesso!`,
          });
          
          setSelectedFile(null);
          
          // Close modal after 2 seconds
          setTimeout(() => {
            onOpenChange(false);
            onSuccess?.();
          }, 2000);
        } catch (error) {
          setMessage({
            type: 'error',
            text: `❌ Erro ao importar metas: ${error instanceof Error ? error.message : 'Desconhecido'}`,
          });
        } finally {
          setLoading(false);
        }
      };
      
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Desconhecido'}`,
      });
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Metas</DialogTitle>
          <DialogDescription>
            Importe metas de produtos por marketplace usando uma planilha XLS/XLSX
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File input */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileSelect}
              disabled={loading}
              className="flex-1"
            />
          </div>
          
          {/* Selected file name */}
          {selectedFile && (
            <p className="text-sm text-gray-600">
              Arquivo selecionado: <strong>{selectedFile.name}</strong>
            </p>
          )}
          
          {/* Message */}
          {message && (
            <div className={`flex items-start gap-2 p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
              )}
              <p className={`text-sm ${
                message.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {message.text}
              </p>
            </div>
          )}
          
          {/* Loading state */}
          {loading && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader className="w-4 h-4 animate-spin text-blue-600" />
              <p className="text-sm text-blue-700">Importando metas...</p>
            </div>
          )}
          
          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || loading}
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
          
          {/* Help text */}
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Formato esperado:</strong></p>
            <ul className="list-disc list-inside">
              <li>Primeira coluna: Código Interno (BL001, BL002, etc.)</li>
              <li>Colunas seguintes: Amazon, Magalu, Mercado Livre, Shopee, TikTok</li>
              <li>Valores: metas diárias para cada marketplace</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
