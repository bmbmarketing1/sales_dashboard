import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Upload, FolderTree } from "lucide-react";

interface CategoryUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CategoryUpload({ open, onOpenChange, onSuccess }: CategoryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const importCategories = trpc.categories.import.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.updatedCount} produtos atualizados com categorias!`);
      setSelectedFile(null);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xls' && ext !== 'xlsx') {
        toast.error("Formato inválido. Use arquivos .xls ou .xlsx");
        return;
      }
      setSelectedFile(file);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    try {
      // Convert file to base64
      const arrayBuffer = await selectedFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );
      
      await importCategories.mutateAsync({
        fileBase64: base64,
        fileName: selectedFile.name,
      });
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="w-5 h-5" />
            Importar Categorias
          </DialogTitle>
          <DialogDescription>
            Envie uma planilha com as colunas "Código Interno" e "Categoria" para categorizar os produtos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xls,.xlsx"
              className="hidden"
            />
            
            {selectedFile ? (
              <div className="space-y-2">
                <FolderTree className="w-12 h-12 mx-auto text-blue-500" />
                <p className="font-medium text-gray-700">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  Clique para selecionar outro arquivo
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <p className="text-gray-500">
                  Clique para selecionar o arquivo de categorias
                </p>
                <p className="text-sm text-gray-400">
                  Formatos aceitos: .xls, .xlsx
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Formato esperado:</strong> A planilha deve conter as colunas "Código Interno" e "Categoria".
            </p>
          </div>
          
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Importar Categorias
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
