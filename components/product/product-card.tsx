"use client";

import type React from "react";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/contexts/cart-context";
import { useState } from "react";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  badge: string | null;
  inStock: boolean;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <Link href={`/product/${product.id}`}>
      <div className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative bg-muted overflow-hidden h-40 flex-shrink-0">
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition"
          />
          {product.badge && (
            <div className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded">
              {product.badge === "trending" && "🔥"}
              {product.badge === "bestseller" && "⭐"}
              {product.badge === "new" && "✨"}
            </div>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded font-semibold text-sm">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="text-sm font-semibold line-clamp-2 mb-2 flex-1">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {product.category}
          </p>

          <div className="flex items-end justify-between mt-auto">
            <div>
              <span className="text-lg font-bold text-primary block">
                ₹{product.price}
              </span>
              <div className="flex items-center gap-1 text-xs">
                <span>⭐</span>
                <span className="text-muted-foreground">{product.rating}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={`mt-3 w-full py-2 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2 ${
              product.inStock
                ? addedToCart
                  ? "bg-green-600 text-white"
                  : "bg-accent text-accent-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {addedToCart ? "Added!" : "Add to Cart"}
          </button>
        </div>
      </div>
    </Link>
  );
}
