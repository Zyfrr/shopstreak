"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  ShoppingBag, 
  IndianRupee, 
  Star, 
  User, 
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  MoreVertical,
  CreditCard,
  FileText,
  BarChart3,
  Tag,
  ThumbsUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface CustomerDetail {
  id: string;
  email: string;
  status: string;
  joinDate: string;
  onboardingStatus: string;
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  profile: {
    firstName: string;
    lastName: string;
    fullName: string;
    mobile: string;
    gender: string;
    dateOfBirth: string;
    addresses: any[];
    profileCompleted: boolean;
    lastProfileUpdate: string;
  } | null;
  stats: {
    totalOrders: number;
    totalSpent: number;
    successfulOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    averageOrderValue: number;
    totalReviews: number;
    averageRating: number;
  };
  orders: Array<{
    id: string;
    orderNumber: string;
    date: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      image: string;
      total: number;
    }>;
  }>;
  reviews: Array<{
    id: string;
    productId: string;
    productName: string;
    rating: number;
    title: string;
    description: string;
    date: string;
    helpfulCount: number;
    isVerified: boolean;
  }>;
  analytics: {
    favoriteCategories: Array<{
      _id: string;
      totalSpent: number;
      orderCount: number;
    }>;
    monthlySpending: Array<{
      period: string;
      totalSpent: number;
      orderCount: number;
    }>;
  };
}

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const customerId = params.id as string

  useEffect(() => {
    fetchCustomerDetails()
  }, [customerId])

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("adminAccessToken")

      if (!token) {
        router.push("/admin/login")
        return
      }

      const response = await fetch(`/api/admin/customers/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        localStorage.removeItem("adminAccessToken")
        router.push("/admin/login")
        return
      }

      const result = await response.json()

      if (result.success) {
        setCustomer(result.data.customer)
      } else {
        toast.error(result.error || "Failed to fetch customer details")
        router.push("/admin/customers")
      }
    } catch (error) {
      console.error("Fetch customer details error:", error)
      toast.error("Failed to fetch customer details")
      router.push("/admin/customers")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!customer) return

    try {
      const token = localStorage.getItem("adminAccessToken")
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Customer status updated successfully")
        setCustomer(prev => prev ? { ...prev, status: newStatus } : null)
      } else {
        toast.error(result.error || "Failed to update customer status")
      }
    } catch (error) {
      console.error("Update customer status error:", error)
      toast.error("Failed to update customer status")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto text-center py-12">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Customer Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The customer you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push("/admin/customers")}>
            Back to Customers
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/customers")}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">
              {customer.profile?.fullName || customer.email}
            </h1>
            <p className="text-muted-foreground mt-1">
              Customer Details & Analytics
            </p>
          </div>
          <Select
            value={customer.status}
            onValueChange={handleStatusUpdate}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer Info & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Customer Profile Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-lg">
                    {customer.profile ? 
                      `${customer.profile.firstName?.[0] || ''}${customer.profile.lastName?.[0] || ''}`.toUpperCase() || customer.email[0].toUpperCase() :
                      customer.email[0].toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {customer.profile?.fullName || 'No Name Provided'}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{customer.email}</span>
                  </div>
                  
                  {customer.profile?.mobile && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{customer.profile.mobile}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Joined:</span>
                    <span className="font-medium">{formatDate(customer.joinDate)}</span>
                  </div>

                  {customer.profile?.dateOfBirth && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Date of Birth:</span>
                      <span className="font-medium">
                        {new Date(customer.profile.dateOfBirth).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  )}

                  {customer.profile?.gender && customer.profile.gender !== 'prefer_not_to_say' && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Gender:</span>
                      <span className="font-medium capitalize">{customer.profile.gender}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm mb-2">Communication Preferences</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${customer.communicationPreferences.email ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span>Email Notifications</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${customer.communicationPreferences.sms ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span>SMS Notifications</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${customer.communicationPreferences.push ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span>Push Notifications</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <ShoppingBag className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-600">{customer.stats.totalOrders}</p>
                    <p className="text-xs text-blue-600">Total Orders</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <IndianRupee className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(customer.stats.totalSpent).replace('₹', '')}
                    </p>
                    <p className="text-xs text-green-600">Total Spent</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Successful Orders:</span>
                    <span className="font-semibold text-green-600">{customer.stats.successfulOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending Orders:</span>
                    <span className="font-semibold text-yellow-600">{customer.stats.pendingOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cancelled Orders:</span>
                    <span className="font-semibold text-red-600">{customer.stats.cancelledOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Order Value:</span>
                    <span className="font-semibold">{formatCurrency(customer.stats.averageOrderValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Reviews:</span>
                    <span className="font-semibold">{customer.stats.totalReviews}</span>
                  </div>
                  {customer.stats.totalReviews > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Rating:</span>
                      <span className="font-semibold flex items-center gap-1">
                        {customer.stats.averageRating.toFixed(1)}
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Addresses */}
            {customer.profile?.addresses && customer.profile.addresses.length > 0 && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Addresses ({customer.profile.addresses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customer.profile.addresses.map((address, index) => (
                    <div key={index} className="p-3 border rounded-lg text-sm">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-semibold capitalize">{address.SS_ADDRESS_TYPE}</span>
                        {address.SS_IS_DEFAULT && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium">{address.SS_FULL_NAME}</p>
                      <p className="text-muted-foreground">{address.SS_MOBILE_NUMBER}</p>
                      <p className="text-muted-foreground mt-1">{address.SS_STREET_ADDRESS}</p>
                      <p className="text-muted-foreground">
                        {address.SS_CITY}, {address.SS_STATE} - {address.SS_POSTAL_CODE}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Tabs Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden sm:inline">Orders</span>
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {customer.orders.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  <span className="hidden sm:inline">Reviews</span>
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {customer.reviews.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>
                      Latest {Math.min(5, customer.orders.length)} orders from this customer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {customer.orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <ShoppingBag className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold">{order.orderNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(order.date)} • {order.items.length} items
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{formatCurrency(order.totalAmount)}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge className={getOrderStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                              <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                                {order.paymentStatus}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      {customer.orders.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No orders found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Reviews */}
                {customer.reviews.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Reviews</CardTitle>
                      <CardDescription>
                        Latest reviews from this customer
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {customer.reviews.slice(0, 3).map((review) => (
                          <div key={review.id} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold">{review.productName}</h4>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="font-medium text-sm mb-1">{review.title}</p>
                            <p className="text-sm text-muted-foreground mb-2">{review.description}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{formatDate(review.date)}</span>
                              {review.isVerified && (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  Verified Purchase
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Favorite Categories */}
                {customer.analytics.favoriteCategories.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Favorite Categories</CardTitle>
                      <CardDescription>
                        Categories this customer shops from most
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {customer.analytics.favoriteCategories.map((category, index) => (
                          <div key={category._id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{category._id}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(category.totalSpent)}</p>
                              <p className="text-xs text-muted-foreground">{category.orderCount} orders</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>
                      Complete order history for this customer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {customer.orders.map((order) => (
                        <div key={order.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-lg">{order.orderNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(order.date)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600 text-lg">
                                {formatCurrency(order.totalAmount)}
                              </p>
                              <div className="flex gap-2 mt-1">
                                <Badge className={getOrderStatusColor(order.status)}>
                                  {order.status}
                                </Badge>
                                <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                                  {order.paymentStatus}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-500" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.quantity} × {formatCurrency(item.price)}
                                  </p>
                                </div>
                                <p className="font-semibold">{formatCurrency(item.total)}</p>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-end mt-3">
                            <Link href={`/admin/orders/${order.id}`}>
                              <Button variant="outline" size="sm">
                                View Order Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}

                      {customer.orders.length === 0 && (
                        <div className="text-center py-12">
                          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
                          <p className="text-muted-foreground">
                            This customer hasn't placed any orders yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Reviews</CardTitle>
                    <CardDescription>
                      All reviews submitted by this customer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {customer.reviews.map((review) => (
                        <div key={review.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-lg">{review.productName}</h4>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-5 h-5 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          
                          <p className="font-medium text-base mb-2">{review.title}</p>
                          <p className="text-muted-foreground mb-3">{review.description}</p>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <span className="text-muted-foreground">
                                {formatDate(review.date)}
                              </span>
                              {review.isVerified && (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified Purchase
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{review.helpfulCount} helpful</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {customer.reviews.length === 0 && (
                        <div className="text-center py-12">
                          <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-semibold mb-2">No Reviews Found</h3>
                          <p className="text-muted-foreground">
                            This customer hasn't submitted any reviews yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics">
                <div className="grid gap-6">
                  {/* Monthly Spending */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Spending Analysis</CardTitle>
                      <CardDescription>
                        Customer's spending pattern over the last 12 months
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {customer.analytics.monthlySpending.map((month) => (
                          <div key={month.period} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-semibold">{month.period}</p>
                              <p className="text-sm text-muted-foreground">
                                {month.orderCount} order{month.orderCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                {formatCurrency(month.totalSpent)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Avg: {formatCurrency(month.orderCount > 0 ? month.totalSpent / month.orderCount : 0)}
                              </p>
                            </div>
                          </div>
                        ))}

                        {customer.analytics.monthlySpending.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No spending data available</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Customer Lifetime Value */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Lifetime Value</CardTitle>
                      <CardDescription>
                        Overview of customer value and engagement
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <IndianRupee className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(customer.stats.totalSpent)}
                          </p>
                          <p className="text-sm text-blue-600">Total Lifetime Value</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <ShoppingBag className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-green-600">
                            {customer.stats.totalOrders}
                          </p>
                          <p className="text-sm text-green-600">Total Orders</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Customer Since:</span>
                          <span className="font-semibold">{formatDate(customer.joinDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Order Frequency:</span>
                          <span className="font-semibold">
                            {customer.stats.totalOrders > 0 
                              ? (customer.stats.totalOrders / Math.max(1, (new Date().getTime() - new Date(customer.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 30))).toFixed(1)
                              : 0
                            } orders/month
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Success Rate:</span>
                          <span className="font-semibold text-green-600">
                            {customer.stats.totalOrders > 0 
                              ? ((customer.stats.successfulOrders / customer.stats.totalOrders) * 100).toFixed(1)
                              : 0
                            }%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}