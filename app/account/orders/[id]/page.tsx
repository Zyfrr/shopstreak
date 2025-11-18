"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  HiArrowLeft,
  HiTruck,
  HiCalendar,
  HiLocationMarker,
  HiPhone,
  HiCheck,
  HiClock,
  HiExclamation,
  HiRefresh,
} from "react-icons/hi";
import { AccountLayout } from "@/components/layout/account-layout";
import { useAuth } from "@/components/contexts/auth-context";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  total: number;
}

interface OrderSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
}

interface OrderAddress {
  SS_FULL_NAME: string;
  SS_MOBILE: string;
  SS_ADDRESS_LINE1: string;
  SS_CITY: string;
  SS_STATE: string;
  SS_PINCODE: string;
  SS_COUNTRY: string;
  SS_ADDRESS_TYPE: string;
}

interface PaymentInfo {
  method: string;
  status: string;
  transactionId: string;
  amount: number;
  date: string;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  paymentStatus: string;
  items: OrderItem[];
  summary: OrderSummary;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  payment: PaymentInfo;
  shipping: any;
  tracking: any[];
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchOrder();
  }, [isAuthenticated, router]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const orderId = params.id;

      if (!orderId) {
        throw new Error("Order ID is missing");
      }

      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setOrder(result.data.order);
        } else {
          throw new Error(result.error || "Order not found");
        }
      } else if (response.status === 404) {
        throw new Error("Order not found");
      } else {
        throw new Error("Failed to fetch order details");
      }
    } catch (error: any) {
      console.error("Error fetching order:", error);
      setError(error.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "processing":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "shipped":
      return "bg-purple-100 text-purple-800 border-purple-300";
    case "delivered":
      return "bg-green-100 text-green-800 border-green-300";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};


  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <HiCheck className="w-4 h-4" />;
      case "shipped":
      case "processing":
        return <HiTruck className="w-4 h-4" />;
      case "pending":
        return <HiClock className="w-4 h-4" />;
      case "cancelled":
        return <HiExclamation className="w-4 h-4" />;
      default:
        return <HiClock className="w-4 h-4" />;
    }
  };

  const getStatusIconBoxColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-yellow-100 text-yellow-800 border border-yellow-300";
    case "processing":
      return "bg-blue-100 text-blue-800 border border-blue-300";
    case "shipped":
      return "bg-purple-100 text-purple-800 border border-purple-300";
    case "delivered":
      return "bg-green-100 text-green-800 border border-green-300";
    case "cancelled":
      return "bg-red-100 text-red-800 border border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-300";
  }
};


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <AccountLayout
        title="Order Details"
        description="Loading order information..."
        showBackButton={true}
        backHref="/account/orders"
      >
        <div className="flex items-center justify-center py-12">
          <HiRefresh className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AccountLayout>
    );
  }

  if (error || !order) {
    return (
      <AccountLayout
        title="Order Not Found"
        description={error || "The order you're looking for doesn't exist"}
        showBackButton={true}
        backHref="/account/orders"
      >
        <div className="text-center py-16">
          <HiExclamation className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
          <p className="text-muted-foreground mb-8">
            {error ||
              "The order you're looking for doesn't exist or you don't have permission to view it."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/account/orders"
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
            >
              Back to Orders
            </Link>
            <button
              onClick={fetchOrder}
              className="inline-flex items-center px-6 py-3 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted/80 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      title={`Order #${order.orderNumber}`}
      description={`Placed on ${formatDate(order.date)}`}
      showBackButton={true}
      backHref="/account/orders"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HiCalendar className="w-4 h-4" />
          <span>Ordered on {formatDateTime(order.date)}</span>
        </div>
        <Link
          href={`/account/order-tracking/${order.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition text-sm w-full sm:w-auto justify-center"
        >
          <HiTruck className="w-4 h-4" />
          Track Order
        </Link>
      </div>
{/* Order Header */}
<div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-6">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">

    {/* Left Section */}
    <div className="flex-1">
      <h1 className="text-xl sm:text-2xl font-bold mb-2">
        Order #{order.orderNumber}
      </h1>

      {/* Status Badges */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Order Status */}
        <span
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-semibold text-sm border ${getStatusColor(order.status)}`}
        >
          {getStatusIcon(order.status)}
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>

        {/* Payment Status */}
        <span
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-semibold text-sm border ${
            order.paymentStatus === "paid"
              ? "bg-green-100 text-green-800 border-green-300"
              : "bg-yellow-100 text-yellow-800 border-yellow-300"
          }`}
        >
          {order.paymentStatus === "paid"
            ? "Payment Completed"
            : "Payment Pending"}
        </span>
      </div>
    </div>

   {/* Right Section */}
<div className="flex flex-col justify-between items-end text-right gap-1">
  <p className="text-base font-medium text-muted-foreground">
    Total ({order.items.length}) item{order.items.length !== 1 ? "s" : ""}
  </p>

  <p className="text-2xl sm:text-3xl font-bold text-primary">
    ₹{order.summary.total.toFixed(2)}
  </p>
</div>


  </div>
</div>


      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items List */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-border rounded-lg"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm sm:text-base">
                      ₹{item.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ₹{(item.price * item.quantity).toFixed(2)} total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm sm:text-base">
                <span>Subtotal</span>
                <span>₹{order.summary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span>Shipping</span>
                <span
                  className={
                    order.summary.shipping === 0 ? "text-green-600" : ""
                  }
                >
                  {order.summary.shipping === 0
                    ? "Free"
                    : `₹${order.summary.shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span>Tax (18%)</span>
                <span>₹{order.summary.tax.toFixed(2)}</span>
              </div>
              {order.summary.discount > 0 && (
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Discount</span>
                  <span className="text-green-600">
                    -₹{order.summary.discount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-border pt-3 flex justify-between font-bold text-base sm:text-lg">
                <span>Total</span>
                <span className="text-primary">
                  ₹{order.summary.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Information */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
              <HiLocationMarker className="w-4 h-4 sm:w-5 sm:h-5" />
              Shipping Address
            </h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <p className="font-semibold">
                {order.shippingAddress.SS_FULL_NAME}
              </p>
              <p>{order.shippingAddress.SS_ADDRESS_LINE1}</p>
              <p>
                {order.shippingAddress.SS_CITY},{" "}
                {order.shippingAddress.SS_STATE}{" "}
                {order.shippingAddress.SS_PINCODE}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <HiPhone className="w-3 h-3 sm:w-4 sm:h-4" />
                {order.shippingAddress.SS_MOBILE}
              </p>
              {order.shippingAddress.SS_ADDRESS_TYPE && (
                <p className="text-xs text-muted-foreground capitalize">
                  {order.shippingAddress.SS_ADDRESS_TYPE} address
                </p>
              )}
            </div>
          </div>

          {/* Payment Information */}
          {order.payment && (
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6 w-full">
              <h3 className="font-bold mb-4 text-base sm:text-lg">
                Payment Information
              </h3>

              <div className="space-y-4 text-sm sm:text-base">
                {/* Payment Method */}
                <div>
                  <span className="text-muted-foreground block">
                    Payment Method:
                  </span>
                  <span className="font-semibold capitalize mt-1 block">
                    {order.payment.method}
                  </span>
                </div>

                {/* Transaction ID */}
                <div>
                  <span className="text-muted-foreground block">
                    Transaction ID:
                  </span>

                  <span className="font-mono mt-1 block break-all text-xs sm:text-[12px]">
                    {order.payment.transactionId}
                  </span>
                </div>

                {/* Status */}
                <div>
                  <span className="text-muted-foreground block">Status:</span>
                  <span
                    className={`font-semibold mt-1 block ${
                      order.payment.status === "completed"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {order.payment.status.charAt(0).toUpperCase() +
                      order.payment.status.slice(1)}
                  </span>
                </div>

                {/* Paid On */}
                {order.payment.date && (
                  <div>
                    <span className="text-muted-foreground block">
                      Paid on:
                    </span>
                    <span className="mt-1 block">
                      {formatDateTime(order.payment.date)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping Information */}
          {order.shipping && Object.keys(order.shipping).length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
                <HiTruck className="w-4 h-4 sm:w-5 sm:h-5" />
                Shipping Information
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                {order.shipping.SS_COURIER_NAME && (
                  <div className="flex justify-between">
                    <span>Courier:</span>
                    <span>{order.shipping.SS_COURIER_NAME}</span>
                  </div>
                )}
                {order.shipping.SS_TRACKING_NUMBER && (
                  <div className="flex justify-between">
                    <span>Tracking Number:</span>
                    <span className="font-mono text-xs">
                      {order.shipping.SS_TRACKING_NUMBER}
                    </span>
                  </div>
                )}
                {order.shipping.SS_EXPECTED_DELIVERY && (
                  <div className="flex justify-between">
                    <span>Est. Delivery:</span>
                    <span>
                      {formatDate(order.shipping.SS_EXPECTED_DELIVERY)}
                    </span>
                  </div>
                )}
                {order.shipping.SS_DELIVERED_DATE && (
                  <div className="flex justify-between">
                    <span>Delivered On:</span>
                    <span className="text-green-600 font-semibold">
                      {formatDateTime(order.shipping.SS_DELIVERED_DATE)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AccountLayout>
  );
}
