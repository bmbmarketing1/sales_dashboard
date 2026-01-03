import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";

interface EditListingModalProps {
  productId: number;
  link: { id: number; channelId: number; url: string };
  onClose: () => void;
  onSuccess: () => void;
}

export function EditListingModal({
  productId,
  link,
  onClose,
  onSuccess,
}: EditListingModalProps) {
  const [url, setUrl] = useState(link.url);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const updateMutation = trpc.listings.update.useMutation();

  const getChannelName = (channelId: number) => {
    const channels: Record<number, string> = {
      1: "Amazon",
      2: "Magalu",
      3: "Mercado Livre",
      4: "Shopee",
      5: "TikTok",
    };
    return channels[channelId] || `Canal ${channelId}`;
  };

  const handleSave = async () => {
    if (!url.trim()) {
      setMessage({ type: 'error', text: 'URL não pode estar vazia' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      await updateMutation.mutateAsync({
        id: link.id,
        productId,
        channelId: link.channelId,
        listingUrl: url,
      });

      setMessage({ type: 'success', text: '✅ Link atualizado com sucesso!' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Erro ao atualizar: ${error instanceof Error ? error.message : 'Desconhecido'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Link de Anúncio</DialogTitle>
          <DialogDescription>
            Atualize a URL do anúncio para {getChannelName(link.channelId)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Channel info */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">Marketplace</p>
            <p className="text-sm font-medium text-gray-900">
              {getChannelName(link.channelId)}
            </p>
          </div>

          {/* URL input */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              URL do Anúncio
            </label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              disabled={loading}
              className="w-full"
            />
          </div>

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
              <p className="text-sm text-blue-700">Atualizando link...</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !url.trim()}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
