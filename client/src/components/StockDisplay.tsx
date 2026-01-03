import { trpc } from "@/lib/trpc";
import { skipToken } from "@tanstack/react-query";

interface StockDisplayProps {
  productId: number;
  channelId: number;
}

export function StockDisplay({ productId, channelId }: StockDisplayProps) {
  const { data: stock } = trpc.listings.getByProductAndChannel.useQuery(
    productId && channelId ? { productId, channelId } : skipToken
  );

  if (!stock) {
    return null;
  }

  return (
    <div className="text-right shrink-0">
      <div className="text-xs text-gray-600 font-medium">
        Full - {stock.fullStock || 0} / Cross: {stock.crossStock || 0}
      </div>
    </div>
  );
}
