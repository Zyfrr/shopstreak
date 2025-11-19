"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ShoppingBag, PackageSearch } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  badge?: string;
  category: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  href: string;
}

// React Query fetcher with proper typing
const fetchTrendingProducts = async (): Promise<Product[]> => {
  const response = await fetch('/api/products?limit=4&sort=trending');
  if (!response.ok) throw new Error('Failed to fetch products');
  const data = await response.json();
  return data.data;
};

export default function HomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  // Use React Query for data fetching with caching - FIXED VERSION
  const { data: trendingProducts, isLoading, error } = useQuery({
    queryKey: ['trending-products'],
    queryFn: fetchTrendingProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (cacheTime is now gcTime)
  });

  // Static category data - no need to fetch
  useEffect(() => {
    const categoryData: Category[] = [
      {
        id: "all",
        name: "All Products",
        icon: "🛍️",
        href: "/product",
      },
      {
        id: "Electronics",
        name: "Electronics",
        icon: "📱",
        href: "/product?category=Electronics",
      },
      {
        id: "Beauty",
        name: "Beauty & Personal Care",
        icon: "💄",
        href: "/product?category=Beauty%20%26%20Personal%20Care",
      },
      {
        id: "Accessories",
        name: "Accessories",
        icon: "👜",
        href: "/product?category=Accessories",
      },
      {
        id: "Home & Living",
        name: "Home & Living",
        icon: "🏠",
        href: "/product?category=Home%20%26%20Living",
      },
      {
        id: "Fitness",
        name: "Fitness & Sports",
        icon: "⚽",
        href: "/product?category=Fitness%20%26%20Sports",
      },
    ];
    setCategories(categoryData);
  }, []);

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-14 px-4 bg-gradient-to-b from-accent/10 via-background to-background">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Welcome to <span className="text-accent">ShopStreak!</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-3 mb-8 max-w-xl mx-auto">
            Discover amazing products with fast delivery and great prices.
          </p>
          <div className="flex flex-row justify-center items-center gap-4 mt-4">
            <Link
              href="/product"
              className="
                px-5 py-3 
                sm:px-6 sm:py-3 
                rounded-xl font-semibold 
                text-sm sm:text-base
                flex items-center gap-2
                bg-accent text-accent-foreground
                shadow-md hover:shadow-lg hover:scale-105 transition-all
              "
              prefetch={true}
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              Start Shopping
            </Link>
            <Link
              href="/product"
              className="
                px-5 py-3 
                sm:px-6 sm:py-3 
                rounded-xl font-semibold 
                text-sm sm:text-base
                flex items-center gap-2
                border border-border 
                text-foreground bg-card
                shadow-sm hover:bg-accent/10 hover:scale-105 transition-all
              "
              prefetch={true}
            >
              <PackageSearch className="w-4 h-4 sm:w-5 sm:h-5" />
              View Products
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Shop by Category
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={cat.href}
                className="flex flex-col items-center gap-4 p-6 bg-card border border-border rounded-xl hover:border-primary hover:shadow-lg transition-all duration-300 group"
                prefetch={true}
              >
                <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
                  {cat.icon}
                </span>
                <span className="text-sm font-semibold text-center leading-tight group-hover:text-primary transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Products Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Trending Now</h2>
            <Link
              href="/product"
              className="text-primary text-lg font-semibold hover:underline flex items-center gap-2"
              prefetch={true}
            >
              View All
              <span>→</span>
            </Link>
          </div>

          {isLoading ? (
            <ProductGridSkeleton />
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              Failed to load trending products
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">🚚</div>
              <div className="text-xl font-bold text-primary">Up to 5 Days</div>
              <div className="text-muted-foreground">Fast Delivery</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">✅</div>
              <div className="text-xl font-bold text-primary">100%</div>
              <div className="text-muted-foreground">Authentic Products</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">💳</div>
              <div className="text-xl font-bold text-primary">Secure</div>
              <div className="text-muted-foreground">Payment</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">🚫</div>
              <div className="text-xl font-bold text-primary">No Returns</div>
              <div className="text-muted-foreground">Final Sale Policy</div>
            </div>
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}

// Optimized Product Card Component
function ProductCard({ product }: { product: Product }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  return (
    <Link
      href={`/product/${product.id}`}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300"
      prefetch={true}
    >
      <div className="relative bg-muted overflow-hidden h-48">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
        )}
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          className={`w-full h-full object-cover transition duration-300 ${
            imageLoaded ? 'group-hover:scale-110' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        {product.badge && (
          <div className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
            {product.badge === "trending" && "🔥 Trending"}
            {product.badge === "bestseller" && "⭐ Bestseller"}
            {product.badge === "featured" && "✨ Featured"}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors text-sm">
          {product.name}
        </h3>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xl font-bold text-primary block">
              ₹{product.price}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span>⭐</span>
            <span className="text-muted-foreground">
              {product.rating}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Skeleton Loader
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl overflow-hidden animate-pulse"
        >
          <div className="bg-muted h-48 w-full"></div>
          <div className="p-4 space-y-3">
            <div className="bg-muted h-4 rounded w-3/4"></div>
            <div className="bg-muted h-6 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}