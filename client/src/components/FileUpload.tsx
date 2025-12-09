import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface FileUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function FileUpload({ open, onOpenChange, onSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const importMutation = trpc.import.processFile.useMutation({
    onSuccess: (data) => {
      toast.success(`Arquivo importado com sucesso! ${data.recordsImported} registros processados.`);
      setFile(null);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const handleFileSelect = (selectedFile: File) => {
    // Validate file extension
    if (!selectedFile.name.toLowerCase().endsWith(".xls")) {
      toast.error("Apenas arquivos .xls são aceitos");
      return;
    }
    
    // Validate filename format
    const match = selectedFile.name.match(/^(\d{2})-(\d{2})-(\d{4})\.xls$/i);
    if (!match) {
      toast.error("Nome do arquivo deve ser no formato DD-MM-YYYY.xls");
      return;
    }
    
    setFile(selectedFile);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      importMutation.mutate({
        fileName: file.name,
        fileBase64: base64,
      });
    };
    reader.readAsDataURL(file);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Planilha de Vendas</DialogTitle>
          <DialogDescription>
            Selecione um arquivo XLS com o formato DD-MM-YYYY.xls
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="w-12 h-12 text-green-500" />
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Remover
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-12 h-12 text-gray-400" />
                <p className="text-gray-600">
                  Arraste o arquivo aqui ou{" "}
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    clique para selecionar
                  </button>
                </p>
                <p className="text-sm text-gray-400">
                  Formato: DD-MM-YYYY.xls
                </p>
              </div>
            )}
          </div>
          
          {/* Status indicators */}
          {file && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Formato do arquivo válido</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Nome do arquivo válido</span>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
