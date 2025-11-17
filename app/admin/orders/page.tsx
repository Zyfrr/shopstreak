"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Search,
  Eye,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  date: string;
  amount: number;
  status: string;
  paymentStatus: string;
  items: number;
  shippingAddress: any;
}

interface OrderStats {
  statusCounts: Record<string, number>;
  paymentStatusCounts: Record<string, number>;
  totalRevenue: number;
  totalPaidOrders: number;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, filterStatus, filterPaymentStatus]);

  // Update the fetchOrders function:
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminAccessToken");

      if (!token) {
        router.push("/admin/login");
        return;
      }

      let url = `/api/admin/orders?page=${pagination.page}&limit=${pagination.limit}`;

      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (filterStatus !== "all") url += `&status=${filterStatus}`;
      if (filterPaymentStatus !== "all")
        url += `&paymentStatus=${filterPaymentStatus}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("adminAccessToken");
        router.push("/admin/login");
        return;
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setOrders(result.data.orders);
          setStats(result.data.stats);
          setPagination((prev) => ({
            ...prev,
            ...result.data.pagination,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchOrders();
  };

  const handleFilter = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchOrders();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterPaymentStatus("all");
    setStartDate("");
    setEndDate("");
    setPagination((prev) => ({ ...prev, page: 1 }));
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
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Orders Management
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Manage and track all customer orders
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center">
              <p className="text-muted-foreground text-xs mb-1 sm:mb-2">
                Total Orders
              </p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">
                {pagination.total}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center">
              <p className="text-muted-foreground text-xs mb-1 sm:mb-2">
                Pending
              </p>
              <p className="text-lg sm:text-2xl font-bold text-orange-600">
                {stats.statusCounts.pending || 0}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center">
              <p className="text-muted-foreground text-xs mb-1 sm:mb-2">
                Processing
              </p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                {stats.statusCounts.processing || 0}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center">
              <p className="text-muted-foreground text-xs mb-1 sm:mb-2">
                Shipped
              </p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">
                {stats.statusCounts.shipped || 0}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center">
              <p className="text-muted-foreground text-xs mb-1 sm:mb-2">
                Revenue
              </p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">
                ₹{(stats.totalRevenue || 0).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-4 mb-4"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by Order ID, Customer Name, or Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pr-10 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition text-sm font-medium"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </form>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t border-border pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Order Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Payment Status
                  </label>
                  <select
                    value={filterPaymentStatus}
                    onChange={(e) => setFilterPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Payments</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleFilter}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition text-sm font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Orders Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left py-4 px-4 sm:px-6 font-semibold text-xs sm:text-sm">
                    Order ID
                  </th>
                  <th className="text-left py-4 px-4 sm:px-6 font-semibold text-xs sm:text-sm">
                    Customer
                  </th>
                  <th className="text-left py-4 px-4 sm:px-6 font-semibold text-xs sm:text-sm hidden md:table-cell">
                    Date
                  </th>
                  <th className="text-left py-4 px-4 sm:px-6 font-semibold text-xs sm:text-sm">
                    Items
                  </th>
                  <th className="text-left py-4 px-4 sm:px-6 font-semibold text-xs sm:text-sm">
                    Amount
                  </th>
                  <th className="text-left py-4 px-4 sm:px-6 font-semibold text-xs sm:text-sm">
                    Status
                  </th>
                  <th className="text-left py-4 px-4 sm:px-6 font-semibold text-xs sm:text-sm">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border hover:bg-muted/50 transition"
                  >
                    <td className="py-4 px-4 sm:px-6">
                      <div>
                        <p className="font-semibold text-primary text-xs sm:text-sm">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {formatDate(order.date)}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <div>
                        <p className="font-medium text-xs sm:text-sm">
                          {order.customer.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.customer.email}
                        </p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {order.customer.phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-muted-foreground text-xs sm:text-sm hidden md:table-cell">
                      {formatDateTime(order.date)}
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <span className="px-2 py-1 bg-muted rounded-full text-xs font-semibold">
                        {order.items} item{order.items > 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-bold text-xs sm:text-sm">
                      ₹{order.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </span>
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus.charAt(0).toUpperCase() +
                            order.paymentStatus.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-xs font-semibold"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {orders.length === 0 && !loading && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || filterStatus !== "all"
                  ? "Try adjusting your search or filters"
                  : "No orders have been placed yet"}
              </p>
              {(searchQuery || filterStatus !== "all") && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {orders.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} orders
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={!pagination.hasPrev}
                className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: pageNum }))
                      }
                      className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                        pagination.page === pageNum
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted transition"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={!pagination.hasNext}
                className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
