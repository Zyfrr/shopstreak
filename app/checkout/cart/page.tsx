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
  Clock,
  Truck,
  CheckCircle,
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

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: string;
  paymentStatus: string;
  items: number;
  products: any[];
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
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
          setRecentOrders(result.data.orders || []);
        }
      } else {
        console.error("Failed to fetch orders:", response.status);
        setRecentOrders([]);
      }
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      setRecentOrders([]);
    } finally {
      setOrdersLoading(false);
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
    const tax = 0;
    const shipping = selected.length > 0 ? 0 : 0;
    const total = subtotal + tax + shipping;

    return { subtotal, tax, shipping, total, itemCount: selected.length };
  };

  const proceedToCheckout = () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item to proceed to checkout");
      return;
    }

    const selectedProducts = cartItems.filter(item => selectedItems.includes(item.id));
    sessionStorage.setItem("checkoutItems", JSON.stringify(selectedProducts));
    router.push("/checkout");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'processing':
        return <Package className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in cart
            {selectedItems.length > 0 && (
              <span className="text-primary font-semibold ml-2">
                • {selectedItems.length} selected for checkout
              </span>
            )}
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-12 md:py-16">
            <ShoppingBag className="w-16 h-16 md:w-24 md:h-24 text-muted-foreground mx-auto mb-4 md:mb-6 opacity-50" />
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Your Cart is Empty</h2>
            <p className="text-muted-foreground mb-6 md:mb-8 max-w-md mx-auto px-4 text-sm md:text-base">
              Add some amazing products to your cart and come back here to complete your purchase!
            </p>
            <Link
              href="/product"
              className="inline-flex items-center px-6 md:px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition text-sm md:text-base"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Bulk Actions - Mobile Optimized */}
              <div className="bg-card border border-border rounded-xl p-3 md:p-4">
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
                      className="text-destructive hover:text-destructive/80 text-sm font-medium flex items-center gap-2 disabled:opacity-50 self-start sm:self-auto"
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
                <div className="mt-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.length} of {cartItems.length} selected
                  </span>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3 md:space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-card border rounded-xl p-3 md:p-4 transition-all ${
                      selectedItems.includes(item.id)
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border"
                    } ${!item.inStock ? "opacity-60" : ""}`}
                  >
                    <div className="flex gap-3 md:gap-4">
                      {/* Checkbox */}
                      <div className="flex items-start pt-1">
                        <div
                          onClick={() => item.inStock && toggleItemSelection(item.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition ${
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
                        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-muted">
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
                          {/* Top Section - Name and Price */}
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <Link href={`/product/${item.id}`}>
                                <h3 className="font-semibold text-sm sm:text-base line-clamp-2 hover:text-primary transition leading-tight">
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
                            <span className="font-bold text-primary text-base sm:text-lg whitespace-nowrap ml-2">
                              ₹{item.price}
                            </span>
                          </div>

                          {/* Bottom Section - Quantity and Actions */}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-2">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground sm:hidden">Qty:</span>
                              <div className="flex items-center gap-1 bg-input border border-border p-1 rounded-lg">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1 || isUpdating === item.id}
                                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted disabled:opacity-50"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-sm font-medium">
                                  {isUpdating === item.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                  ) : (
                                    item.quantity
                                  )}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  disabled={item.quantity >= Math.min(item.stock, 10) || isUpdating === item.id}
                                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted disabled:opacity-50"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              {item.stock > 0 && (
                                <span className="text-xs text-muted-foreground hidden sm:block">
                                  Max {Math.min(item.stock, 10)}
                                </span>
                              )}
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => removeItem(item.id)}
                              disabled={isUpdating === item.id}
                              className="text-destructive hover:text-destructive/80 p-1 transition disabled:opacity-50 self-start sm:self-auto"
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

            {/* Order Summary & Recent Orders */}
            <div className="lg:col-span-1 space-y-6">
              {/* Order Summary */}
              <div className="bg-card border border-border rounded-xl p-4 md:p-6  top-6">
                <h3 className="text-lg md:text-xl font-bold mb-4">Order Summary</h3>

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
                    <div className="flex justify-between font-bold text-base md:text-lg">
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
                  className="w-full bg-primary text-primary-foreground py-3 md:py-4 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                {selectedItems.length === 0 && cartItems.length > 0 && (
                  <p className="text-sm text-muted-foreground text-center mt-3">
                    Please select items to proceed
                  </p>
                )}

                <Link
                  href="/product"
                  className="w-full mt-3 text-center block py-2 md:py-3 border border-border rounded-xl font-semibold hover:bg-muted transition text-sm md:text-base"
                >
                  Continue Shopping
                </Link>
              </div>

            </div>
{/* Recent Orders Section */}
{recentOrders.length > 0 && (
  <div className="w-full mt-6">

    {/* Heading */}
    <h1 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2 text-[#0B1A2A]">
      <Package className="w-8 h-8 text-primary" />
       Previously Ordered Items
    </h1>

    {/* Wrapper */}
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6">

      <div className="flex flex-col gap-4">

        {recentOrders.slice(0, 2).map((order) => (
          <div
            key={order.id}
            className="
              border border-border rounded-lg p-4 
              hover:border-primary/50 transition-colors
              flex flex-col gap-4
            "
          >

            {/* Top Row */}
            <div className="flex justify-between items-start">
              
              {/* Left */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base truncate text-[#0B1A2A]">
                  Order #{order.orderNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.date).toLocaleDateString()}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 shrink-0">
                {getStatusIcon(order.status)}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Product Preview */}
            <div className="space-y-2">
              {order.products.slice(0, 1).map((product: any) => (
                <div key={product.id} className="flex items-center gap-3">
                  
                  {/* Image */}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm sm:text-base text-[#0B1A2A]">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {product.quantity} • ₹{product.total}
                    </p>
                  </div>

                </div>
              ))}

              {/* More Items */}
              {order.products.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  +{order.products.length - 1} more item
                  {order.products.length - 1 !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Bottom Row */}
            <div className="flex justify-between items-center border-t border-border pt-3">
              <span className="text-primary font-bold text-base">
                ₹{order.total}
              </span>

              <Link
                href={`/account/orders/${order.id}`}
                className="text-xs sm:text-sm text-primary font-medium hover:underline"
              >
                View Details
              </Link>
            </div>

          </div>
        ))}

        {/* View All Orders Button */}
        {recentOrders.length >= 3 && (
          <div className="text-center pt-2">
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View All Orders
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

    </div>
  </div>
)}


          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}