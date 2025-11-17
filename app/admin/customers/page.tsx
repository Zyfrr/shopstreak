"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Mail, Phone, User, ShoppingBag, IndianRupee, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface Customer {
  id: string;
  email: string;
  status: string;
  joinDate: string;
  onboardingStatus: string;
  profile: {
    firstName: string;
    lastName: string;
    mobile: string;
    gender: string;
    dateOfBirth: string;
    addresses: number;
  } | null;
  stats: {
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string | null;
    averageOrderValue: number;
  };
}

interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalRevenue: number;
}

export default function AdminCustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("joinDate")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [searchInput, setSearchInput] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Debounced search function
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // Set new timeout for debounced search
    if (value.trim() === "") {
      setSearchQuery("")
      setCurrentPage(1)
      setSearchLoading(false)
    } else {
      setSearchLoading(true)
      const timeout = setTimeout(() => {
        setSearchQuery(value.trim())
        setCurrentPage(1)
      }, 300)
      
      setSearchTimeout(timeout)
    }
  }, [searchTimeout])

  // Fetch customers when dependencies change
  const fetchCustomers = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminAccessToken")

      if (!token) {
        router.push("/admin/login")
        return
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        sortBy,
        sortOrder: "desc"
      })

      const response = await fetch(`/api/admin/customers?${params}`, {
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
        setCustomers(result.data.customers)
        setStats(result.data.stats) // Stats are now TOTAL (unfiltered)
        setTotalPages(result.data.pagination.totalPages)
        setTotalCustomers(result.data.pagination.total) // This is filtered total for display
      } else {
        console.error('❌ API Error:', result.error)
        toast.error(result.error || "Failed to fetch customers")
      }
    } catch (error) {
      console.error("❌ Fetch customers error:", error)
      toast.error("Failed to fetch customers")
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }, [currentPage, statusFilter, sortBy, searchQuery, router])

  // Initial load - fetch stats only once
  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  const handleClearSearch = () => {
    setSearchInput("")
    setSearchQuery("")
    setCurrentPage(1)
    setSearchLoading(false)
  }

  const handleStatusUpdate = async (customerId: string, newStatus: string) => {
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
        fetchCustomers() // Refresh the list
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
      year: "numeric"
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
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

  // Memoized customer count display
  const customerCountDisplay = useMemo(() => {
    if (searchLoading) {
      return "Searching..."
    }
    if (searchQuery || statusFilter !== "all") {
      return `Filtered Customers (${totalCustomers})`
    }
    return `All Customers (${totalCustomers})`
  }, [totalCustomers, searchLoading, searchQuery, statusFilter])

  if (loading && customers.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Customers Management</h1>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm lg:text-base">
              Manage and view all customer information
            </p>
          </div>
        </div>

        {/* Stats - ALWAYS show total counts (not filtered) */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs sm:text-sm truncate">Total Customers</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 truncate">
                      {stats.totalCustomers}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs sm:text-sm truncate">Active Customers</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 truncate">
                      {stats.activeCustomers}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs sm:text-sm truncate">Inactive Customers</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600 truncate">
                      {stats.inactiveCustomers}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs sm:text-sm truncate">Total Revenue</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 truncate">
                      {formatCurrency(stats.totalRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name, or phone number..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2 sm:gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="joinDate">Newest</SelectItem>
                    <SelectItem value="SS_USER_EMAIL">Email</SelectItem>
                    <SelectItem value="stats.totalSpent">Total Spent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Search Status */}
            <div className="mt-3 flex items-center justify-between">
              {searchQuery && (
                <p className="text-sm text-muted-foreground">
                  Showing results for: "<span className="font-medium">{searchQuery}</span>" • 
                  Found {customers.length} customer{customers.length !== 1 ? 's' : ''}
                </p>
              )}
              {searchLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  Searching...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <div className={searchLoading ? "opacity-50 transition-opacity duration-200" : ""}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg lg:text-xl">
                {customerCountDisplay}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {searchQuery || statusFilter !== "all" 
                  ? "Filtered customer results" 
                  : "List of all customers with their order history and details"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {/* Desktop Table */}
                <table className="w-full text-sm hidden sm:table">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold">Customer</th>
                      <th className="text-left py-3 px-4 font-semib">Contact</th>
                      <th className="text-left py-3 px-4 font-semibold">Orders</th>
                      <th className="text-left py-3 px-4 font-semibold">Total Spent</th>
                      <th className="text-left py-3 px-4 font-semibold">Joined</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {customer.profile ? 
                                `${customer.profile.firstName} ${customer.profile.lastName}` : 
                                'No Profile'
                              }
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 text-blue-600">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="text-xs truncate">{customer.email}</span>
                            </div>
                            {customer.profile?.mobile && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                <span className="text-xs truncate">{customer.profile.mobile}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="font-semibold text-sm">{customer.stats.totalOrders}</span>
                            <span className="text-xs text-muted-foreground">orders</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-3 h-3 text-green-600 flex-shrink-0" />
                            <span className="font-bold text-green-600 text-sm">
                              {formatCurrency(customer.stats.totalSpent)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Avg: {formatCurrency(customer.stats.averageOrderValue)}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {formatDate(customer.joinDate)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(customer.status)}`}
                          >
                            {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/customers/${customer.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-semibold hover:opacity-90 transition min-w-0 flex-1 justify-center"
                            >
                              <User className="w-3 h-3" />
                              View
                            </Link>
                            <Select
                              value={customer.status}
                              onValueChange={(value) => handleStatusUpdate(customer.id, value)}
                            >
                              <SelectTrigger className="w-20 h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="suspended">Suspend</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="space-y-3 p-3 sm:hidden">
                  {customers.map((customer) => (
                    <Card key={customer.id} className="w-full hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Customer Info */}
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-base truncate">
                                {customer.profile ? 
                                  `${customer.profile.firstName} ${customer.profile.lastName}` : 
                                  'No Profile'
                                }
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getStatusColor(customer.status)} flex-shrink-0 ml-2`}
                            >
                              {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                            </Badge>
                          </div>

                          {/* Contact & Stats */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Phone</p>
                              <p className="font-medium text-sm truncate">
                                {customer.profile?.mobile || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Orders</p>
                              <p className="font-medium text-sm flex items-center gap-1">
                                <ShoppingBag className="w-3 h-3" />
                                {customer.stats.totalOrders}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Total Spent</p>
                              <p className="font-medium text-green-600 text-sm flex items-center gap-1">
                                <IndianRupee className="w-3 h-3" />
                                {formatCurrency(customer.stats.totalSpent)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Joined</p>
                              <p className="font-medium text-sm">{formatDate(customer.joinDate)}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Link
                              href={`/admin/customers/${customer.id}`}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded text-sm font-semibold hover:opacity-90 transition min-w-0"
                            >
                              <User className="w-3 h-3" />
                              View Details
                            </Link>
                            <Select
                              value={customer.status}
                              onValueChange={(value) => handleStatusUpdate(customer.id, value)}
                            >
                              <SelectTrigger className="w-24 h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="suspended">Suspend</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Empty State */}
              {customers.length === 0 && !loading && (
                <div className="text-center py-8 sm:py-12">
                  <User className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4 opacity-50" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No Customers Found</h3>
                  <p className="text-muted-foreground text-sm mb-4 sm:mb-6 max-w-sm mx-auto">
                    {searchQuery || statusFilter !== "all" 
                      ? "Try adjusting your search or filters" 
                      : "No customers have registered yet"
                    }
                  </p>
                  {(searchQuery || statusFilter !== "all") && (
                    <Button
                      variant="outline"
                      onClick={handleClearSearch}
                      className="text-sm"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 sm:p-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="text-xs"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}