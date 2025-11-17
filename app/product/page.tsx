// app/product/page.tsx
"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ShoppingCart,
  Filter,
  X,
  ChevronDown,
  SlidersHorizontal,
  Heart,
  Star,
  Sparkles,
  Check,
} from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useCart } from "@/components/contexts/cart-context";
import { useAuth } from "@/components/contexts/auth-context";
import { useToast } from "@/components/providers/toast-provider";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  rating: number;
  reviews: number;
  stock: number;
  category: string;
  subCategory?: string;
  brand?: string;
  badge?: string;
  noReturn: boolean;
  discountPercentage?: number;
  soldCount?: number;
  deliveryEstimate?: { minDays: number; maxDays: number };
  highlights?: string[];
}

// Filter types
interface FilterState {
  categories: string[];
  priceRange: [number, number];
  minRating: number;
  brands: string[];
  inStock: boolean;
  discounts: string[];
}

// Sort options
const SORT_OPTIONS = [
  { id: "popular", name: "Most Popular", field: "soldCount", order: -1 },
  { id: "price-low", name: "Price: Low to High", field: "price", order: 1 },
  { id: "price-high", name: "Price: High to Low", field: "price", order: -1 },
  { id: "rating", name: "Highest Rated", field: "rating", order: -1 },
  { id: "newest", name: "Newest First", field: "createdAt", order: -1 },
  {
    id: "discount",
    name: "Best Discount",
    field: "discountPercentage",
    order: -1,
  },
];

