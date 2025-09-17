import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ShoppingBag, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp,
  Edit2,
  Trash2,
  Plus,
  Download,
  Package
} from "lucide-react";

import Header from "@/components/header";
import OrderCard from "@/components/order-card";
import { authenticatedFetch, authService } from "@/lib/auth";
import { insertProductSchema, type Product, type Order, type OrderItem, type User } from "@shared/schema";

interface OrderWithRelations extends Order {
  user: User;
  orderItems: (OrderItem & { product: Product })[];
}

interface AdminStats {
  ordersToday: number;
  revenueToday: number;
  lowStockCount: number;
  deliveryRate: number;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  imageUrl?: string;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("orders");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(insertProductSchema.omit({ 
      rating: true, 
      reviewCount: true, 
      isActive: true 
    }).extend({
      price: insertProductSchema.shape.price.transform(String),
      stock: insertProductSchema.shape.stock.transform(String),
    })),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      stock: "",
      imageUrl: "",
    },
  });

  // Fetch admin stats
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/admin/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json() as Promise<AdminStats>;
    },
  });

  // Fetch orders for admin
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/orders");
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json() as Promise<OrderWithRelations[]>;
    },
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json() as Promise<Product[]>;
    },
  });

  // Fetch low stock products
  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ["/api/admin/low-stock"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/admin/low-stock");
      if (!response.ok) throw new Error("Failed to fetch low stock products");
      return response.json() as Promise<Product[]>;
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await authenticatedFetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update order status");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Status do pedido atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create/Update product mutation
  const saveProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const productData = {
        ...data,
        price: data.price,
        stock: parseInt(data.stock),
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const response = await authenticatedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save product");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: editingProduct ? "Produto atualizado!" : "Produto criado!",
        description: "As alterações foram salvas com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      productForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await authenticatedFetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete product");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Produto removido com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, stock }: { productId: string; stock: number }) => {
      const response = await authenticatedFetch(`/api/products/${productId}/stock`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update stock");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Estoque atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/low-stock"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar estoque",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateOrderStatus = (orderId: string, status: string) => {
    updateOrderStatusMutation.mutate({ orderId, status });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    productForm.reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock: product.stock.toString(),
      imageUrl: product.imageUrl || "",
    });
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm("Tem certeza que deseja remover este produto?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    productForm.reset();
    setIsProductDialogOpen(true);
  };

  const onSubmitProduct = (data: ProductFormData) => {
    saveProductMutation.mutate(data);
  };

  const handleLogout = () => {
    setLocation("/");
  };

  if (!authService.isAuthenticated() || !authService.isAdmin()) {
    setLocation("/");
    return null;
  }

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
          <Tabs value="admin" className="w-full">
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
                className="px-6 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground bg-transparent data-[state=active]:bg-transparent rounded-none"
                onClick={() => setLocation("/orders")}
                data-testid="tab-orders"
              >
                📋 Meus Pedidos
              </TabsTrigger>
              <TabsTrigger 
                value="admin" 
                className="px-6 py-3 border-b-2 border-primary text-primary bg-transparent data-[state=active]:bg-transparent rounded-none"
                data-testid="tab-admin"
              >
                ⚙️ Administração
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Painel Administrativo</h2>
          <p className="text-muted-foreground">Gerencie pedidos, produtos e estoque</p>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pedidos Hoje</p>
                  <p className="text-2xl font-bold text-card-foreground" data-testid="text-orders-today">
                    {stats?.ordersToday || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-accent mr-1" />
                <span className="text-accent">vs ontem</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receita Hoje</p>
                  <p className="text-2xl font-bold text-card-foreground" data-testid="text-revenue-today">
                    Kz {stats?.revenueToday?.toFixed(2) || "0,00"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-accent mr-1" />
                <span className="text-accent">vs ontem</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                  <p className="text-2xl font-bold text-card-foreground" data-testid="text-low-stock">
                    {stats?.lowStockCount || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>
              <div className="mt-2 text-sm text-destructive">
                {stats?.lowStockCount ? "Ação necessária" : "Tudo ok"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa Entrega</p>
                  <p className="text-2xl font-bold text-card-foreground" data-testid="text-delivery-rate">
                    {stats?.deliveryRate || 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
              </div>
              <div className="mt-2 text-sm text-accent">
                {(stats?.deliveryRate || 0) >= 90 ? "Excelente" : "Pode melhorar"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Card>
          <div className="border-b border-border">
            <nav className="flex space-x-8 px-6">
              <Button
                variant="ghost"
                className={`py-4 text-sm font-medium border-b-2 ${
                  activeTab === "orders" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("orders")}
                data-testid="tab-admin-orders"
              >
                Pedidos
              </Button>
              <Button
                variant="ghost"
                className={`py-4 text-sm font-medium border-b-2 ${
                  activeTab === "products" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("products")}
                data-testid="tab-admin-products"
              >
                Produtos
              </Button>
              <Button
                variant="ghost"
                className={`py-4 text-sm font-medium border-b-2 ${
                  activeTab === "inventory" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("inventory")}
                data-testid="tab-admin-inventory"
              >
                Estoque
              </Button>
            </nav>
          </div>

          <CardContent className="p-6">
            {/* Orders Management */}
            {activeTab === "orders" && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-2 sm:mb-0">
                    Gerenciar Pedidos
                  </h3>
                  <Button variant="outline" size="sm" data-testid="button-export-orders">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>

                {ordersLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" data-testid="loading-admin-orders"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8" data-testid="text-no-admin-orders">
                    <p className="text-muted-foreground">Nenhum pedido encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4" data-testid="list-admin-orders">
                    {orders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={handleUpdateOrderStatus}
                        showCustomerInfo={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Products Management */}
            {activeTab === "products" && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-2 sm:mb-0">
                    Gerenciar Produtos
                  </h3>
                  <Button onClick={handleAddProduct} data-testid="button-add-product">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </div>

                {productsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" data-testid="loading-products"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-admin-products">
                    {products.map((product) => (
                      <Card key={product.id} className="border border-border" data-testid={`admin-product-card-${product.id}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold text-card-foreground" data-testid={`text-admin-product-name-${product.id}`}>
                              {product.name}
                            </h4>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-8 w-8"
                                onClick={() => handleEditProduct(product)}
                                data-testid={`button-edit-product-${product.id}`}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteProduct(product.id)}
                                data-testid={`button-delete-product-${product.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2" data-testid={`text-admin-product-description-${product.id}`}>
                            {product.description}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-primary" data-testid={`text-admin-product-price-${product.id}`}>
                              Kz {Number(product.price).toFixed(2)}
                            </span>
                            <Badge
                              variant={product.stock < 5 ? "destructive" : "secondary"}
                              data-testid={`badge-admin-product-stock-${product.id}`}
                            >
                              Estoque: {product.stock}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Inventory Management */}
            {activeTab === "inventory" && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-2 sm:mb-0">
                    Controle de Estoque
                  </h3>
                </div>

                {lowStockProducts.length > 0 && (
                  <Card className="mb-6 border-destructive">
                    <CardHeader>
                      <CardTitle className="text-destructive flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Itens com Estoque Baixo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2" data-testid="list-low-stock">
                        {lowStockProducts.map((product) => (
                          <div key={product.id} className="flex justify-between items-center" data-testid={`low-stock-item-${product.id}`}>
                            <span className="text-card-foreground">{product.name}</span>
                            <Badge variant="destructive">
                              {product.stock} unidades restantes
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                          Produto
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                          Estoque Atual
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {products.map((product) => (
                        <tr key={product.id} data-testid={`inventory-row-${product.id}`}>
                          <td className="p-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
                                <Package className="w-5 h-5 text-primary" />
                              </div>
                              <span className="font-medium text-card-foreground" data-testid={`text-inventory-product-name-${product.id}`}>
                                {product.name}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span 
                              className={`font-medium ${product.stock < 5 ? 'text-destructive' : 'text-card-foreground'}`}
                              data-testid={`text-inventory-stock-${product.id}`}
                            >
                              {product.stock} unidades
                            </span>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={product.stock < 5 ? "destructive" : "secondary"}
                              data-testid={`badge-inventory-status-${product.id}`}
                            >
                              {product.stock < 5 ? "Baixo" : "Normal"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant={product.stock < 5 ? "destructive" : "default"}
                              onClick={() => {
                                const newStock = window.prompt(
                                  `Atualizar estoque para ${product.name}.\nEstoque atual: ${product.stock}`,
                                  product.stock.toString()
                                );
                                if (newStock && !isNaN(Number(newStock))) {
                                  updateStockMutation.mutate({
                                    productId: product.id,
                                    stock: Number(newStock),
                                  });
                                }
                              }}
                              data-testid={`button-update-stock-${product.id}`}
                            >
                              {product.stock < 5 ? "Urgente" : "Reabastecer"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent data-testid="dialog-product">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Adicionar Produto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={productForm.handleSubmit(onSubmitProduct)} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                {...productForm.register("name")}
                data-testid="input-product-name"
              />
              {productForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {productForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...productForm.register("description")}
                data-testid="textarea-product-description"
              />
              {productForm.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {productForm.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Preço (Kz)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...productForm.register("price")}
                  data-testid="input-product-price"
                />
                {productForm.formState.errors.price && (
                  <p className="text-sm text-destructive">
                    {productForm.formState.errors.price.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="stock">Estoque</Label>
                <Input
                  id="stock"
                  type="number"
                  {...productForm.register("stock")}
                  data-testid="input-product-stock"
                />
                {productForm.formState.errors.stock && (
                  <p className="text-sm text-destructive">
                    {productForm.formState.errors.stock.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="imageUrl">URL da Imagem (opcional)</Label>
              <Input
                id="imageUrl"
                type="url"
                {...productForm.register("imageUrl")}
                data-testid="input-product-image"
              />
              {productForm.formState.errors.imageUrl && (
                <p className="text-sm text-destructive">
                  {productForm.formState.errors.imageUrl.message}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProductDialogOpen(false)}
                data-testid="button-cancel-product"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saveProductMutation.isPending}
                data-testid="button-save-product"
              >
                {saveProductMutation.isPending
                  ? "Salvando..."
                  : editingProduct
                  ? "Atualizar"
                  : "Criar"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
