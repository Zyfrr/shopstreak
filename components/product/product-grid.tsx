"use client";

import Link from "next/link";
import { useCart } from "@/components/contexts/cart-context";
import { ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/product-data";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
}

export function ProductGrid({ products, isLoading }: ProductGridProps) {
  const { addItem } = useCart();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-lg h-64 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 col-span-full">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {products.map((product) => (
        <div
          key={product.id}
          className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition"
        >
          <Link href={`/product/${product.slug}`} className="block">
            <div className="relative bg-muted overflow-hidden h-40">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              {product.badge && (
                <div className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded">
                  {product.badge === "trending" && "Trending"}
                  {product.badge === "bestseller" && "Best"}
                  {product.badge === "new" && "New"}
                </div>
              )}
              {product.noReturn && (
                <div className="absolute bottom-2 left-2 bg-destructive/90 text-destructive-foreground text-xs font-semibold px-2 py-1 rounded">
                  No Return
                </div>
              )}
            </div>
          </Link>
          <div className="p-3">
            <h3 className="text-sm font-semibold line-clamp-2 mb-2">
              <Link
                href={`/product/${product.slug}`}
                className="hover:text-primary"
              >
                {product.name}
              </Link>
            </h3>
            <div className="flex items-end justify-between mb-2">
              <div>
                {product.discountedPrice ? (
                  <>
                    <span className="text-lg font-bold text-primary">
                      ₹{product.discountedPrice}
                    </span>
                    <span className="text-xs text-muted-foreground line-through ml-2">
                      ₹{product.price}
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-primary">
                    ₹{product.price}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span>★</span>
                <span className="text-muted-foreground">{product.rating}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/product/${product.slug}`}
                className="flex-1 py-2 px-2 bg-primary text-primary-foreground text-xs font-semibold rounded hover:opacity-90 transition text-center"
              >
                View
              </Link>
              <button
                onClick={() =>
                  addItem({
                    id: product.id,
                    name: product.name,
                    price: product.discountedPrice || product.price,
                    quantity: 1,
                    image: product.image,
                  })
                }
                className="py-2 px-2 bg-accent text-accent-foreground rounded hover:opacity-90 transition"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
