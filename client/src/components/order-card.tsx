import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, CreditCard, DollarSign } from "lucide-react";
import type { Order, OrderItem, Product, User } from "@shared/schema";

interface OrderWithRelations extends Order {
  user: User;
  orderItems: (OrderItem & { product: Product })[];
}

interface OrderCardProps {
  order: OrderWithRelations;
  onCancelOrder?: (orderId: string) => void;
  onUpdateStatus?: (orderId: string, status: string) => void;
  showCustomerInfo?: boolean;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  preparing: "bg-orange-100 text-orange-800 border-orange-200",
  ready: "bg-green-100 text-green-800 border-green-200",
  delivered: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export default function OrderCard({ 
  order, 
  onCancelOrder, 
  onUpdateStatus, 
  showCustomerInfo = false 
}: OrderCardProps) {
  const formatDate = (date: string) => {
    const orderDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (orderDate.toDateString() === today.toDateString()) {
      return `Hoje, ${orderDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else if (orderDate.toDateString() === yesterday.toDateString()) {
      return `Ontem, ${orderDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else {
      return orderDate.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const canCancel = order.status === 'pending' && onCancelOrder;

  return (
    <div className="bg-card rounded-lg border border-border p-6" data-testid={`order-card-${order.id}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center space-x-3 mb-2 sm:mb-0">
          <span className="text-lg font-semibold text-card-foreground" data-testid={`text-order-id-${order.id}`}>
            Pedido #{order.id.slice(-6)}
          </span>
          <Badge 
            className={`px-3 py-1 text-xs font-medium border ${statusColors[order.status as keyof typeof statusColors]}`}
            data-testid={`badge-order-status-${order.id}`}
          >
            {statusLabels[order.status as keyof typeof statusLabels]}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          <span data-testid={`text-order-date-${order.id}`}>{formatDate(order.createdAt!.toString())}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <h4 className="font-medium text-card-foreground mb-3">Itens do pedido:</h4>
          <div className="space-y-2">
            {order.orderItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2" data-testid={`order-item-${item.id}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                    <span className="text-xl">🥖</span>
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground" data-testid={`text-item-name-${item.id}`}>
                      {item.product.name}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`text-item-quantity-${item.id}`}>
                      Quantidade: {item.quantity}
                    </p>
                  </div>
                </div>
                <span className="font-medium text-card-foreground" data-testid={`text-item-subtotal-${item.id}`}>
                   {Number(item.subtotal).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Order and Customer Info */}
        <div>
          {showCustomerInfo && (
            <div className="mb-4">
              <h4 className="font-medium text-card-foreground mb-2">Cliente:</h4>
              <div className="text-sm">
                <p className="font-medium" data-testid={`text-customer-name-${order.id}`}>
                  {order.user.fullName}
                </p>
                <p className="text-muted-foreground" data-testid={`text-customer-classroom-${order.id}`}>
                  {order.user.classroom ? `Sala ${order.user.classroom}` : 'Sala não informada'}
                </p>
              </div>
            </div>
          )}

          <h4 className="font-medium text-card-foreground mb-3">Informações de entrega:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span data-testid={`text-delivery-location-${order.id}`}>{order.deliveryLocation}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span data-testid={`text-delivery-time-${order.id}`}>{order.deliveryTime}</span>
            </div>
            <div className="flex items-center space-x-2">
              {order.paymentMethod === 'cartão' ? (
                <CreditCard className="w-4 h-4 text-muted-foreground" />
              ) : (
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              )}
              <span data-testid={`text-payment-method-${order.id}`}>
                {order.paymentMethod === 'cartão' ? 'Cartão' : 'Dinheiro'}
              </span>
            </div>
          </div>

          {order.notes && (
            <div className="mt-3 p-2 bg-muted rounded text-sm">
              <p className="text-muted-foreground">Observações:</p>
              <p data-testid={`text-order-notes-${order.id}`}>{order.notes}</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span className="text-primary" data-testid={`text-order-total-${order.id}`}>
                Kz {Number(order.total).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 space-y-2">
            {onUpdateStatus && (
              <div className="flex space-x-2">
                {order.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onUpdateStatus(order.id, 'confirmed')}
                    data-testid={`button-confirm-order-${order.id}`}
                  >
                    Confirmar
                  </Button>
                )}
                {order.status === 'confirmed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onUpdateStatus(order.id, 'preparing')}
                    data-testid={`button-preparing-order-${order.id}`}
                  >
                    Preparando
                  </Button>
                )}
                {order.status === 'preparing' && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => onUpdateStatus(order.id, 'ready')}
                    data-testid={`button-ready-order-${order.id}`}
                  >
                    Pronto
                  </Button>
                )}
                {order.status === 'ready' && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => onUpdateStatus(order.id, 'delivered')}
                    data-testid={`button-delivered-order-${order.id}`}
                  >
                    Entregue
                  </Button>
                )}
              </div>
            )}
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => onCancelOrder(order.id)}
                data-testid={`button-cancel-order-${order.id}`}
              >
                Cancelar Pedido
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
