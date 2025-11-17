"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Edit,
  Truck,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Package,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Save
} from "lucide-react";

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

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface PaymentInfo {
  id: string;
  method: string;
  status: string;
  transactionId: string;
  amount: number;
  date: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
  date: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  items: OrderItem[];
  summary: OrderSummary;
  shippingAddress: any;
  billingAddress: any;
  payment: PaymentInfo | null;
  shipping: any;
  customerNotes: string;
  adminNotes: string;
  tracking: any[];
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    paymentStatus: '',
    adminNotes: '',
    trackingNumber: '',
    courierName: '',
    shippedDate: '',
    expectedDelivery: ''
  });

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

// Update the fetchOrder function:
const fetchOrder = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem("adminAccessToken");
    
    if (!token) {
      router.push('/admin/login');
      return;
    }

    const response = await fetch(`/api/admin/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      localStorage.removeItem("adminAccessToken");
      router.push('/admin/login');
      return;
    }

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        setOrder(result.data.order);
        setFormData({
          status: result.data.order.status,
          paymentStatus: result.data.order.paymentStatus,
          adminNotes: result.data.order.adminNotes || '',
          trackingNumber: result.data.order.shipping?.SS_TRACKING_NUMBER || '',
          courierName: result.data.order.shipping?.SS_COURIER_NAME || '',
          shippedDate: result.data.order.shipping?.SS_SHIPPED_DATE ? 
            new Date(result.data.order.shipping.SS_SHIPPED_DATE).toISOString().split('T')[0] : '',
          expectedDelivery: result.data.order.shipping?.SS_EXPECTED_DELIVERY ? 
            new Date(result.data.order.shipping.SS_EXPECTED_DELIVERY).toISOString().split('T')[0] : ''
        });
      }
    }
  } catch (error) {
    console.error('Error fetching order:', error);
  } finally {
    setLoading(false);
  }
};

// Update the handleUpdateOrder function:
const handleUpdateOrder = async () => {
  try {
    setUpdating(true);
    const token = localStorage.getItem("adminAccessToken");
    
    if (!token) {
      router.push('/admin/login');
      return;
    }
    
    const updates = {
      status: formData.status,
      paymentStatus: formData.paymentStatus,
      adminNotes: formData.adminNotes,
      shippingDetails: {
        SS_TRACKING_NUMBER: formData.trackingNumber,
        SS_COURIER_NAME: formData.courierName,
        SS_SHIPPED_DATE: formData.shippedDate || undefined,
        SS_EXPECTED_DELIVERY: formData.expectedDelivery || undefined
      }
    };

    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (response.status === 401) {
      localStorage.removeItem("adminAccessToken");
      router.push('/admin/login');
      return;
    }

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        setOrder(prev => prev ? {
          ...prev,
          status: result.data.order.status,
          paymentStatus: result.data.order.paymentStatus,
          adminNotes: result.data.order.adminNotes,
          shipping: result.data.order.shipping
        } : null);
        setEditing(false);
        alert('Order updated successfully!');
      }
    }
  } catch (error) {
    console.error('Error updating order:', error);
    alert('Failed to update order');
  } finally {
    setUpdating(false);
  }
};
  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-purple-100 text-purple-800 border-purple-200";
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
        return <CheckCircle className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "processing":
        return <RefreshCw className="w-4 h-4" />;
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto text-center py-12">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The order you're looking for doesn't exist.
          </p>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/orders"
              className="p-2 hover:bg-muted rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Order #{order.orderNumber}</h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                Placed on {formatDateTime(order.date)}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit Order
              </button>
            ) : (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateOrder}
                  disabled={updating}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:opacity-90 transition text-sm font-medium disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Card */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4">Order Status & Tracking</h2>
              
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Order Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Payment Status</label>
                      <select
                        value={formData.paymentStatus}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                        className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Tracking Number</label>
                      <input
                        type="text"
                        value={formData.trackingNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                        className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Courier Name</label>
                      <input
                        type="text"
                        value={formData.courierName}
                        onChange={(e) => setFormData(prev => ({ ...prev, courierName: e.target.value }))}
                        className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Shipped Date</label>
                      <input
                        type="date"
                        value={formData.shippedDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, shippedDate: e.target.value }))}
                        className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Expected Delivery</label>
                      <input
                        type="date"
                        value={formData.expectedDelivery}
                        onChange={(e) => setFormData(prev => ({ ...prev, expectedDelivery: e.target.value }))}
                        className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
                      order.paymentStatus === 'paid' 
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      <CreditCard className="w-4 h-4" />
                      Payment: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </div>

                  {order.shipping?.SS_TRACKING_NUMBER && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Shipping Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Courier:</span>
                          <p className="font-medium">{order.shipping.SS_COURIER_NAME}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tracking Number:</span>
                          <p className="font-medium font-mono">{order.shipping.SS_TRACKING_NUMBER}</p>
                        </div>
                        {order.shipping.SS_SHIPPED_DATE && (
                          <div>
                            <span className="text-muted-foreground">Shipped Date:</span>
                            <p className="font-medium">{formatDate(order.shipping.SS_SHIPPED_DATE)}</p>
                          </div>
                        )}
                        {order.shipping.SS_EXPECTED_DELIVERY && (
                          <div>
                            <span className="text-muted-foreground">Expected Delivery:</span>
                            <p className="font-medium">{formatDate(order.shipping.SS_EXPECTED_DELIVERY)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Notes */}
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Admin Notes</label>
                {editing ? (
                  <textarea
                    value={formData.adminNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Add internal notes about this order..."
                  />
                ) : (
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {order.adminNotes || 'No admin notes added.'}
                  </p>
                )}
              </div>
            </div>

            {/* Order Items */}
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
                      <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2">{item.name}</h3>
                      <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm sm:text-base">₹{item.price.toFixed(2)}</p>
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
                  <span className={order.summary.shipping === 0 ? "text-green-600" : ""}>
                    {order.summary.shipping === 0 ? "Free" : `₹${order.summary.shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Tax</span>
                  <span>₹{order.summary.tax.toFixed(2)}</span>
                </div>
                {order.summary.discount > 0 && (
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Discount</span>
                    <span className="text-green-600">-₹{order.summary.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 flex justify-between font-bold text-base sm:text-lg">
                  <span>Total</span>
                  <span className="text-primary">₹{order.summary.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                Customer Information
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold">{order.customer.name}</p>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" />
                    {order.customer.email}
                  </p>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4" />
                    {order.customer.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                Shipping Address
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-semibold">{order.shippingAddress.SS_FULL_NAME}</p>
                <p>{order.shippingAddress.SS_ADDRESS_LINE1}</p>
                <p>
                  {order.shippingAddress.SS_CITY}, {order.shippingAddress.SS_STATE}{" "}
                  {order.shippingAddress.SS_PINCODE}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {order.shippingAddress.SS_MOBILE}
                </p>
              </div>
            </div>

            {/* Payment Information */}
            {order.payment && (
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                  Payment Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span className="font-semibold capitalize">{order.payment.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="font-mono text-xs">{order.payment.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-semibold ${
                      order.payment.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {order.payment.status.charAt(0).toUpperCase() + order.payment.status.slice(1)}
                    </span>
                  </div>
                  {order.payment.date && (
                    <div className="flex justify-between">
                      <span>Paid on:</span>
                      <span>{formatDateTime(order.payment.date)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Customer Notes */}
            {order.customerNotes && (
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
                <h3 className="font-bold mb-4">Customer Notes</h3>
                <p className="text-sm text-muted-foreground">{order.customerNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}