// Discount ranges
const DISCOUNT_RANGES = [
  { id: "10", name: "10% & above", min: 10 },
  { id: "20", name: "20% & above", min: 20 },
  { id: "30", name: "30% & above", min: 30 },
  { id: "40", name: "40% & above", min: 40 },
  { id: "50", name: "50% & above", min: 50 },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"filters" | "sort">("filters");
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 50000],
    minRating: 0,
    brands: [],
    inStock: false,
    discounts: [],
  });

  const [sortBy, setSortBy] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Fetch wishlist items
  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistItems([]);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const wishlistIds =
            result.data.items?.map((item: any) => item.id) || [];
          setWishlistItems(wishlistIds);
        }
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  }, [isAuthenticated]);

  // Initialize from URL params
  useEffect(() => {
    const category = searchParams.get("category");
    const search = searchParams.get("q");
    const sort = searchParams.get("sort");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const rating = searchParams.get("rating");

    if (category) {
      setFilters((prev) => ({ ...prev, categories: [category] }));
    }
    if (search) setSearchQuery(search);
    if (sort) setSortBy(sort);
    if (minPrice && maxPrice) {
      setFilters((prev) => ({
        ...prev,
        priceRange: [Number(minPrice), Number(maxPrice)],
      }));
    }
    if (rating) {
      setFilters((prev) => ({ ...prev, minRating: Number(rating) }));
    }

    fetchProducts();
    fetchWishlist();
  }, [searchParams, fetchWishlist]);

  // Fetch products with optimized API call
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);

      // Add filters to API call
      if (filters.priceRange[0] > 0)
        params.append("minPrice", filters.priceRange[0].toString());
      if (filters.priceRange[1] < 50000)
        params.append("maxPrice", filters.priceRange[1].toString());
      if (filters.minRating > 0)
        params.append("rating", filters.minRating.toString());
      if (filters.inStock) params.append("inStock", "true");

      // Map frontend sort to API sort
      const sortOption = SORT_OPTIONS.find((opt) => opt.id === sortBy);
      if (sortOption) {
        let apiSort = "popular";
        switch (sortOption.id) {
          case "price-low":
            apiSort = "price_asc";
            break;
          case "price-high":
            apiSort = "price_desc";
            break;
          case "rating":
            apiSort = "rating";
            break;
          case "newest":
            apiSort = "newest";
            break;
          case "discount":
            apiSort = "discount";
            break;
          default:
            apiSort = "popular";
        }
        params.append("sort", apiSort);
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.data) {
        const productsData = data.data;
        setAllProducts(productsData);
        setProducts(productsData);

        // Extract available brands and categories
        const brands = [
          ...new Set(productsData.map((p) => p.brand).filter(Boolean)),
        ] as string[];
        const categories = [
          ...new Set(productsData.map((p) => p.category)),
        ] as string[];
        setAvailableBrands(brands);
        setAvailableCategories(categories);
      } else {
        setProducts(getFallbackProducts());
        setAllProducts(getFallbackProducts());
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      const fallbackProducts = getFallbackProducts();
      setProducts(fallbackProducts);
      setAllProducts(fallbackProducts);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, sortBy]);

  // Apply filters locally for better performance
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((product) =>
        filters.categories.includes(product.category)
      );
    }

    // Brand filter
    if (filters.brands.length > 0) {
      filtered = filtered.filter(
        (product) => product.brand && filters.brands.includes(product.brand)
      );
    }

    // Price range filter
    filtered = filtered.filter(
      (product) =>
        product.price >= filters.priceRange[0] &&
        product.price <= filters.priceRange[1]
    );

    // Rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(
        (product) => product.rating >= filters.minRating
      );
    }

    // Stock filter
    if (filters.inStock) {
      filtered = filtered.filter((product) => product.stock > 0);
    }

    // Discount filter
    if (filters.discounts.length > 0) {
      filtered = filtered.filter((product) => {
        const discount = product.discountPercentage || 0;
        return filters.discounts.some((discountId) => {
          const range = DISCOUNT_RANGES.find((d) => d.id === discountId);
          return range && discount >= range.min;
        });
      });
    }

    // Apply sorting
    const sortOption = SORT_OPTIONS.find((opt) => opt.id === sortBy);
    if (sortOption) {
      filtered.sort((a, b) => {
        let aValue = a[sortOption.field as keyof Product] as number;
        let bValue = b[sortOption.field as keyof Product] as number;

        // Fallback for fields that might not exist
        if (aValue === undefined) aValue = 0;
        if (bValue === undefined) bValue = 0;

        return (aValue - bValue) * sortOption.order;
      });
    }

    return filtered;
  }, [allProducts, filters, sortBy]);

  // Update products when filters change
  useEffect(() => {
    setProducts(filteredProducts);
  }, [filteredProducts]);

  // Wishlist toggle function
  const handleWishlistToggle = async (product: Product) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent("/product")}`);
      return;
    }

    setWishlistLoading(product.id);
    try {
      const token = localStorage.getItem("accessToken");

      if (wishlistItems.includes(product.id)) {
        // Remove from wishlist
        const response = await fetch(`/api/wishlist?productId=${product.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();
        if (result.success) {
          setWishlistItems((prev) => prev.filter((id) => id !== product.id));
          addToast({
            type: "success",
            title: "Removed from wishlist",
            message: `${product.name} has been removed from your wishlist`,
            duration: 3000,
          });
        }
      } else {
        // Add to wishlist
        const response = await fetch("/api/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: product.id }),
        });

        const result = await response.json();
        if (result.success) {
          setWishlistItems((prev) => [...prev, product.id]);
          addToast({
            type: "success",
            title: "Added to wishlist",
            message: `${product.name} has been added to your wishlist`,
            duration: 3000,
          });
        }
      }
    } catch (error: any) {
      console.error("Error updating wishlist:", error);
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to update wishlist",
        duration: 5000,
      });
    } finally {
      setWishlistLoading(null);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent("/product")}`);
      return;
    }

    try {
      await addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });

      addToast({
        type: "success",
        title: "Added to cart",
        message: `${product.name} has been added to your cart`,
        duration: 3000,
      });
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to add item to cart",
        duration: 5000,
      });
    }
  };

  const updateFilter = (filterType: keyof FilterState, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const toggleArrayFilter = (
    filterType: "categories" | "brands" | "discounts",
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter((item) => item !== value)
        : [...prev[filterType], value],
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, 50000],
      minRating: 0,
      brands: [],
      inStock: false,
      discounts: [],
    });
    setSearchQuery("");
    setSortBy("popular");
  };

  const activeFilterCount =
    filters.categories.length +
    filters.brands.length +
    filters.discounts.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000 ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (searchQuery.length > 0 ? 1 : 0);

  // Fallback products
  const getFallbackProducts = (): Product[] => [
    {
      id: "1",
      name: "Wireless Bluetooth Headphones with Noise Cancellation",
      price: 2999,
      originalPrice: 3999,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
      ],
      rating: 4.5,
      reviews: 128,
      stock: 25,
      category: "Electronics",
      badge: "trending",
      noReturn: false,
      discountPercentage: 25,
      brand: "Sony",
      soldCount: 150,
    },
    {
      id: "2",
      name: "Smart Fitness Watch with Heart Rate Monitor",
      price: 5999,
      originalPrice: 7999,
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
      ],
      rating: 4.3,
      reviews: 89,
      stock: 15,
      category: "Electronics",
      badge: "bestseller",
      noReturn: true,
      discountPercentage: 25,
      brand: "FitPro",
      soldCount: 200,
    },
    {
      id: "3",
      name: "Organic Cotton T-Shirt - Pack of 3",
      price: 1299,
      originalPrice: 1999,
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
      ],
      rating: 4.2,
      reviews: 56,
      stock: 50,
      category: "Fashion",
      badge: "popular",
      noReturn: false,
      discountPercentage: 35,
      brand: "EcoWear",
      soldCount: 300,
    },
    {
      id: "4",
      name: "Stainless Steel Water Bottle - 1L",
      price: 799,
      originalPrice: 999,
      image:
        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop",
      ],
      rating: 4.7,
      reviews: 203,
      stock: 0,
      category: "Home & Living",
      badge: "featured",
      noReturn: true,
      discountPercentage: 20,
      brand: "HydroFlask",
      soldCount: 450,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Page Title */}
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">Products</h1>
              {!loading && (
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  ({products.length} items found)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile Filter/Sort Button */}
              <div className="lg:hidden flex items-center gap-2">
                <button
                  onClick={() => setFilterOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filter & Sort</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-background text-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Desktop Controls */}
              <div className="hidden lg:flex items-center gap-3">
                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none px-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-8 cursor-pointer min-w-40"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>

                {/* Filter Button */}
                <button
                  onClick={() => setFilterOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {activeFilterCount > 9 ? "9+" : activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Bar */}
          {activeFilterCount > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">
                Active filters:
              </span>

              {filters.categories.map((category) => (
                <FilterChip
                  key={category}
                  label={category}
                  onRemove={() =>
                    updateFilter(
                      "categories",
                      filters.categories.filter((c) => c !== category)
                    )
                  }
                />
              ))}

              {filters.brands.map((brand) => (
                <FilterChip
                  key={brand}
                  label={brand}
                  onRemove={() =>
                    updateFilter(
                      "brands",
                      filters.brands.filter((b) => b !== brand)
                    )
                  }
                />
              ))}

              {(filters.priceRange[0] > 0 || filters.priceRange[1] < 50000) && (
                <FilterChip
                  label={`₹${filters.priceRange[0]} - ₹${filters.priceRange[1]}`}
                  onRemove={() => updateFilter("priceRange", [0, 50000])}
                />
              )}

              {filters.minRating > 0 && (
                <FilterChip
                  label={`${filters.minRating}+ Stars`}
                  onRemove={() => updateFilter("minRating", 0)}
                />
              )}

              {filters.inStock && (
                <FilterChip
                  label="In Stock"
                  onRemove={() => updateFilter("inStock", false)}
                />
              )}

              {filters.discounts.map((discountId) => {
                const discount = DISCOUNT_RANGES.find(
                  (d) => d.id === discountId
                );
                return discount ? (
                  <FilterChip
                    key={discountId}
                    label={discount.name}
                    onRemove={() =>
                      updateFilter(
                        "discounts",
                        filters.discounts.filter((d) => d !== discountId)
                      )
                    }
                  />
                ) : null;
              })}

              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Filter & Sort Overlay */}
      {filterOpen && (
        <MobileFilterOverlay
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          filters={filters}
          onFilterChange={updateFilter}
          onToggleArrayFilter={toggleArrayFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          availableBrands={availableBrands}
          availableCategories={availableCategories}
          onApply={() => setFilterOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <DesktopFilterSidebar
            filters={filters}
            onFilterChange={updateFilter}
            onToggleArrayFilter={toggleArrayFilter}
            availableBrands={availableBrands}
            availableCategories={availableCategories}
            onClearFilters={clearFilters}
            activeFilterCount={activeFilterCount}
          />

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Info */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Loading products..."
                  : `Showing ${products.length} of ${allProducts.length} products`}
              </p>
              {!loading && products.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Sorted by:</span>
                  <span className="font-medium text-foreground">
                    {SORT_OPTIONS.find((opt) => opt.id === sortBy)?.name}
                  </span>
                </div>
              )}
            </div>

            {/* Product Grid */}
            {loading ? (
              <ProductGridSkeleton />
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onWishlistToggle={handleWishlistToggle}
                    isInWishlist={wishlistItems.includes(product.id)}
                    wishlistLoading={wishlistLoading === product.id}
                  />
                ))}
              </div>
            ) : (
              <NoProductsState onClearFilters={clearFilters} />
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

// Filter Chip Component
function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-primary/70 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// Mobile Filter Overlay Component
function MobileFilterOverlay({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  filters,
  onFilterChange,
  onToggleArrayFilter,
  sortBy,
  onSortChange,
  availableBrands,
  availableCategories,
  onApply,
}: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold">Filter & Sort</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex">
            <button
              onClick={() => onTabChange("filters")}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                activeTab === "filters"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground border-b border-border"
              }`}
            >
              Filters
            </button>
            <button
              onClick={() => onTabChange("sort")}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                activeTab === "sort"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground border-b border-border"
              }`}
            >
              Sort
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "filters" ? (
            <div className="p-4 space-y-6">
              {/* Categories */}
              <FilterSection title="Categories">
                <div className="space-y-2">
                  {availableCategories.map((category: string) => (
                    <label
                      key={category}
                      className="flex items-center gap-3 cursor-pointer text-sm p-2 rounded-lg transition-colors hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={() =>
                          onToggleArrayFilter("categories", category)
                        }
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Brands */}
              {availableBrands.length > 0 && (
                <FilterSection title="Brands">
                  <div className="space-y-2">
                    {availableBrands.map((brand: string) => (
                      <label
                        key={brand}
                        className="flex items-center gap-3 cursor-pointer text-sm p-2 rounded-lg transition-colors hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          checked={filters.brands.includes(brand)}
                          onChange={() => onToggleArrayFilter("brands", brand)}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span>{brand}</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Price Range */}
              <FilterSection title="Price Range">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Min: ₹{filters.priceRange[0]}
                    </span>
                    <span className="text-muted-foreground">
                      Max: ₹{filters.priceRange[1]}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="0"
                      max="50000"
                      step="100"
                      value={filters.priceRange[0]}
                      onChange={(e) =>
                        onFilterChange("priceRange", [
                          Number(e.target.value),
                          filters.priceRange[1],
                        ])
                      }
                      className="w-full accent-primary"
                    />
                    <input
                      type="range"
                      min="0"
                      max="50000"
                      step="100"
                      value={filters.priceRange[1]}
                      onChange={(e) =>
                        onFilterChange("priceRange", [
                          filters.priceRange[0],
                          Number(e.target.value),
                        ])
                      }
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
              </FilterSection>

              {/* Rating */}
              <FilterSection title="Minimum Rating">
                <div className="space-y-2">
                  {[4, 3, 2, 1, 0].map((rating) => (
                    <label
                      key={rating}
                      className="flex items-center gap-3 cursor-pointer text-sm p-2 rounded-lg transition-colors hover:bg-muted"
                    >
                      <input
                        type="radio"
                        name="rating"
                        checked={filters.minRating === rating}
                        onChange={() => onFilterChange("minRating", rating)}
                        className="accent-primary"
                      />
                      <span className="flex items-center gap-2">
                        {rating === 0 ? (
                          "Any Rating"
                        ) : (
                          <>
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{rating}+ Stars</span>
                          </>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Discount */}
              <FilterSection title="Discount">
                <div className="space-y-2">
                  {DISCOUNT_RANGES.map((range) => (
                    <label
                      key={range.id}
                      className="flex items-center gap-3 cursor-pointer text-sm p-2 rounded-lg transition-colors hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={filters.discounts.includes(range.id)}
                        onChange={() =>
                          onToggleArrayFilter("discounts", range.id)
                        }
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{range.name}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* In Stock */}
              <FilterSection title="Availability">
                <label className="flex items-center gap-3 cursor-pointer text-sm p-2 rounded-lg transition-colors hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) =>
                      onFilterChange("inStock", e.target.checked)
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span>In Stock Only</span>
                </label>
              </FilterSection>
            </div>
          ) : (
            // Sort Tab Content
            <div className="p-4 space-y-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onSortChange(option.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-all text-sm ${
                    sortBy === option.id
                      ? "bg-primary text-primary-foreground font-medium shadow-sm"
                      : "hover:bg-muted"
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Apply Button */}
        <div className="p-4 border-t border-border">
          <button
            onClick={onApply}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

// Desktop Filter Sidebar Component
function DesktopFilterSidebar({
  filters,
  onFilterChange,
  onToggleArrayFilter,
  availableBrands,
  availableCategories,
  onClearFilters,
  activeFilterCount,
}: any) {
  return (
    <aside className="hidden lg:block w-80 flex-shrink-0">
      <div className="bg-card border border-border rounded-xl p-6 space-y-6 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Filters</h3>
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="text-primary text-sm font-medium hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Categories */}
        <FilterSection title="Categories">
          <div className="space-y-2">
            {availableCategories.map((category: string) => (
              <label
                key={category}
                className="flex items-center gap-3 cursor-pointer text-sm p-2 rounded-lg transition-colors hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={() => onToggleArrayFilter("categories", category)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>{category}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Brands */}
        {availableBrands.length > 0 && (
          <FilterSection title="Brands">
            <div className="space-y-2">
              {availableBrands.map((brand: string) => (
                <label
                  key={brand}
                  className="flex items-center gap-3 cursor-pointer text-sm p-2 rounded-lg transition-colors hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(brand)}
                    onChange={() => onToggleArrayFilter("brands", brand)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Price Range */}
        <FilterSection title="Price Range">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>₹{filters.priceRange[0]}</span>
              <span>₹{filters.priceRange[1]}</span>
            </div>
            <div className="space-y-3">
              <input
                type="range"
                min="0"
                max="50000"
                step="100"
                value={filters.priceRange[0]}
                onChange={(e) =>
                  onFilterChange("priceRange", [
                    Number(e.target.value),
                    filters.priceRange[1],
                  ])
                }
                className="w-full accent-primary"
              />
              <input
                type="range"
                min="0"
                max="50000"
                step="100"
                value={filters.priceRange[1]}
                onChange={(e) =>
                  onFilterChange("priceRange", [
                    filters.priceRange[0],
                    Number(e.target.value),
                  ])
                }
                className="w-full accent-primary"
              />
            </div>
          </div>
        </FilterSection>

        {/* Rating */}
        <FilterSection title="Customer Rating">
          <div className="space-y-2">
            {[4, 3, 2, 1, 0].map((rating) => (
              <label
                key={rating}
                className="flex items-center gap-3 cursor-pointer text-sm hover:bg-muted p-2 rounded transition"
              >
                <input
                  type="radio"
                  name="rating"
                  checked={filters.minRating === rating}
                  onChange={() => onFilterChange("minRating", rating)}
                  className="accent-primary"
                />
                <span className="flex items-center gap-1">
                  {rating === 0 ? (
                    "Any Rating"
                  ) : (
                    <>
                      {Array.from({ length: rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-yellow-500 fill-current"
                        />
                      ))}
                      <span className="text-muted-foreground ml-1">
                        & above
                      </span>
                    </>
                  )}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Discount */}
        <FilterSection title="Discount">
          <div className="space-y-2">
            {DISCOUNT_RANGES.map((range) => (
              <label
                key={range.id}
                className="flex items-center gap-3 cursor-pointer text-sm p-2 rounded-lg transition-colors hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={filters.discounts.includes(range.id)}
                  onChange={() => onToggleArrayFilter("discounts", range.id)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>{range.name}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* In Stock */}
        <FilterSection title="Availability">
          <label className="flex items-center gap-3 cursor-pointer text-sm p-2 rounded-lg transition-colors hover:bg-muted">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) => onFilterChange("inStock", e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span>In Stock Only</span>
          </label>
        </FilterSection>
      </div>
    </aside>
  );
}

// Filter Section Component
function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="font-semibold mb-3 text-sm text-foreground">{title}</h4>
      {children}
    </div>
  );
}

// Product Card Component with Wishlist
function ProductCard({
  product,
  onAddToCart,
  onWishlistToggle,
  isInWishlist,
  wishlistLoading,
}: {
  product: Product;
  onAddToCart: (product: Product) => void;
  onWishlistToggle: (product: Product) => void;
  isInWishlist: boolean;
  wishlistLoading: boolean;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const discount = product.discountPercentage
    ? Math.round(product.discountPercentage)
    : product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  return (
    <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:border-primary transition-all duration-300 relative">
      {/* Wishlist Button */}
      <button
        onClick={() => onWishlistToggle(product)}
        disabled={wishlistLoading}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
          isInWishlist
            ? "bg-red-500 text-white shadow-lg scale-110"
            : "bg-white/90 text-gray-600 hover:bg-white hover:scale-110 hover:text-red-500"
        } ${wishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {wishlistLoading ? (
          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Heart className={`w-4 h-4 ${isInWishlist ? "fill-current" : ""}`} />
        )}
      </button>

      {/* Product Image */}
      <Link href={`/product/${product.id}`}>
        <div className="relative overflow-hidden bg-muted h-48">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
          )}
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className={`w-full h-full object-cover transition duration-300 ${
              imageLoaded ? "group-hover:scale-105" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.badge && (
              <div className="bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded">
                {product.badge}
              </div>
            )}
            {discount > 0 && (
              <div className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                {discount}% OFF
              </div>
            )}
            {product.stock === 0 && (
              <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                Out of Stock
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-tight">
            {product.name}
          </h3>
        </Link>

        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-muted-foreground mb-2">{product.brand}</p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= Math.floor(product.rating)
                      ? "text-yellow-500 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-foreground">
              {product.rating.toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-bold text-primary">
            ₹{product.price}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-muted-foreground line-through">
              ₹{product.originalPrice}
            </span>
          )}
        </div>

        {/* Delivery Info */}
        {product.deliveryEstimate && (
          <p className="text-xs text-muted-foreground mb-3">
            Delivery: {product.deliveryEstimate.minDays}-
            {product.deliveryEstimate.maxDays} days
          </p>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn"
        >
          <ShoppingCart className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
          {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

// Skeleton Loader
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl overflow-hidden animate-pulse"
        >
          <div className="bg-muted h-48 w-full"></div>
          <div className="p-4 space-y-3">
            <div className="bg-muted h-4 rounded w-3/4"></div>
            <div className="bg-muted h-4 rounded w-1/2"></div>
            <div className="bg-muted h-6 rounded w-1/3"></div>
            <div className="bg-muted h-10 rounded w-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// No Products State
function NoProductsState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-12 h-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-bold mb-2">No products found</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        We couldn't find any products matching your criteria. Try adjusting your
        filters or search terms.
      </p>
      <button
        onClick={onClearFilters}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition inline-flex items-center gap-2"
      >
        <X className="w-4 h-4" />
        Clear All Filters
      </button>
    </div>
  );
}
