"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Truck,
  Calendar,
  Loader2,
  Search,
  ChevronRight,
  Clock,
  X,
  IndianRupee
} from "lucide-react";

import { AccountLayout } from "@/components/layout/account-layout";
import { useAuth } from "@/components/contexts/auth-context";

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: string;
  items: number;
  products: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  tracking: {
    currentStatus: string;
    progress: number;
    lastUpdate: string;
    estimatedDelivery?: string;
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/account/orders");
      return;
    }
    fetchOrders();
  }, [isAuthenticated, router]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setOrders(result.data.orders || []);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.products.some(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-300";
      case "shipped":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "processing":
      case "confirmed":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "pending":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <Package className="w-5 h-5 text-green-600" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-blue-600" />;
      case "processing":
      case "confirmed":
        return <Clock className="w-5 h-5 text-yellow-600 animate-spin" />;
      case "pending":
        return <Calendar className="w-5 h-5 text-orange-600" />;
      case "cancelled":
        return <X className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Show loading state while checking authentication
  if (!isAuthenticated || loading) {
    return (
      <AccountLayout
        title="My Orders"
        description="Manage and track your orders"
        showBackButton={true}
        backHref="/account"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      title="My Orders"
      description="Manage and track your orders"
      showBackButton={true}
      backHref="/account"
    >
      {/* Search and Filter */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search by Order ID or Product Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <Package className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-xl font-bold">{orders.length}</p>
          <p className="text-xs text-muted-foreground">Total Orders</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <Truck className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-xl font-bold">
            {orders.filter((order) => order.status === "delivered").length}
          </p>
          <p className="text-xs text-muted-foreground">Delivered</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <Calendar className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-xl font-bold">
            {orders.filter((order) => order.status === "shipped").length}
          </p>
          <p className="text-xs text-muted-foreground">In Transit</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <IndianRupee className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-xl font-bold">
            ₹{orders.reduce((sum, order) => sum + order.total, 0).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-foreground">Total Spent</p>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm || statusFilter !== "all" ? "No Orders Found" : "No Orders Yet"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search or filter criteria"
              : "You haven't placed any orders yet"
            }
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Link
              href="/product"
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition text-sm"
            >
              Start Shopping
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
            >
              {/* Order Header */}
              <button
                onClick={() =>
                  setExpandedOrder(
                    expandedOrder === order.id ? null : order.id
                  )
                }
                className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-muted/50 transition"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 text-left">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                    {getStatusIcon(order.status)}
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-semibold text-base sm:text-lg truncate">
                      Order {order.orderNumber}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {formatDate(order.date)} • {order.items} item
                      {order.items > 1 ? "s" : ""}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      {order.paymentStatus === 'paid' && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-300">
                          Paid
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 ml-2">
                  <div className="text-right hidden sm:block">
                    <p className="font-bold text-lg">₹{order.total}</p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform flex-shrink-0 ${
                      expandedOrder === order.id ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Mobile total */}
              <div className="sm:hidden px-4 pb-4 -mt-2">
                <p className="font-bold text-lg text-primary">₹{order.total}</p>
              </div>

              {/* Order Details */}
              {expandedOrder === order.id && (
                <div className="border-t border-border p-4 sm:p-6 space-y-6 bg-muted/30">
                  {/* Order Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-background rounded-lg p-3 sm:p-4">
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                        Order ID
                      </p>
                      <p className="font-semibold font-mono text-sm">{order.orderNumber}</p>
                    </div>
                    <div className="bg-background rounded-lg p-3 sm:p-4">
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                        Order Date
                      </p>
                      <p className="font-semibold text-sm">
                        {formatDateTime(order.date)}
                      </p>
                    </div>
                    <div className="bg-background rounded-lg p-3 sm:p-4">
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                        Total Items
                      </p>
                      <p className="font-semibold text-sm">{order.items}</p>
                    </div>
                    <div className="bg-background rounded-lg p-3 sm:p-4">
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                        Total Amount
                      </p>
                      <p className="font-semibold text-lg text-primary">
                        ₹{order.total}
                      </p>
                    </div>
                  </div>

                  {/* Tracking Progress */}
                  <div className="bg-background rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-muted-foreground font-medium">
                        Delivery Progress
                      </span>
                      <span className="font-semibold">
                        {order.tracking.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${order.tracking.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Current Status: <span className="font-semibold text-foreground">{order.tracking.currentStatus}</span>
                      {order.tracking.estimatedDelivery && (
                        <> • Est. Delivery: {formatDate(order.tracking.estimatedDelivery)}</>
                      )}
                    </p>
                  </div>

                  {/* Products */}
                  <div>
                    <h4 className="font-semibold mb-3 text-sm sm:text-base">Products</h4>
                    <div className="space-y-3">
                      {order.products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 sm:gap-4 bg-background rounded-lg p-3 sm:p-4 border border-border"
                        >
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-sm sm:text-base line-clamp-2">
                              {product.name}
                            </h5>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Quantity: {product.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm sm:text-base">
                              ₹{product.price}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ₹{(product.price * product.quantity).toFixed(2)} total
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="flex-1 text-center px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition text-sm"
                    >
                      View Full Details
                    </Link>
                    <Link
                      href={`/account/order-tracking/${order.id}`}
                      className="flex-1 text-center px-4 py-3 border border-border rounded-lg font-semibold hover:bg-muted transition text-sm"
                    >
                      Track Order
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AccountLayout>
  );
}