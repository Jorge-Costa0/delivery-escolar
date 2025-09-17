import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

import Header from "@/components/header";
import ProductCard from "@/components/product-card";
import CartModal, { CartItem } from "@/components/cart-modal";
import { useLocation } from "wouter";
import { authService } from "@/lib/auth";
import type { Product } from "@shared/schema";

export default function Catalog() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFlavor, setSelectedFlavor] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products", searchTerm, selectedFlavor, selectedPriceRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedFlavor && selectedFlavor !== "all") params.append("flavor", selectedFlavor);
      if (selectedPriceRange && selectedPriceRange !== "all") params.append("priceRange", selectedPriceRange);

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json() as Promise<Product[]>;
    },
  });

  const handleAddToCart = (product: Product, quantity: number) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { product, quantity }];
      }
    });

    toast({
      title: "Item adicionado ao carrinho!",
      description: `${quantity}x ${product.name}`,
    });
  };

  const handleUpdateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
    toast({
      title: "Item removido do carrinho",
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = () => {
    setLocation("/");
  };

  if (!authService.isAuthenticated()) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        onLogout={handleLogout}
      />

      {/* Navigation Tabs */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <Tabs value="catalog" className="w-full">
            <TabsList className="h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="catalog" 
                className="px-6 py-3 border-b-2 border-primary text-primary bg-transparent data-[state=active]:bg-transparent rounded-none"
                data-testid="tab-catalog"
              >
                <Search className="w-4 h-4 mr-2" />
                Catálogo
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="px-6 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground bg-transparent data-[state=active]:bg-transparent rounded-none"
                onClick={() => setLocation("/orders")}
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
        {/* Search and Filter Bar */}
        <div className="mb-6 bg-card p-4 rounded-lg border border-border">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar Produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            <Select value={selectedFlavor} onValueChange={setSelectedFlavor}>
              <SelectTrigger className="sm:w-48" data-testid="select-flavor">
                <SelectValue placeholder="Todos os sabores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os sabores</SelectItem>
                <SelectItem value="Clássico do intervalo">Clássico do intervalo</SelectItem>
                <SelectItem value="Hot-estudantil">Hot estudantil</SelectItem>
                <SelectItem value="A-dupla-picante">A dupla picante</SelectItem>
                <SelectItem value="A-mortadela-reforçada">A mortadela reforçada</SelectItem>
                <SelectItem value="Doce">Doce</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
              <SelectTrigger className="sm:w-48" data-testid="select-price">
                <SelectValue placeholder="Preço: Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Preço: Todos</SelectItem>
                <SelectItem value="200">Até  200 Kz </SelectItem>
                <SelectItem value="200-500">200 Kz - 700 Kz</SelectItem>
                <SelectItem value="500">Acima de 1000 Kz</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" data-testid="loading-products"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12" data-testid="text-no-products">
            <p className="text-muted-foreground text-lg">Nenhum produto encontrado</p>
            <p className="text-muted-foreground">Tente ajustar os filtros ou termo de busca</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="grid-products">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </main>

      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />
    </div>
  );
}
