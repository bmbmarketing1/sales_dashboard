import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface Product {
  id: number;
  internalCode: string;
  description: string;
  dailyGoal: number;
}

interface Channel {
  id: number;
  name: string;
  dailyGoal: number;
}

interface GoalEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess?: () => void;
}

export function GoalEditor({ open, onOpenChange, product, onSuccess }: GoalEditorProps) {
  const [productGoal, setProductGoal] = useState(0);
  const [channelGoals, setChannelGoals] = useState<Record<number, number>>({});
  
  const { data: channels } = trpc.channels.list.useQuery();
  const { data: productChannelGoals } = trpc.productChannelGoals.list.useQuery();
  
  const updateProductGoal = trpc.products.updateGoal.useMutation({
    onSuccess: () => {
      toast.success("Meta do produto atualizada!");
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });
  
  const updateProductChannelGoal = trpc.productChannelGoals.update.useMutation({
    onSuccess: () => {
      toast.success("Meta por canal atualizada!");
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });
  
  useEffect(() => {
    if (product) {
      setProductGoal(product.dailyGoal);
      
      // Load channel goals for this product
      const goals: Record<number, number> = {};
      productChannelGoals?.forEach(g => {
        if (g.productId === product.id) {
          goals[g.channelId] = g.dailyGoal;
        }
      });
      setChannelGoals(goals);
    }
  }, [product, productChannelGoals]);
  
  const handleSaveProductGoal = () => {
    if (!product) return;
    updateProductGoal.mutate({
      productId: product.id,
      dailyGoal: productGoal,
    });
  };
  
  const handleSaveChannelGoal = (channelId: number) => {
    if (!product) return;
    updateProductChannelGoal.mutate({
      productId: product.id,
      channelId,
      dailyGoal: channelGoals[channelId] || 0,
    });
  };
  
  if (!product) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Metas</DialogTitle>
          <DialogDescription>
            {product.internalCode} - {product.description}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="product" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="product">Meta do Produto</TabsTrigger>
            <TabsTrigger value="channels">Metas por Canal</TabsTrigger>
          </TabsList>
          
          <TabsContent value="product" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="productGoal">Meta Diária (unidades)</Label>
              <div className="flex gap-2">
                <Input
                  id="productGoal"
                  type="number"
                  min="0"
                  value={productGoal}
                  onChange={(e) => setProductGoal(parseInt(e.target.value) || 0)}
                  className="flex-1"
                />
                <Button
                  onClick={handleSaveProductGoal}
                  disabled={updateProductGoal.isPending}
                >
                  {updateProductGoal.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Esta meta é usada para calcular o termômetro geral do produto.
            </p>
          </TabsContent>
          
          <TabsContent value="channels" className="space-y-4 mt-4">
            {channels?.map((channel) => (
              <div key={channel.id} className="space-y-2">
                <Label htmlFor={`channel-${channel.id}`}>{channel.name}</Label>
                <div className="flex gap-2">
                  <Input
                    id={`channel-${channel.id}`}
                    type="number"
                    min="0"
                    value={channelGoals[channel.id] || 0}
                    onChange={(e) => setChannelGoals({
                      ...channelGoals,
                      [channel.id]: parseInt(e.target.value) || 0,
                    })}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleSaveChannelGoal(channel.id)}
                    disabled={updateProductChannelGoal.isPending}
                  >
                    {updateProductChannelGoal.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
            <p className="text-sm text-gray-500">
              Defina metas específicas para cada canal de vendas.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
