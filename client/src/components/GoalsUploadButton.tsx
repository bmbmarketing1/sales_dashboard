import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useCallback } from "react";
import { trpc } from "@/lib/trpc";

export function GoalsUploadButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.goals.importFromFile.useMutation();

  const showToast = useCallback((title: string, description: string, variant: string = "default") => {
    if (variant === "destructive") {
      console.error(`${title}: ${description}`);
    } else {
      console.log(`${title}: ${description}`);
    }
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      showToast("Erro", "Por favor, selecione um arquivo Excel (.xlsx ou .xls)", "destructive");
      return;
    }

    setIsLoading(true);
    try {
      // Ler arquivo como base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const base64 = Buffer.from(buffer).toString("base64");

        // Mostrar preview antes de confirmar
        setPreviewData({
          fileName: file.name,
          fileBase64: base64,
          fileSize: file.size,
        });
        setShowPreview(true);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro ao ler arquivo";
      showToast("Erro", errorMsg, "destructive");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmUpload = async () => {
    if (!previewData) return;

    setIsLoading(true);
    try {
      const result = await uploadMutation.mutateAsync({
        fileName: previewData.fileName,
        fileBase64: previewData.fileBase64,
      });

      setUploadResult(result);
      setShowPreview(false);

      if (result.success) {
        showToast("Sucesso", result.summary);
      } else {
        showToast("Aviso", result.summary, "destructive");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro ao processar arquivo";
      showToast("Erro", errorMsg, "destructive");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        variant="outline"
        className="gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Importar Metas
          </>
        )}
      </Button>

      {showPreview && previewData && (
        <Card className="fixed inset-0 m-auto w-96 max-h-96 p-4 z-50 shadow-lg">
          <div className="space-y-3">
            <div>
              <p className="font-semibold">Confirmar importação?</p>
              <p className="text-sm text-gray-600">
                Arquivo: <span className="font-mono">{previewData.fileName}</span>
              </p>
              <p className="text-sm text-gray-600">
                Tamanho: {(previewData.fileSize / 1024).toFixed(2)} KB
              </p>
            </div>

            <p className="text-sm text-gray-700">
              As metas de produtos encontrados serão atualizadas. Produtos não encontrados serão ignorados.
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowPreview(false);
                  setPreviewData(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmUpload}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Importando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {uploadResult && (
        <Card className="mt-4 p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              {uploadResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{uploadResult.summary}</p>
              </div>
            </div>

            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="mt-3 border-t pt-3">
                <p className="text-sm font-semibold mb-2">Erros encontrados:</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {uploadResult.errors.map((error: any, idx: number) => (
                    <div key={idx} className="text-sm text-red-600">
                      <span className="font-mono">Linha {error.row}</span> ({error.sku}): {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUploadResult(null)}
              >
                Fechar
              </Button>
              {uploadResult.success && (
                <Button
                  size="sm"
                  onClick={() => {
                    setUploadResult(null);
                    window.location.reload();
                  }}
                >
                  Recarregar página
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
