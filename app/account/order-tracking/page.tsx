"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HiArrowLeft, HiTruck, HiCheck, HiClock, HiSearch, HiRefresh } from "react-icons/hi";
import { AccountLayout } from "@/components/layout/account-layout";
import { useAuth } from "@/components/contexts/auth-context";

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: string;
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

export default function OrderTrackingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch('/api/orders?limit=50', {
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

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.products.some((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "processing":
      case "confirmed":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "pending":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <HiCheck className="w-4 h-4" />;
      case "shipped":
        return <HiTruck className="w-4 h-4" />;
      case "processing":
      case "confirmed":
        return <HiTruck className="w-4 h-4" />;
      default:
        return <HiClock className="w-4 h-4" />;
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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <AccountLayout
        title="Order Tracking"
        description="Track your recent orders"
        showBackButton={true}
        backHref="/account"
      >
        <div className="flex items-center justify-center py-12">
          <HiRefresh className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      title="Order Tracking"
      description="Track your recent orders"
      showBackButton={true}
      backHref="/account"
    >
      {/* Search Bar */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search by Order ID or Product Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div className="text-sm text-muted-foreground flex items-center">
            {filteredOrders.length} order
            {filteredOrders.length !== 1 ? "s" : ""} found
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
          >
            {/* Order Header */}
            <div className="p-4 sm:p-6 border-b border-border">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                    <img
                      src={order.products[0]?.image || "/placeholder.svg"}
                      alt={order.products[0]?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base sm:text-lg mb-1">
                      Order #{order.orderNumber}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      Placed on {formatDate(order.date)} • {order.items} item
                      {order.items > 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.tracking.currentStatus}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        ₹{order.total}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/account/order-tracking/${order.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition text-sm w-full sm:w-auto justify-center"
                >
                  <HiTruck className="w-4 h-4" />
                  Track Order
                </Link>
              </div>
            </div>

            {/* Order Items Preview */}
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Items in this order:</h4>
                  <div className="flex flex-wrap gap-2">
                    {order.products.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1 text-xs"
                      >
                        <div className="w-6 h-6 bg-background rounded overflow-hidden flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-medium truncate max-w-20 sm:max-w-32">{item.name}</span>
                        <span className="text-muted-foreground">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Last Update</p>
                  <p className="font-semibold text-sm">{formatDateTime(order.tracking.lastUpdate)}</p>
                  {order.tracking.estimatedDelivery && (
                    <>
                      <p className="text-xs text-muted-foreground mt-1">
                        Est. Delivery
                      </p>
                      <p className="font-semibold text-sm">
                        {formatDate(order.tracking.estimatedDelivery)}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                  <span className="text-muted-foreground">
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12 sm:py-16">
          <HiTruck className="w-16 h-16 sm:w-24 sm:h-24 text-muted-foreground mx-auto mb-4 sm:mb-6 opacity-50" />
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            {searchTerm ? "No Orders Found" : "No Orders Yet"}
          </h2>
          <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
            {searchTerm
              ? "No orders match your search. Try a different search term."
              : "You haven't placed any orders yet."}
          </p>
          {!searchTerm && (
            <Link
              href="/product"
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition text-sm sm:text-base"
            >
              Start Shopping
            </Link>
          )}
        </div>
      )}
    </AccountLayout>
  );
}