import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Minus, Plus, Trash2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authenticatedFetch } from "@/lib/auth";
import type { Product } from "@shared/schema";
import { Input } from "@/components/ui/input"

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export default function CartModal({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}: CartModalProps) {
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Multicaixa Express");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await authenticatedFetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar pedido");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pedido criado com sucesso!",
        description: "Seu pedido foi enviado e está sendo processado.",
      });
      onClearCart();
      onClose();
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const subtotal = items.reduce((total, item) => {
    return total + Number(item.product.price) * item.quantity;
  }, 0);

  const total = subtotal; // No delivery fee for now

  const handleCheckout = () => {
    if (!deliveryLocation || !deliveryTime) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha local e horário de entrega.",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho antes de finalizar.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      deliveryLocation,
      deliveryTime,
      paymentMethod,
      notes,
      items: items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };

    createOrderMutation.mutate(orderData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" data-testid="modal-cart">
      <div className="bg-popover rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-popover-foreground">Meu Carrinho</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="button-close-cart"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4">
          {/* Cart Items */}
          <div className="space-y-4 mb-6">
            {items.length === 0 ? (
              <div className="text-center py-8" data-testid="text-empty-cart">
                <p className="text-muted-foreground">Seu carrinho está vazio</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="flex items-center space-x-3 p-3 bg-muted rounded-lg" data-testid={`cart-item-${item.product.id}`}>
                  <div className="w-12 h-12 bg-background rounded-md flex items-center justify-center">
                    <span className="text-2xl">🥖</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-popover-foreground" data-testid={`text-item-name-${item.product.id}`}>
                      {item.product.name}
                    </h4>
                    <p className="text-sm text-muted-foreground" data-testid={`text-item-price-${item.product.id}`}>
                      cada {Number(item.product.price).toFixed(2)} Kz
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      data-testid={`button-decrease-${item.product.id}`}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium" data-testid={`text-quantity-${item.product.id}`}>
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      data-testid={`button-increase-${item.product.id}`}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-popover-foreground" data-testid={`text-item-total-${item.product.id}`}>
                      Kz {(Number(item.product.price) * item.quantity).toFixed(2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:text-destructive p-1"
                      onClick={() => onRemoveItem(item.product.id)}
                      data-testid={`button-remove-${item.product.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <>
              {/* Delivery Details Form */}
              <div className="border-t border-border pt-4 mb-6">
                <h4 className="font-medium text-popover-foreground mb-3">Detalhes da Entrega</h4>
                <div className="space-y-3">
                  <div>
                    <Label 
                      htmlFor="deliveryLocation"
                      className="text-sm font-medium text-muted-foreground mb-1">
                      Sala para Entrega
                    </Label>
                    <Input
                      id="deliveryLocation"
                      type="text"
                      placeholder="Digite sua sala"
                      value={deliveryLocation}
                      onChange={(e) => setDeliveryLocation(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-1">
                      Horário de Entrega
                    </Label>
                    <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                      <SelectTrigger data-testid="select-delivery-time">
                        <SelectValue placeholder="Selecione o horário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="09:30 - Intervalo">09:30 - Intervalo (Recomendado)</SelectItem>
                        <SelectItem value="12:00 - Almoço">12:00 - Almoço</SelectItem>
                        <SelectItem value="15:25 - Intervalo da Tarde">15:25 - Intervalo da Tarde</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2">
                      Forma de Pagamento
                    </Label>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pix" id="pix" data-testid="radio-payment-pix" />
                        <Label htmlFor="pix" className="text-sm text-popover-foreground cursor-pointer">
                          <CreditCard className="w-4 h-4 inline mr-2 text-accent" />
                      Cartão (Recomendado)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cash" id="cash" data-testid="radio-payment-cash" />
                        <Label htmlFor="cash" className="text-sm text-popover-foreground cursor-pointer">
                          💰 Dinheiro na Entrega
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-1">
                      Observações (opcional)
                    </Label>
                    <Textarea
                      placeholder="Alguma observação especial..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="h-20 resize-none"
                      data-testid="textarea-notes"
                    />
                  </div>
                </div>
              </div>

              {/* Cart Summary */}
              <div className="border-t border-border pt-4">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
                    <span className="text-popover-foreground" data-testid="text-subtotal">
                       {subtotal.toFixed(2)} Kz
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de Entrega</span>
                    <span className="text-accent">Grátis</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t border-border pt-2">
                    <span className="text-popover-foreground">Total</span>
                    <span className="text-primary" data-testid="text-total">
                       {total.toFixed(2)} Kz
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={createOrderMutation.isPending}
                  data-testid="button-checkout"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {createOrderMutation.isPending ? "Finalizando..." : "Finalizar Pedido"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
