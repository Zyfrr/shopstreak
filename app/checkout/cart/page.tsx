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
  Loader2,
  AlertCircle,
  Package,
  ShoppingCart,
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

interface PreviousOrderItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  inStock: boolean;
  stock: number;
  isFromPreviousOrder: boolean;
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [previousOrderItems, setPreviousOrderItems] = useState<PreviousOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
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
    fetchRecentOrders();
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
          // DON'T auto-select items - let user select manually
          setSelectedItems([]);
        }
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    if (!isAuthenticated) return;
    
    setOrdersLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/orders?limit=3", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const previousItems: PreviousOrderItem[] = [];
          result.data.orders.forEach((order: any) => {
            order.products.forEach((product: any) => {
              previousItems.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: product.quantity,
                inStock: true,
                stock: 10,
                isFromPreviousOrder: true
              });
            });
          });
          setPreviousOrderItems(previousItems);
        }
      } else {
        setPreviousOrderItems([]);
      }
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      setPreviousOrderItems([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const addPreviousOrderItemToCart = async (item: PreviousOrderItem) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: item.id,
          quantity: item.quantity,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchCart();
        refreshCart();
        setSelectedItems(prev => [...prev, item.id]);
      }
    } catch (error) {
      console.error("Error adding previous order item to cart:", error);
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
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
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
    } finally {
      setIsUpdating(null);
    }
  };

  const bulkRemoveItems = async () => {
    if (selectedItems.length === 0) return;

    setIsUpdating("bulk");
    try {
      const token = localStorage.getItem("accessToken");

      for (const productId of selectedItems) {
        await fetch(`/api/cart?productId=${productId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      await fetchCart();
      refreshCart();
      setSelectedItems([]);
    } catch (error) {
      console.error("Error bulk removing items:", error);
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
    const shipping = selected.length > 0 ? 0 : 0;
    const total = subtotal + shipping;

    return { subtotal, shipping, total, itemCount: selected.length };
  };

  const proceedToCheckout = () => {
    if (selectedItems.length === 0) return;

    const selectedProducts = cartItems.filter(item => selectedItems.includes(item.id));
    sessionStorage.setItem("checkoutItems", JSON.stringify(selectedProducts));
    router.push("/checkout");
  };

  const { subtotal, shipping, total, itemCount } = calculateTotals();

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground text-sm">
            {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in cart
            {selectedItems.length > 0 && (
              <span className="text-primary font-semibold ml-2">
                • {selectedItems.length} selected
              </span>
            )}
          </p>
        </div>

        {cartItems.length === 0 && previousOrderItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-bold mb-3">Your Cart is Empty</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto px-4 text-sm">
              Add some amazing products to your cart and come back here to complete your purchase!
            </p>
            <Link
              href="/product"
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition text-sm"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Cart Items & Previous Orders */}
            <div className="flex-1 space-y-8">
              {/* Current Cart Items Section */}
              {cartItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Cart Items</h2>
                    <span className="text-sm text-muted-foreground">
                      {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* Bulk Actions */}
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggleSelectAll}
                          className="flex items-center gap-2 text-sm font-medium"
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                              selectedItems.length === cartItems.filter((item) => item.inStock).length
                                ? "bg-primary border-primary"
                                : "bg-background border-border"
                            }`}
                          >
                            {selectedItems.length === cartItems.filter((item) => item.inStock).length && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="text-sm">
                            Select All{" "}
                            <span className="text-xs text-muted-foreground">
                              ({cartItems.filter((i) => i.inStock).length} in stock)
                            </span>
                          </span>
                        </button>
                      </div>

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
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className={`bg-card border rounded-xl p-4 transition-all ${
                          selectedItems.includes(item.id)
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border"
                        } ${!item.inStock ? "opacity-60" : ""}`}
                      >
                        <div className="flex gap-4">
                          {/* Checkbox */}
                          <div className="flex items-start">
                            <div
                              onClick={() => item.inStock && toggleItemSelection(item.id)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition mt-1 ${
                                selectedItems.includes(item.id)
                                  ? "bg-primary border-primary"
                                  : item.inStock
                                  ? "bg-background border-border hover:border-primary"
                                  : "bg-muted border-muted cursor-not-allowed"
                              }`}
                            >
                              {selectedItems.includes(item.id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>

                          {/* Product Image */}
                          <Link href={`/product/${item.id}`} className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </Link>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col h-full justify-between">
                              <div className="flex justify-between items-start gap-4 mb-3">
                                <div className="min-w-0 flex-1">
                                  <Link href={`/product/${item.id}`}>
                                    <h3 className="font-semibold text-base line-clamp-2 hover:text-primary transition leading-tight">
                                      {item.name}
                                    </h3>
                                  </Link>
                                  {!item.inStock && (
                                    <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
                                      <AlertCircle className="w-3 h-3" />
                                      Out of stock
                                    </div>
                                  )}
                                </div>
                                <span className="font-bold text-primary text-lg whitespace-nowrap">
                                  ₹{item.price}
                                </span>
                              </div>

                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1 bg-input border border-border p-1 rounded-lg">
                                    <button
                                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                      disabled={item.quantity <= 1 || isUpdating === item.id}
                                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted disabled:opacity-50"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center text-sm font-medium">
                                      {isUpdating === item.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                      ) : (
                                        item.quantity
                                      )}
                                    </span>
                                    <button
                                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      disabled={item.quantity >= Math.min(item.stock, 10) || isUpdating === item.id}
                                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted disabled:opacity-50"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                  {item.stock > 0 && (
                                    <span className="text-xs text-muted-foreground hidden sm:block">
                                      Max {Math.min(item.stock, 10)}
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={() => removeItem(item.id)}
                                  disabled={isUpdating === item.id}
                                  className="text-destructive hover:text-destructive/80 p-2 transition disabled:opacity-50"
                                >
                                  {isUpdating === item.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Summary - Mobile Only */}
              <div className="lg:hidden">
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-lg font-bold mb-4">Order Summary</h3>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items ({itemCount})</span>
                      <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">
                        {shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-primary">₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={proceedToCheckout}
                    disabled={selectedItems.length === 0}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {selectedItems.length === 0 && cartItems.length > 0 && (
                    <p className="text-sm text-muted-foreground text-center mt-3">
                      Please select items to proceed
                    </p>
                  )}
                </div>
              </div>

              {/* Previous Orders Section */}
              {previousOrderItems.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      Previously Ordered Items
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      ({previousOrderItems.length} items)
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {previousOrderItems.map((item) => (
                      <div
                        key={`prev-${item.id}`}
                        className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex gap-4">
                          <Link href={`/product/${item.id}`} className="flex-shrink-0">
                            <div className="w-24 h-28 rounded-lg overflow-hidden bg-muted">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </Link>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col h-full justify-between">
                              <div className="flex justify-between items-start gap-4 mb-3">
                                <div className="min-w-0 flex-1">
                                  <Link href={`/product/${item.id}`}>
                                    <h3 className="font-semibold text-base line-clamp-2 hover:text-primary transition leading-tight">
                                      {item.name}
                                    </h3>
                                  </Link>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Previously ordered • Qty: {item.quantity}
                                  </p>
                                </div>
                                <span className="font-bold text-primary text-lg whitespace-nowrap">
                                  ₹{item.price}
                                </span>
                              </div>

                              <button
                                onClick={() => addPreviousOrderItemToCart(item)}
                                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 text-sm"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                Add to Cart & Select
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Order Summary - Desktop Only */}
            <div className="hidden lg:block lg:w-80">
              <div className="bg-card border border-border rounded-xl p-6 sticky top-6">
                <h3 className="text-xl font-bold mb-6">Order Summary</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items ({itemCount})</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={proceedToCheckout}
                  disabled={selectedItems.length === 0}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base"
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