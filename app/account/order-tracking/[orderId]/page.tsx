"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { HiCheck, HiTruck, HiCube, HiHome, HiExclamation, HiRefresh } from "react-icons/hi";
import { AccountLayout } from "@/components/layout/account-layout";
import { useAuth } from "@/components/contexts/auth-context";

interface TrackingStep {
  status: string;
  description: string;
  date: string;
  completed: boolean;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface OrderAddress {
  SS_FULL_NAME: string;
  SS_MOBILE: string;
  SS_ADDRESS_LINE1: string;
  SS_CITY: string;
  SS_STATE: string;
  SS_PINCODE: string;
  SS_COUNTRY: string;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: string;
  items: OrderItem[];
  tracking: TrackingStep[];
  shippingAddress: OrderAddress;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchOrder();
  }, [orderId, isAuthenticated, router]);

  const fetchOrder = async () => {
    try {
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
          throw new Error('Order not found');
        }
      } else {
        throw new Error('Failed to fetch order');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ordered":
        return <HiCheck className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "confirmed":
        return <HiCheck className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "shipped":
        return <HiTruck className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "out-for-delivery":
        return <HiCube className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "delivered":
        return <HiHome className="w-4 h-4 sm:w-5 sm:h-5" />;
      default:
        return <HiCheck className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <AccountLayout
        title="Order Tracking"
        description="Loading order information..."
        showBackButton={true}
        backHref="/account/order-tracking"
      >
        <div className="flex items-center justify-center py-12">
          <HiRefresh className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AccountLayout>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-16">
            <HiExclamation className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The order you're looking for doesn't exist.
            </p>
            <Link
              href="/account/order-tracking"
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
            >
              Back to Order Tracking
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AccountLayout
      title={`Order #${order.orderNumber}`}
      description="Track your order status"
      showBackButton={true}
      backHref="/account/order-tracking"
    >
      {/* Order Header */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold mb-2">Order #{order.orderNumber}</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Placed on {formatDate(order.date)}
            </p>
          </div>
          <div className="text-right">
            <div
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-full font-semibold text-sm ${
                order.status === "delivered"
                  ? "bg-primary text-primary-foreground"
                  : order.status === "shipped"
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {order.status.charAt(0).toUpperCase() +
                order.status.slice(1).replace("-", " ")}
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary mt-2">
              ₹{order.total}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Tracking Timeline */}
        <div className="md:col-span-2">
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Order Tracking</h2>

            <div className="space-y-4">
              {order.tracking.map((step: TrackingStep, index: number) => (
                <div key={step.status} className="flex gap-3 sm:gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.completed
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {getStatusIcon(step.status)}
                    </div>
                    {index < order.tracking.length - 1 && (
                      <div
                        className={`flex-1 w-0.5 ${
                          step.completed ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-4 sm:pb-6">
                    <h3
                      className={`font-semibold text-sm sm:text-base ${
                        step.completed
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.description}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {step.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="space-y-6">
          {/* Items */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <h3 className="font-bold mb-4 text-sm sm:text-base">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item: OrderItem) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm line-clamp-2">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-sm sm:text-base">₹{item.price}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <h3 className="font-bold mb-4 text-sm sm:text-base">Shipping Address</h3>
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-semibold">{order.shippingAddress.SS_FULL_NAME}</p>
              <p>{order.shippingAddress.SS_ADDRESS_LINE1}</p>
              <p>
                {order.shippingAddress.SS_CITY}, {order.shippingAddress.SS_STATE}{" "}
                {order.shippingAddress.SS_PINCODE}
              </p>
              <p className="text-muted-foreground">{order.shippingAddress.SS_MOBILE}</p>
            </div>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}