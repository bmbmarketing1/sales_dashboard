import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Package } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ProductUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProductUpload({ open, onOpenChange, onSuccess }: ProductUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const uploadMutation = trpc.importProducts.upload.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.addedCount} produtos importados com sucesso!`);
      setFile(null);
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao importar: ${error.message}`);
    },
  });
  
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xls') || droppedFile.name.endsWith('.xlsx')) {
        setFile(droppedFile);
      } else {
        toast.error("Por favor, envie um arquivo .xls ou .xlsx");
      }
    }
  }, []);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      uploadMutation.mutate({
        fileBase64: base64,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Importar Novos Produtos
          </DialogTitle>
          <DialogDescription>
            Envie uma planilha com novos produtos para adicionar ao sistema.
            <br />
            <strong>Formato esperado:</strong> Cód. ID | Cód. Interno | Descrição
          </DialogDescription>
        </DialogHeader>
        
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'}
            ${file ? 'border-green-500 bg-green-50' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="font-medium text-green-700">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFile(null)}
              >
                Trocar arquivo
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FileSpreadsheet className="w-12 h-12 text-gray-400" />
              <p className="text-gray-600">
                Arraste um arquivo .xls ou .xlsx aqui
              </p>
              <p className="text-sm text-gray-400">ou</p>
              <label className="cursor-pointer">
                <span className="text-green-600 hover:text-green-700 font-medium">
                  clique para selecionar
                </span>
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
          <p className="font-medium mb-1">Exemplo de planilha:</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">Cód. ID</th>
                <th className="text-left py-1">Cód. Interno</th>
                <th className="text-left py-1">Descrição</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1">12930</td>
                <td className="py-1">BQ098</td>
                <td className="py-1">NOVO PRODUTO</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploadMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Importar Produtos
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
