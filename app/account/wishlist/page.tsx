"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ChevronRight,
  Star,
  Home,
  Loader2,
  Check,
  MousePointerClick,
} from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useCart } from "@/components/contexts/cart-context";
import { useAuth } from "@/components/contexts/auth-context";
import { useToast } from "@/components/providers/toast-provider";

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  badge?: string;
  addedDate: string;
}

export default function WishlistPage() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("recent");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isBulkOperating, setIsBulkOperating] = useState(false);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
   const { addToast } = useToast(); // Use toast

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchWishlist();
  }, [isAuthenticated, router]);

  const fetchWishlist = async () => {
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
          setWishlist(result.data.items || []);
        }
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (id: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/wishlist?productId=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setWishlist((prev) => prev.filter((item) => item.id !== id));
        setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
        
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to remove from wishlist",
        duration: 5000,
      });
    }
  };

    const bulkRemoveFromWishlist = async () => {
    if (selectedItems.length === 0) return;

    setIsBulkOperating(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/wishlist", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productIds: selectedItems,
          action: "remove",
        }),
      });

      const result = await response.json();
      if (result.success) {
        setWishlist((prev) =>
          prev.filter((item) => !selectedItems.includes(item.id))
        );
        setSelectedItems([]);
        
        addToast({
          type: "success",
          title: "Items removed",
          message: `${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''} removed from wishlist`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error bulk removing from wishlist:", error);
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to remove items from wishlist",
        duration: 5000,
      });
    } finally {
      setIsBulkOperating(false);
    }
  };

  const moveToCart = async (item: WishlistItem) => {
    try {
      await addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
      });
      
      // Show success toast for cart addition
      addToast({
        type: "success",
        title: "Added to cart",
        message: `${item.name} has been added to your cart`,
        duration: 3000,
      });
      
      // Remove from wishlist after adding to cart
      await removeFromWishlist(item.id);
      
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to add item to cart",
        duration: 5000,
      });
    }
  };


  const moveSelectedToCart = async () => {
    if (selectedItems.length === 0) return;

    setIsBulkOperating(true);
    const inStockSelectedItems = wishlist.filter(
      (item) => selectedItems.includes(item.id) && item.inStock
    );

    let successCount = 0;
    let errorCount = 0;

    for (const item of inStockSelectedItems) {
      try {
        await addItem({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
        });
        await removeFromWishlist(item.id);
        successCount++;
      } catch (error) {
        console.error(`Failed to move item ${item.id} to cart:`, error);
        errorCount++;
      }
    }

    // Show appropriate toast message
    if (errorCount > 0) {
      addToast({
        type: errorCount === inStockSelectedItems.length ? "error" : "warning",
        title: errorCount === inStockSelectedItems.length ? "Error" : "Partial Success",
        message: `Successfully moved ${successCount} items to cart. ${errorCount} items failed.`,
        duration: 5000,
      });
    } else {
      addToast({
        type: "success",
        title: "Items moved to cart",
        message: `Successfully moved ${successCount} items to cart`,
        duration: 3000,
      });
    }
    setIsBulkOperating(false);
  };

  const moveAllToCart = async () => {
    const inStockItems = wishlist.filter((item) => item.inStock);
    
    if (inStockItems.length === 0) {
      addToast({
        type: "warning",
        title: "No items available",
        message: "No in-stock items to move to cart",
        duration: 3000,
      });
      return;
    }

    let successCount = 0;
    
    for (const item of inStockItems) {
      try {
        await addItem({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
        });
        await removeFromWishlist(item.id);
        successCount++;
      } catch (error) {
        console.error(`Failed to move item ${item.id} to cart:`, error);
      }
    }

    addToast({
      type: "success",
      title: "Items moved to cart",
      message: `Successfully moved ${successCount} items to cart`,
      duration: 3000,
    });
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === wishlist.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(wishlist.map((item) => item.id));
    }
  };

  const sortedWishlist = [...wishlist].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      case "recent":
      default:
        return (
          new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
        );
    }
  });

  const categories = [...new Set(wishlist.map((item) => item.category))];
  const totalValue = wishlist.reduce((sum, item) => sum + item.price, 0);
  const selectedValue = wishlist
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
          <p className="text-muted-foreground">
            {wishlist.length} item{wishlist.length !== 1 ? "s" : ""} • Total
            value: ₹{totalValue}
            {selectedItems.length > 0 && (
              <span className="text-primary font-semibold ml-2">
                • {selectedItems.length} selected (₹{selectedValue})
              </span>
            )}
          </p>
        </div>

        {/* Bulk Actions Bar */}
        {selectedItems.length > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-primary">
                  {selectedItems.length} item
                  {selectedItems.length !== 1 ? "s" : ""} selected
                </span>
                <span className="text-sm text-muted-foreground">
                  Total: ₹{selectedValue}
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={moveSelectedToCart}
                  disabled={isBulkOperating}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md 
               font-medium hover:opacity-90 transition text-xs 
               disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isBulkOperating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-3.5 h-3.5" />
                  )}
                  Add Selected
                </button>

                <button
                  onClick={bulkRemoveFromWishlist}
                  disabled={isBulkOperating}
                  className="px-3 py-1.5 bg-destructive text-destructive-foreground 
               rounded-md font-medium hover:opacity-90 transition text-xs 
               disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isBulkOperating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats and Filters */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-8 text-sm">
              <div>
                <p className="text-muted-foreground">Items</p>
                <p className="font-semibold text-2xl">{wishlist.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Categories</p>
                <p className="font-semibold text-2xl">{categories.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Value</p>
                <p className="font-semibold text-2xl text-primary">
                  ₹{totalValue}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="recent">Sort by: Recent</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>

              {wishlist.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={toggleSelectAll}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition text-sm flex items-center gap-2"
                  >
                    <MousePointerClick className="w-4 h-4" />
                    {selectedItems.length === wishlist.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  <button
                    onClick={moveAllToCart}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition text-sm"
                  >
                    Add All to Cart
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wishlist Items */}
        {wishlist.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-24 h-24 text-muted-foreground mx-auto mb-6 opacity-50" />
            <h2 className="text-2xl font-bold mb-4">Your Wishlist is Empty</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Save your favorite items here to purchase them later. Start
              exploring our collection!
            </p>
            <Link
              href="/product"
              className="inline-flex items-center px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedWishlist.map((item) => (
              <div
                key={item.id}
                className={`group bg-card border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 relative ${
                  selectedItems.includes(item.id)
                    ? "border-primary ring-2 ring-primary"
                    : "border-border"
                }`}
                onClick={(e) => {
                  // Only toggle selection if not clicking on action buttons
                  if (!(e.target as HTMLElement).closest("button, a")) {
                    toggleItemSelection(item.id);
                  }
                }}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-3 left-3 z-10">
                  <div
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                      selectedItems.includes(item.id)
                        ? "bg-primary border-primary"
                        : "bg-background border-border hover:border-primary"
                    }`}
                  >
                    {selectedItems.includes(item.id) && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>

                {/* Product Image */}
                <div className="relative h-48 bg-muted overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  {/* Badges */}
                  {!item.inStock && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      Out of Stock
                    </div>
                  )}
                  {item.badge && (
                    <div className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded">
                      {item.badge}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveToCart(item);
                      }}
                      disabled={!item.inStock}
                      className="bg-primary text-primary-foreground p-2 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWishlist(item.id);
                      }}
                      className="bg-destructive text-destructive-foreground p-2 rounded-full hover:opacity-90 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="mb-2">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-semibold">
                        {item.rating}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({item.reviews} reviews)
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg font-bold text-primary">
                      ₹{item.price}
                    </span>
                    {item.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{item.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/product/${item.id}`}
                      className="flex-1 text-center px-3 py-2 border border-border rounded-lg font-medium hover:bg-muted transition text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Categories Section */}
        {categories.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6">Wishlist by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((category) => {
                const categoryItems = wishlist.filter(
                  (item) => item.category === category
                );
                const categoryValue = categoryItems.reduce(
                  (sum, item) => sum + item.price,
                  0
                );

                return (
                  <Link
                    key={category}
                    href={`/product?category=${encodeURIComponent(category)}`}
                    className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg hover:border-primary transition-all duration-300"
                  >
                    <div className="text-3xl font-bold text-primary mb-2">
                      {categoryItems.length}
                    </div>
                    <div className="font-semibold mb-2">{category}</div>
                    <div className="text-sm text-muted-foreground">
                      ₹{categoryValue}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
