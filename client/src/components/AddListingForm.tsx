import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface AddListingFormProps {
  productId: number;
  channels: Array<{ id: number; name: string }>;
  onSuccess?: () => void;
}

export function AddListingForm({ productId, channels, onSuccess }: AddListingFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [listingUrl, setListingUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createMutation = trpc.listings.create.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setListingUrl("");
      setSelectedChannel("");
      toast.success("Link adicionado com sucesso!");
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        onSuccess?.();
      }, 1500);
    },
    onError: (error) => {
      const errorMsg = error.message || "Erro ao adicionar link";
      setError(errorMsg);
      toast.error(errorMsg);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedChannel || !listingUrl) {
      setError("Preencha todos os campos");
      return;
    }

    const channelId = parseInt(selectedChannel);
    setIsLoading(true);

    try {
      await createMutation.mutateAsync({
        productId,
        channelId,
        listingUrl,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="sm"
        variant="outline"
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Adicionar Link
      </Button>
    );
  }

  return (
    <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Adicionar Novo Link</h3>
        <button
          onClick={() => {
            setIsOpen(false);
            setError(null);
            setSuccess(false);
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle className="h-4 w-4" />
          <span>Link adicionado com sucesso!</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Marketplace
          </label>
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecione um marketplace" />
            </SelectTrigger>
            <SelectContent>
              {channels.map((channel) => (
                <SelectItem key={channel.id} value={channel.id.toString()}>
                  {channel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            URL do Anúncio
          </label>
          <Input
            type="url"
            placeholder="https://..."
            value={listingUrl}
            onChange={(e) => setListingUrl(e.target.value)}
            disabled={isLoading}
            className="h-9 text-sm"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              setError(null);
              setSuccess(false);
            }}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !selectedChannel || !listingUrl}
            className="gap-2"
          >
            {isLoading ? "Adicionando..." : "Adicionar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
