import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Loader2, AlertCircle, Edit2, Trash2 } from "lucide-react";
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

export function ProductListingLinks({
  productId,
  productCode,
  productName,
  channelId,
}: ProductListingLinksProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingLink, setEditingLink] = useState<{ id: number; channelId: number; url: string } | null>(null);
  const [deletingLink, setDeletingLink] = useState<{ id: number; channelId: number } | null>(null);
  
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
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
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
              ))}
            </div>
          )}

          {/* Add Link Form */}
          {channels && (
            <AddListingForm
              productId={productId}
              channels={channels}
              onSuccess={() => refetch()}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
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

      {/* Delete Confirmation */}
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
