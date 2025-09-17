import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

import Header from "@/components/header";
import OrderCard from "@/components/order-card";
import { authenticatedFetch, authService } from "@/lib/auth";
import type { Order, OrderItem, Product, User } from "@shared/schema";

interface OrderWithRelations extends Order {
  user: User;
  orderItems: (OrderItem & { product: Product })[];
}

export default function Orders() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await authenticatedFetch(`/api/orders?${params}`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json() as Promise<OrderWithRelations[]>;
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await authenticatedFetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to cancel order");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pedido cancelado",
        description: "Seu pedido foi cancelado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm("Tem certeza que deseja cancelar este pedido?")) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  const handleLogout = () => {
    setLocation("/");
  };

  if (!authService.isAuthenticated()) {
    setLocation("/");
    return null;
  }

  const filterButtons = [
    { value: "all", label: "Todos", count: orders.length },
    { value: "pending", label: "Pendentes", count: orders.filter(o => o.status === 'pending').length },
    { value: "confirmed", label: "Confirmados", count: orders.filter(o => o.status === 'confirmed').length },
    { value: "delivered", label: "Entregues", count: orders.filter(o => o.status === 'delivered').length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header 
        cartCount={0}
        onCartClick={() => {}}
        onLogout={handleLogout}
      />

      {/* Navigation Tabs */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <Tabs value="orders" className="w-full">
            <TabsList className="h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="catalog" 
                className="px-6 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground bg-transparent data-[state=active]:bg-transparent rounded-none"
                onClick={() => setLocation("/")}
                data-testid="tab-catalog"
              >
                🏪 Catálogo
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="px-6 py-3 border-b-2 border-primary text-primary bg-transparent data-[state=active]:bg-transparent rounded-none"
                data-testid="tab-orders"
              >
                📋 Meus Pedidos
              </TabsTrigger>
              {authService.isAdmin() && (
                <TabsTrigger 
                  value="admin" 
                  className="px-6 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground bg-transparent data-[state=active]:bg-transparent rounded-none"
                  onClick={() => setLocation("/admin")}
                  data-testid="tab-admin"
                >
                  ⚙️ Administração
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Meus Pedidos</h2>
          <p className="text-muted-foreground">Acompanhe o status dos seus pedidos</p>
        </div>

        {/* Order Filters */}
        <div className="mb-6 bg-card p-4 rounded-lg border border-border">
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? "default" : "secondary"}
                size="sm"
                onClick={() => setStatusFilter(filter.value)}
                data-testid={`button-filter-${filter.value}`}
              >
                {filter.label} {filter.count > 0 && `(${filter.count})`}
              </Button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" data-testid="loading-orders"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12" data-testid="text-no-orders">
            <p className="text-muted-foreground text-lg">Nenhum pedido encontrado</p>
            <p className="text-muted-foreground">
              {statusFilter === "all" 
                ? "Você ainda não fez nenhum pedido"
                : `Nenhum pedido com status "${statusFilter}"`
              }
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setLocation("/")}
              data-testid="button-browse-products"
            >
              Ver Produtos
            </Button>
          </div>
        ) : (
          <div className="space-y-4" data-testid="list-orders">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onCancelOrder={handleCancelOrder}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
