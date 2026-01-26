import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Loader2, AlertCircle, Edit2, Trash2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditListingModal } from "./EditListingModal";
import { AddListingForm } from "./AddListingForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductListingLinksProps {
  productId: number;
  productCode: string;
  productName: string;
  channelId?: number;
}

interface PriceData {
  price: number | null;
  formatted: string;
  loading: boolean;
  error: string | null;
  marketplace: string;
  originalPrice?: number | null;
  originalPriceFormatted?: string | null;
  discount?: number | null;
  available?: boolean;
}

export function ProductListingLinks({
  productId,
  productCode,
  productName,
  channelId,
}: ProductListingLinksProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingLink, setEditingLink] = useState<{ id: number; channelId: number; url: string } | null>(null);
  const [deletingLink, setDeletingLink] = useState<{ id: number; channelId: number } | null>(null);
  const [priceData, setPriceData] = useState<Record<number, PriceData>>({});
  
  const { data: links, isLoading, refetch } = trpc.listings.getByProduct.useQuery(
    { productId },
    { enabled: isExpanded }
  );

  const { data: channels } = trpc.sales.channels.useQuery();

  const deleteMutation = trpc.listings.delete.useMutation({
    onSuccess: () => {
      setDeletingLink(null);
      refetch();
    },
  });

  const handleGetPrice = async (linkId: number, url: string, channelId: number) => {
    setPriceData(prev => ({
      ...prev,
      [linkId]: { 
        price: null, 
        formatted: '', 
        loading: true, 
        error: null, 
        marketplace: '',
        originalPrice: null,
        originalPriceFormatted: null,
        discount: null,
        available: false
      }
    }));

    try {
      const response = await fetch('/api/trpc/listings.getListingPrice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: { url } })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const result = data.result?.data;
      
      if (!result) {
        throw new Error('Resposta inválida do servidor');
      }
      
      setPriceData(prev => ({
        ...prev,
        [linkId]: {
          price: result.price,
          formatted: result.priceFormatted || '',
          loading: false,
          error: result.error,
          marketplace: result.marketplace || '',
          originalPrice: result.originalPrice,
          originalPriceFormatted: result.originalPriceFormatted,
          discount: result.discount,
          available: result.available
        }
      }));
    } catch (error) {
      setPriceData(prev => ({
        ...prev,
        [linkId]: {
          price: null,
          formatted: '',
          loading: false,
          error: error instanceof Error ? error.message : 'Erro ao consultar preço',
          marketplace: '',
          originalPrice: null,
          originalPriceFormatted: null,
          discount: null,
          available: false
        }
      }));
    }
  };

  const handleDelete = async () => {
    if (!deletingLink) return;
    await deleteMutation.mutateAsync({
      productId,
      channelId: deletingLink.channelId,
    });
  };

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
      >
        Ver Links
      </Button>
    );
  }

  return (
    <>
      <Card className="mt-4 bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Links de Anúncio - {productCode}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              ✕
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{productName}</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
              <span className="text-sm text-gray-600">Carregando links...</span>
            </div>
          ) : !links || links.length === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />
              <p className="text-sm text-yellow-700">
                Nenhum link de anúncio cadastrado para este produto
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {links
                .filter((link) => !channelId || link.channelId === channelId)
                .map((link) => (
                <div
                  key={link.id}
                  className="flex flex-col p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">
                        {link.channelId === 1 ? "Amazon" :
                         link.channelId === 2 ? "Magalu" :
                         link.channelId === 3 ? "Mercado Livre" :
                         link.channelId === 4 ? "Shopee" :
                         link.channelId === 5 ? "TikTok" : `Canal ${link.channelId}`}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {link.listingUrl}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGetPrice(link.id, link.listingUrl, link.channelId)}
                        disabled={priceData[link.id]?.loading}
                        title="Consultar preço"
                      >
                        {priceData[link.id]?.loading ? (
                          <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                        ) : (
                          <DollarSign className="w-4 h-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingLink({ id: link.id, channelId: link.channelId, url: link.listingUrl })}
                        title="Editar link"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingLink({ id: link.id, channelId: link.channelId })}
                        title="Deletar link"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={link.listingUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  {priceData[link.id] && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      {priceData[link.id].error ? (
                        <p className="text-xs text-red-600">❌ {priceData[link.id].error}</p>
                      ) : priceData[link.id].formatted ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-green-700">
                              {priceData[link.id].formatted}
                            </p>
                            {priceData[link.id].discount && priceData[link.id].discount > 0 && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                -{priceData[link.id].discount}%
                              </span>
                            )}
                            {priceData[link.id].available === false && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                                Fora de estoque
                              </span>
                            )}
                          </div>
                          {priceData[link.id].originalPriceFormatted && (
                            <p className="text-xs text-gray-500 line-through">
                              De: {priceData[link.id].originalPriceFormatted}
                            </p>
                          )}
                          <p className="text-xs text-gray-600">
                            📍 {priceData[link.id].marketplace}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {channels && (
            <AddListingForm
              productId={productId}
              channels={channels}
              onSuccess={() => refetch()}
            />
          )}
        </CardContent>
      </Card>

      {editingLink && (
        <EditListingModal
          productId={productId}
          link={editingLink}
          onClose={() => setEditingLink(null)}
          onSuccess={() => {
            setEditingLink(null);
            refetch();
          }}
        />
      )}

      <AlertDialog open={!!deletingLink} onOpenChange={(open) => !open && setDeletingLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Link de Anúncio?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este link? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
