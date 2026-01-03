import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
  
  const { data: links, isLoading } = trpc.listings.getByProduct.useQuery(
    { productId },
    { enabled: isExpanded }
  );

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
      
      <CardContent>
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
            {links.map((link) => (
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
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="ml-2 shrink-0"
                >
                  <a href={link.listingUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
