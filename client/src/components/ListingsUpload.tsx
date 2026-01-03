import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader, Upload } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ListingsUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ListingsUpload({ open, onOpenChange, onSuccess }: ListingsUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const importMutation = trpc.listings.importFromFile.useMutation();
  
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
        try {
          const base64 = (e.target?.result as string).split(',')[1];
          
          const result = await importMutation.mutateAsync({
            fileName: selectedFile.name,
            fileBase64: base64,
          });
          
          setMessage({
            type: 'success',
            text: `✅ ${result.recordsImported} links de anúncio importados com sucesso!`,
          });
          
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          // Close modal after 2 seconds
          setTimeout(() => {
            onOpenChange(false);
            onSuccess?.();
          }, 2000);
        } catch (error) {
          setMessage({
            type: 'error',
            text: `❌ Erro ao importar links: ${error instanceof Error ? error.message : 'Desconhecido'}`,
          });
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setMessage({
          type: 'error',
          text: '❌ Erro ao ler arquivo',
        });
        setLoading(false);
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
          <DialogTitle>Importar Links de Anúncios</DialogTitle>
          <DialogDescription>
            Importe links de anúncios por produto e marketplace usando uma planilha XLS/XLSX
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File input - styled button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileSelect}
              disabled={loading}
              className="hidden"
              id="listings-file-input"
            />
            <label htmlFor="listings-file-input">
              <Button
                variant="outline"
                className="w-full cursor-pointer"
                disabled={loading}
                asChild
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {selectedFile ? selectedFile.name : 'Escolher arquivo'}
                </div>
              </Button>
            </label>
          </div>
          
          {/* Selected file name */}
          {selectedFile && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                ✓ Arquivo selecionado: <strong>{selectedFile.name}</strong>
              </p>
            </div>
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
              <p className="text-sm text-blue-700">Importando links...</p>
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
          <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-lg">
            <p><strong>Formato esperado:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Coluna 1: Referência (BL001, BL002, etc.)</li>
              <li>Coluna 2: Marketplace (Amazon, Magalu, Mercado Livre, Shopee, TikTok)</li>
              <li>Coluna 3: Link (URL completo do anúncio)</li>
            </ul>
            <p className="mt-2"><strong>Exemplo:</strong></p>
            <p>BL001 | Amazon | https://amazon.com.br/dp/...</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
