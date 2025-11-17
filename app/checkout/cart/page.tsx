"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Check,
  MousePointerClick,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useCart } from "@/components/contexts/cart-context";
import { useAuth } from "@/components/contexts/auth-context";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  inStock: boolean;
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { refreshCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchCart();
  }, [isAuthenticated, router]);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCartItems(result.data.items || []);
          // Auto-select all in-stock items
          const inStockItems = result.data.items
            .filter((item: CartItem) => item.inStock)
            .map((item: CartItem) => item.id);
          setSelectedItems(inStockItems);
        }
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setIsUpdating(productId);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          quantity: newQuantity,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchCart();
        refreshCart();
      } else {
        alert(result.error || "Failed to update quantity");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      alert("Failed to update quantity");
    } finally {
      setIsUpdating(null);
    }
  };

  const removeItem = async (productId: string) => {
    setIsUpdating(productId);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/cart?productId=${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setCartItems((prev) => prev.filter((item) => item.id !== productId));
        setSelectedItems((prev) => prev.filter((id) => id !== productId));
        refreshCart();
      }
    } catch (error) {
      console.error("Error removing item:", error);
      alert("Failed to remove item from cart");
    } finally {
      setIsUpdating(null);
    }
  };

  const bulkRemoveItems = async () => {
    if (selectedItems.length === 0) return;

    setIsUpdating("bulk");
    try {
      const token = localStorage.getItem("accessToken");

      // Remove items one by one
      for (const productId of selectedItems) {
        await fetch(`/api/cart?productId=${productId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Refresh cart data
      await fetchCart();
      refreshCart();
      setSelectedItems([]);
    } catch (error) {
      console.error("Error bulk removing items:", error);
      alert("Failed to remove items from cart");
    } finally {
      setIsUpdating(null);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    const inStockItems = cartItems
      .filter((item) => item.inStock)
      .map((item) => item.id);

    if (selectedItems.length === inStockItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(inStockItems);
    }
  };

  const getSelectedItems = () => {
    return cartItems.filter((item) => selectedItems.includes(item.id));
  };

  const calculateTotals = () => {
    const selected = getSelectedItems();
    const subtotal = selected.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // You can add tax calculation here based on admin settings
    // For now, we'll keep it simple
    const tax = 0; // Tax will be calculated by admin
    const shipping = selected.length > 0 ? 0 : 0; // Free shipping for demo
    const total = subtotal + tax + shipping;

    return { subtotal, tax, shipping, total, itemCount: selected.length };
  };

 // Update your existing cart page - add this function
const proceedToCheckout = () => {
  if (selectedItems.length === 0) {
    alert("Please select at least one item to proceed to checkout");
    return;
  }

  // Store selected items in session storage for checkout page
  const selectedProducts = cartItems.filter(item => selectedItems.includes(item.id));
  sessionStorage.setItem("checkoutItems", JSON.stringify(selectedProducts));
  router.push("/checkout");
};

  const { subtotal, tax, shipping, total, itemCount } = calculateTotals();

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
          <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in cart
            {selectedItems.length > 0 && (
              <span className="text-primary font-semibold ml-2">
                • {selectedItems.length} selected for checkout
              </span>
            )}
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 text-muted-foreground mx-auto mb-6 opacity-50" />
            <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Add some amazing products to your cart and come back here to
              complete your purchase!
            </p>
            <Link
              href="/product"
              className="inline-flex items-center px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Bulk Actions */}
              <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
                {/* Row 1 → Select All + Remove Selected */}
                <div className="flex items-center justify-between gap-4">
                  {/* Left section → Select All + Count */}
                  <div>
                    {/* Select All */}
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                          selectedItems.length ===
                          cartItems.filter((item) => item.inStock).length
                            ? "bg-primary border-primary"
                            : "bg-background border-border"
                        }`}
                      >
                        {selectedItems.length ===
                          cartItems.filter((item) => item.inStock).length && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>

                      <span>
                        Select All{" "}
                        <span className="text-xs text-muted-foreground">
                          ({cartItems.filter((i) => i.inStock).length} in stock)
                        </span>
                      </span>
                    </button>

                    {/* Count (now directly under Select All, left aligned) */}
                    <div className="mt-1">
                      <span className="text-sm text-muted-foreground">
                        {selectedItems.length} of {cartItems.length} selected
                      </span>
                    </div>
                  </div>

                  {/* Remove Selected */}
                  {selectedItems.length > 0 && (
                    <button
                      onClick={bulkRemoveItems}
                      disabled={isUpdating === "bulk"}
                      className="text-destructive hover:text-destructive/80 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      {isUpdating === "bulk" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Remove Selected
                    </button>
                  )}
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-card border rounded-xl p-3 sm:p-4 transition-all
        ${
          selectedItems.includes(item.id)
            ? "border-primary ring-2 ring-primary/20"
            : "border-border"
        }
        ${!item.inStock ? "opacity-60" : ""}
      `}
                  >
                    <div className="flex gap-4">
                      {/* Checkbox */}
                      <div className="flex items-start pt-1">
                        <div
                          onClick={() =>
                            item.inStock && toggleItemSelection(item.id)
                          }
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition
              ${
                selectedItems.includes(item.id)
                  ? "bg-primary border-primary"
                  : item.inStock
                  ? "bg-background border-border hover:border-primary"
                  : "bg-muted border-muted cursor-not-allowed"
              }
            `}
                        >
                          {selectedItems.includes(item.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Product Image */}
                      <Link href={`/product/${item.id}`}>
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>

                      {/* Right Side Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        {/* Product Name + Price */}
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <Link href={`/product/${item.id}`}>
                              <h3 className="font-semibold text-sm sm:text-base line-clamp-2 hover:text-primary transition">
                                {item.name}
                              </h3>
                            </Link>

                            {!item.inStock && (
                              <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
                                <AlertCircle className="w-4 h-4" />
                                Out of stock
                              </div>
                            )}
                          </div>

                          <span className="font-bold text-primary text-base sm:text-lg whitespace-nowrap">
                            ₹{item.price}
                          </span>
                        </div>

                        {/* Quantity + Remove */}
                        <div className="flex justify-between items-center mt-3 gap-4">
                          {/* Quantity Section */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              Qty:
                            </span>

                            <div className="flex items-center gap-2 bg-input border border-border p-1 rounded-lg">
                              {/* Decrease */}
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                disabled={
                                  item.quantity <= 1 || isUpdating === item.id
                                }
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted disabled:opacity-50"
                              >
                                <Minus className="w-3 h-3" />
                              </button>

                              {/* Quantity Number */}
                              <span className="w-6 text-center text-sm font-medium">
                                {isUpdating === item.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                ) : (
                                  item.quantity
                                )}
                              </span>

                              {/* Increase */}
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                disabled={
                                  item.quantity >= Math.min(item.stock, 10) ||
                                  isUpdating === item.id
                                }
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted disabled:opacity-50"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {item.stock > 0 && (
                              <span className="text-xs text-muted-foreground">
                                Max {Math.min(item.stock, 10)}
                              </span>
                            )}
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={isUpdating === item.id}
                            className="text-destructive hover:text-destructive/80 p-1.5 transition disabled:opacity-50"
                          >
                            {isUpdating === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6 sticky top-6">
                <h3 className="text-xl font-bold mb-4">Order Summary</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Items ({itemCount})
                    </span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}
                    </span>
                  </div>

                  {/* Tax will be calculated by admin - removed static tax display */}

                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">₹{total.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tax will be calculated during checkout
                    </p>
                  </div>
                </div>

                <button
                  onClick={proceedToCheckout}
                  disabled={selectedItems.length === 0}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5" />
                </button>

                {selectedItems.length === 0 && cartItems.length > 0 && (
                  <p className="text-sm text-muted-foreground text-center mt-3">
                    Please select items to proceed
                  </p>
                )}

                <Link
                  href="/product"
                  className="w-full mt-4 text-center block py-3 border border-border rounded-xl font-semibold hover:bg-muted transition"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
