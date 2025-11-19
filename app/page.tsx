"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export default function HomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  // Category mapping system - Updated to match your product categories
  const categoryMapping = {
    Electronics: "Electronics",
    "Home & Living": "Home & Living",
    Fitness: "Fitness & Sports",
    Accessories: "Accessories",
    Beauty: "Beauty & Personal Care",
  };

  // Helper function to create category URLs
  const createCategoryUrl = (categoryKey: string) => {
    const categoryValue =
      categoryMapping[categoryKey as keyof typeof categoryMapping];
    return `/product?category=${encodeURIComponent(categoryValue)}`;
  };

  // Handle category click with optimized navigation
  const handleCategoryClick = (href: string) => {
    // Use router.push for client-side navigation without reload
    router.push(href);
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch trending products
      const productsResponse = await fetch(
        "/api/products?limit=4&sort=trending"
      );
      const productsData = await productsResponse.json();

      if (productsData.success) {
        setTrendingProducts(productsData.data);
      }

      // Home Page Category List (matching actual product categories)
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
          href: createCategoryUrl("Electronics"),
        },
        {
          id: "Beauty",
          name: "Beauty & Personal Care",
          icon: "💄",
          href: createCategoryUrl("Beauty"),
        },
        {
          id: "Accessories",
          name: "Accessories",
          icon: "👜",
          href: createCategoryUrl("Accessories"),
        },
        {
          id: "Home & Living",
          name: "Home & Living",
          icon: "🏠",
          href: createCategoryUrl("Home & Living"),
        },
        {
          id: "Fitness",
          name: "Fitness & Sports",
          icon: "⚽",
          href: createCategoryUrl("Fitness"),
        },
      ];

      setCategories(categoryData);
    } catch (error) {
      console.error("Error fetching home page data:", error);
    } finally {
      setLoading(false);
    }
  };

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
            >
              View All
              <span>→</span>
            </Link>
          </div>

          {loading ? (
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative bg-muted overflow-hidden h-48">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
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
