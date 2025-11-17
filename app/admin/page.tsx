// app/admin/page.js
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Download, Users, ShoppingCart, Package, TrendingUp, Mail, Phone, MapPin, DollarSign, Activity, Eye, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-purple-100 text-purple-800 border-purple-200",
  shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-gray-100 text-gray-800 border-gray-200",
}

export default function AdminDashboard() {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("month")

  useEffect(() => {
    fetchDashboardData()
  }, [period])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("adminAccessToken")

      if (!token) {
        router.push("/admin/login")
        return
      }

      const response = await fetch(`/api/admin/dashboard?period=${period}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        localStorage.removeItem("adminAccessToken")
        router.push("/admin/login")
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        console.log('Dashboard data received:', result.data)
        setData(result.data)
      } else {
        console.error('Failed to fetch dashboard data:', result.error)
        // Set empty data to prevent crashes
        setData({
          stats: {
            totalRevenue: 0,
            totalOrders: 0,
            totalCustomers: 0,
            totalProducts: 0,
            period
          },
          revenueTrend: [],
          recentOrders: [],
          topProducts: []
        })
      }
    } catch (error) {
      console.error("Fetch dashboard error:", error)
      // Set empty data to prevent crashes
      setData({
        stats: {
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalProducts: 0,
          period
        },
        revenueTrend: [],
        recentOrders: [],
        topProducts: []
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  // Loading skeleton
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // Safe data access
  const stats = data?.stats || {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    period
  }

  const revenueTrend = data?.revenueTrend || []
  const recentOrders = data?.recentOrders || []
  const topProducts = data?.topProducts || []

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Business overview and product performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Refresh
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue Card */}
          <Card className="relative overflow-hidden border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground mt-2">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <p className="text-xs text-green-600">Last {stats.period}</p>
                  </div>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders Card */}
          <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground mt-2">
                    {stats.totalOrders.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <p className="text-xs text-blue-600">Last {stats.period}</p>
                  </div>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customers Card */}
          <Card className="relative overflow-hidden border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Customers</p>
                  <p className="text-2xl font-bold text-foreground mt-2">
                    {stats.totalCustomers.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Users className="w-4 h-4 text-purple-500" />
                    <p className="text-xs text-purple-600">Last {stats.period}</p>
                  </div>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-full">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Card */}
          <Card className="relative overflow-hidden border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Products</p>
                  <p className="text-2xl font-bold text-foreground mt-2">
                    {stats.totalProducts.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Package className="w-4 h-4 text-orange-500" />
                    <p className="text-xs text-orange-600">Last {stats.period}</p>
                  </div>
                </div>
                <div className="p-3 bg-orange-500/10 rounded-full">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>
                Revenue performance over {period}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="period" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>
                Best selling products by revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <span className="text-sm font-bold text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{product.views} views</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs text-muted-foreground">{product.rating}/5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(product.sales)}</p>
                      <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                    </div>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No product data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Latest customer orders with contact information
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/admin/orders')}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Order Number</TableHead>
                    <TableHead className="min-w-[160px]">Customer Details</TableHead>
                    <TableHead className="min-w-[140px]">Contact Info</TableHead>
                    <TableHead className="text-right w-[100px]">Amount</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="text-right w-[120px]">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      {/* Order Number Column */}
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{order.orderNumber}</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {order.paymentMethod}
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Customer Details Column */}
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <span className="font-medium text-foreground text-sm">
                            {order.customer}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {order.customerEmail}
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Contact Information Column - FIXED PHONE NUMBER */}
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm">
                              {order.customerPhone && order.customerPhone !== 'Not provided' 
                                ? order.customerPhone 
                                : 'No phone'
                              }
                            </span>
                          </div>
                          {order.customerAddress && order.customerAddress !== "Address not provided" && (
  <div className="flex items-start gap-1 text-xs text-muted-foreground max-w-[220px]">
    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />

    {/* Address formatted into two clean lines */}
    <div className="flex flex-col leading-tight">
      {(() => {
        const parts = order.customerAddress.split(",").map((p) => p.trim());

        if (parts.length <= 2) {
          // If short address → show whole in one line
          return <span className="line-clamp-2">{order.customerAddress}</span>;
        }

        // For long addresses → split into 2 lines
        const line1 = parts.slice(0, 3).join(", ");
        const line2 = parts.slice(2).join(", ");

        return (
          <>
            <span className="line-clamp-1">{line1}</span>
            <span className="line-clamp-1">{line2}</span>
          </>
        );
      })()}
    </div>
  </div>
)}

                        </div>
                      </TableCell>
                      
                      {/* Amount Column */}
                      <TableCell className="text-right">
                        <span className="font-semibold text-foreground text-sm">
                          {formatCurrency(order.amount)}
                        </span>
                      </TableCell>
                      
                      {/* Status Column */}
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`capitalize font-medium text-xs ${
                            statusColors[order.status] || statusColors.pending
                          }`}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      
                      {/* Date Column */}
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium">
                            {formatDate(order.date)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(order.date)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {recentOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ShoppingCart className="w-12 h-12 opacity-50" />
                          <p className="text-lg font-medium">No recent orders</p>
                          <p className="text-sm">Orders will appear here once they are placed</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}