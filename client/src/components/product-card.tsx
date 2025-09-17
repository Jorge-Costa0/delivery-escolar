import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, Minus, ShoppingCart } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}

// Default images for different bread types
const getProductImage = (productName: string): string => {
  const name = productName.toLowerCase();
  if (name.includes('frango')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300';
  } else if (name.includes('queijo')) {
    return 'https://pixabay.com/get/g4ecb41f8d75240ae0cb7d7e49d5ea81a93adf399345cc8c7ffff22bb6fe2bbeea78461e13b4f8656a616228b3d586279adc92191f77466231b131b537fd171ab_1280.jpg';
  } else if (name.includes('chocolate')) {
    return 'https://pixabay.com/get/g61a74a58ff49c8814d6d347e51f536b290b1acc06af6d8db11e0f811ee46214f72747c28ca4137bf0f0e67f7190503ee17b4ab6b66a13b5f4eb6fe570c431232_1280.jpg';
  } else if (name.includes('presunto')) {
    return 'https://images.unsplash.com/photo-1586816001966-79b736744398?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300';
  }
  // Default bread image
  return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300';
};

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setQuantity(1); // Reset quantity after adding to cart
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const isLowStock = product.stock < 5;
  const isOutOfStock = product.stock === 0;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow" data-testid={`product-card-${product.id}`}>
      <img
        src={product.imageUrl || getProductImage(product.name)}
        alt={product.name}
        className="w-full h-48 object-cover"
        data-testid={`img-product-${product.id}`}
      />

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-card-foreground" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
          <span className="text-lg font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
             {Number(product.price).toFixed(2)} Kz
          </span>
        </div>

        {product.description && (
          <p className="text-sm text-muted-foreground mb-3" data-testid={`text-product-description-${product.id}`}>
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-muted-foreground" data-testid={`text-product-rating-${product.id}`}>
              {Number(product.rating).toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground" data-testid={`text-product-reviews-${product.id}`}>
              {product.reviewCount} avaliações
            </span>
          </div>
          <Badge
            variant={isOutOfStock ? "destructive" : isLowStock ? "outline" : "secondary"}
            className={isOutOfStock ? "bg-destructive text-destructive-foreground" : 
                       isLowStock ? "border-destructive text-destructive" : 
                       "bg-accent text-accent-foreground"}
            data-testid={`badge-stock-${product.id}`}
          >
            {isOutOfStock ? "Esgotado" : `${product.stock} disponível`}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center border border-input rounded-md">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8"
              onClick={decrementQuantity}
              disabled={quantity <= 1}
              data-testid={`button-decrease-quantity-${product.id}`}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="px-4 py-2 text-sm font-medium" data-testid={`text-quantity-${product.id}`}>
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8"
              onClick={incrementQuantity}
              disabled={quantity >= product.stock}
              data-testid={`button-increase-quantity-${product.id}`}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          <Button
            className="flex-1"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isOutOfStock ? "Esgotado" : "Adicionar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
