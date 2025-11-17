// app/admin/products/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FolderOpen,
  Settings,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Product {
  _id: string;
  SS_ADMIN_VISIBLE: {
    SS_PRODUCT_NAME: string;
    SS_CATEGORY: { _id: string; SS_CATEGORY_NAME: string; slug: string };
    SS_SELLING_PRICE: number;
    SS_COST_PRICE: number;
    SS_STOCK_QUANTITY: number;
    SS_IS_ACTIVE: boolean;
    SS_IS_FEATURED: boolean;
    SS_PRODUCT_IMAGES: { url: string; alt: string; isPrimary: boolean }[];
  };
  SS_CUSTOMER_VISIBLE: {
    SS_PRODUCT_TITLE: string;
    SS_AVERAGE_RATING: number;
    SS_SOLD_COUNT: number;
  };
  SS_SALES_DATA?: {
    TOTAL_SOLD: number;
    TOTAL_REVENUE: number;
    LAST_SOLD_DATE?: string;
  };
  SS_CREATED_DATE: string;
}

interface Category {
  _id: string;
  SS_CATEGORY_NAME: string;
  SS_CATEGORY_DESCRIPTION?: string;
  slug: string;
  SS_IS_ACTIVE: boolean;
  SS_PRODUCT_COUNT: number;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Category Management State
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Add this useEffect for auth check at the top of the component
useEffect(() => {
  const checkAuth = async () => {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    
    // Verify token is valid
    try {
      const response = await fetch('/api/admin/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('adminAccessToken');
        router.push('/admin/login');
        return;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('adminAccessToken');
      router.push('/admin/login');
    }
  };

  checkAuth();
}, [router]);

  // In your admin products page - Update the fetch functions
const fetchProducts = async () => {
  try {
    setLoading(true);
    // Use the correct token name consistently
    const token = localStorage.getItem("adminAccessToken");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: "10",
      ...(searchQuery && { search: searchQuery }),
      ...(statusFilter !== "all" && { status: statusFilter }),
      sortBy:
        sortBy === "sales" ? "SS_SALES_DATA.TOTAL_SOLD" : "SS_CREATED_DATE",
      sortOrder: sortBy === "sales" ? "desc" : "desc",
    });

    const response = await fetch(`/api/admin/products?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      localStorage.removeItem("adminAccessToken");
      router.push("/admin/login");
      return;
    }

    const result = await response.json();

    if (result.success) {
      setProducts(result.data.products);
      setTotalPages(result.data.pagination.totalPages);
      setTotalProducts(result.data.pagination.total);
    } else {
      toast.error(result.error || "Failed to fetch products");
    }
  } catch (error) {
    console.error("Fetch products error:", error);
    toast.error("Failed to fetch products");
  } finally {
    setLoading(false);
  }
};

// Similarly update fetchCategories function
const fetchCategories = async () => {
  try {
    setCategoriesLoading(true);
    const token = localStorage.getItem("adminAccessToken");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    const response = await fetch(
      "/api/admin/categories?includeInactive=true",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 401) {
      localStorage.removeItem("adminAccessToken");
      router.push("/admin/login");
      return;
    }

    if (response.ok) {
      const result = await response.json();
      setCategories(result.data?.categories || []);
    } else {
      toast.error("Failed to fetch categories");
    }
  } catch (error) {
    console.error("Fetch categories error:", error);
    toast.error("Failed to fetch categories");
  } finally {
    setCategoriesLoading(false);
  }
};

  useEffect(() => {
    if (activeTab === "products") {
      fetchProducts();
    } else {
      fetchCategories();
    }
  }, [activeTab, searchQuery, statusFilter, sortBy, currentPage]);

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    setCategoryLoading(true);
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          SS_CATEGORY_NAME: newCategoryName.trim(),
          SS_CATEGORY_DESCRIPTION: newCategoryDescription.trim(),
          SS_IS_ACTIVE: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Category created successfully");
        setNewCategoryName("");
        setNewCategoryDescription("");
        fetchCategories();
      } else {
        toast.error(result.error || "Failed to create category");
      }
    } catch (error) {
      console.error("Create category error:", error);
      toast.error("Failed to create category");
    } finally {
      setCategoryLoading(false);
    }
  };

  // Update category
  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.SS_CATEGORY_NAME.trim()) {
      toast.error("Category name is required");
      return;
    }

    setCategoryLoading(true);
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await fetch(
        `/api/admin/categories/${editingCategory._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            SS_CATEGORY_NAME: editingCategory.SS_CATEGORY_NAME.trim(),
            SS_CATEGORY_DESCRIPTION:
              editingCategory.SS_CATEGORY_DESCRIPTION?.trim(),
            SS_IS_ACTIVE: editingCategory.SS_IS_ACTIVE,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Category updated successfully");
        setEditingCategory(null);
        fetchCategories();
      } else {
        toast.error(result.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Update category error:", error);
      toast.error("Failed to update category");
    } finally {
      setCategoryLoading(false);
    }
  };

  // Update the categories section in your products page with these enhanced functions:

  // Enhanced category functions for the products page
  const handleDeleteCategory = async (
    categoryId: string,
    categoryName: string
  ) => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || "Category deleted successfully");
        fetchCategories();
      } else {
        toast.error(result.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Delete category error:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleToggleCategoryStatus = async (
    categoryId: string,
    currentStatus: boolean
  ) => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          SS_IS_ACTIVE: !currentStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          result.message ||
            `Category ${
              !currentStatus ? "activated" : "deactivated"
            } successfully`
        );
        fetchCategories();
      } else {
        toast.error(result.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Toggle category status error:", error);
      toast.error("Failed to update category");
    }
  };
  // Product actions
  const handleDeleteProduct = async (productId: string) => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Product deleted successfully");
        fetchProducts();
      } else {
        toast.error(result.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Delete product error:", error);
      toast.error("Failed to delete product");
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0)
      return { label: "Out of Stock", variant: "destructive" as const };
    if (quantity <= 10)
      return { label: "Low Stock", variant: "warning" as const };
    return { label: "In Stock", variant: "success" as const };
  };

  const handleViewProduct = (productId: string) => {
  if (!productId) {
    toast.error('Invalid product ID');
    return;
  }
  console.log('Navigating to product:', productId);
  router.push(`/admin/products/${productId}`);
};

const handleEditProduct = (productId: string) => {
  if (!productId) {
    toast.error('Invalid product ID');
    return;
  }
  console.log('Navigating to edit product:', productId);
  router.push(`/admin/products/${productId}/edit`);
};
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    if (activeTab === "products") {
      fetchProducts();
    }
  };

  const getTotalSales = (product: Product) => {
    return (
      product.SS_SALES_DATA?.TOTAL_SOLD ||
      product.SS_CUSTOMER_VISIBLE.SS_SOLD_COUNT ||
      0
    );
  };

  const getTotalRevenue = (product: Product) => {
    return (
      product.SS_SALES_DATA?.TOTAL_REVENUE ||
      getTotalSales(product) * product.SS_ADMIN_VISIBLE.SS_SELLING_PRICE
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {activeTab === "products" ? "Products" : "Categories"}
          </h1>
          <p className="text-muted-foreground">
            {activeTab === "products"
              ? "Manage your product inventory and listings"
              : "Manage product categories and organization"}
          </p>
        </div>
        {activeTab === "products" ? (
          <Button
            onClick={() => router.push("/admin/products/new")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={() => setActiveTab("products")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              View Products
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Products ({totalProducts})
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Categories ({categories.length})
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters & Search</CardTitle>
              <CardDescription>
                Find products quickly with filters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products by name, title, or slug..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit">Search</Button>
                </form>

                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Newest</SelectItem>
                      <SelectItem value="sales">Top Selling</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Products ({totalProducts})
                {loading && (
                  <span className="text-sm text-muted-foreground ml-2">
                    Loading...
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                List of all products in your store
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && products.length === 0 ? (
                // Loading skeleton
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                // Empty state
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No products found
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "Get started by adding your first product"}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Button onClick={() => router.push("/admin/products/new")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Table for desktop */}
                  <div className="rounded-md border hidden sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Stock</TableHead>
                          <TableHead className="text-right">Sales</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => {
                          const stockStatus = getStockStatus(
                            product.SS_ADMIN_VISIBLE.SS_STOCK_QUANTITY
                          );
                          const primaryImage =
                            product.SS_ADMIN_VISIBLE.SS_PRODUCT_IMAGES?.find(
                              (img) => img.isPrimary
                            ) ||
                            product.SS_ADMIN_VISIBLE.SS_PRODUCT_IMAGES?.[0];
                          const totalSales = getTotalSales(product);
                          const totalRevenue = getTotalRevenue(product);

                          return (
                            <TableRow key={product._id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {primaryImage ? (
                                    <img
                                      src={primaryImage.url}
                                      alt={primaryImage.alt}
                                      className="w-10 h-10 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                      <span className="text-xs text-muted-foreground">
                                        No image
                                      </span>
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium truncate">
                                      {product.SS_ADMIN_VISIBLE.SS_PRODUCT_NAME}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {
                                        product.SS_CUSTOMER_VISIBLE
                                          .SS_PRODUCT_TITLE
                                      }
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {product.SS_ADMIN_VISIBLE.SS_CATEGORY
                                    ?.SS_CATEGORY_NAME || "Uncategorized"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="space-y-1">
                                  <p className="font-medium">
                                    {formatPrice(
                                      product.SS_ADMIN_VISIBLE.SS_SELLING_PRICE
                                    )}
                                  </p>
                                  {product.SS_ADMIN_VISIBLE.SS_COST_PRICE >
                                    0 && (
                                    <p className="text-xs text-muted-foreground line-through">
                                      {formatPrice(
                                        product.SS_ADMIN_VISIBLE.SS_COST_PRICE
                                      )}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="space-y-1">
                                  <p>
                                    {product.SS_ADMIN_VISIBLE.SS_STOCK_QUANTITY}
                                  </p>
                                  <Badge
                                    variant={stockStatus.variant}
                                    className="text-xs"
                                  >
                                    {stockStatus.label}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                                  <span className="font-medium">
                                    {totalSales}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-medium text-green-600">
                                  {formatPrice(totalRevenue)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge
                                    variant={
                                      product.SS_ADMIN_VISIBLE.SS_IS_ACTIVE
                                        ? "success"
                                        : "secondary"
                                    }
                                  >
                                    {product.SS_ADMIN_VISIBLE.SS_IS_ACTIVE
                                      ? "Active"
                                      : "Inactive"}
                                  </Badge>
                                  {product.SS_ADMIN_VISIBLE.SS_IS_FEATURED && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatDate(product.SS_CREATED_DATE)}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleViewProduct(product._id)
                                    }
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleEditProduct(product._id)
                                    }
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Are you sure?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will mark the product as
                                          inactive. You can reactivate it later.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDeleteProduct(product._id)
                                          }
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile cards */}
                  <div className="space-y-4 sm:hidden w-full">
                    {products.map((product) => {
                      const stockStatus = getStockStatus(
                        product.SS_ADMIN_VISIBLE.SS_STOCK_QUANTITY
                      );

                      const primaryImage =
                        product.SS_ADMIN_VISIBLE.SS_PRODUCT_IMAGES?.find(
                          (img) => img.isPrimary
                        ) || product.SS_ADMIN_VISIBLE.SS_PRODUCT_IMAGES?.[0];

                      const totalSales = getTotalSales(product);
                      const totalRevenue = getTotalRevenue(product);

                      return (
                        <Card key={product._id} className="w-full rounded-xl">
                          <CardContent className="p-4">
                            {/* TOP ROW */}
                            <div className="flex gap-3 w-full">
                              {/* IMAGE */}
                              {primaryImage ? (
                                <img
                                  src={primaryImage.url}
                                  alt={primaryImage.alt}
                                  className="w-20 h-20 rounded-md object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs text-muted-foreground">
                                    No image
                                  </span>
                                </div>
                              )}

                              {/* TEXT CONTENT */}
                              <div className="flex-1 min-w-0">
                                {/* TITLE */}
                                <h3 className="font-semibold text-base break-words leading-tight">
                                  {product.SS_ADMIN_VISIBLE.SS_PRODUCT_NAME}
                                </h3>

                                {/* SUBTITLE */}
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {product.SS_CUSTOMER_VISIBLE.SS_PRODUCT_TITLE}
                                </p>

                                {/* BADGES */}
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {product.SS_ADMIN_VISIBLE.SS_CATEGORY
                                      ?.SS_CATEGORY_NAME || "Uncategorized"}
                                  </Badge>

                                  <Badge
                                    variant={stockStatus.variant}
                                    className="text-xs"
                                  >
                                    {stockStatus.label}
                                  </Badge>
                                </div>

                                {/* PRICE + SALES */}
                                <div className="grid grid-cols-1 gap-3 mt-3 w-full">
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Price
                                    </p>
                                    <p className="font-semibold text-[15px] leading-tight">
                                      {formatPrice(
                                        product.SS_ADMIN_VISIBLE
                                          .SS_SELLING_PRICE
                                      )}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Sales
                                    </p>
                                    <div className="flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3 text-muted-foreground" />
                                      <span className="font-semibold">
                                        {totalSales}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* REVENUE + ACTION BUTTONS */}
                                <div className="mt-3 w-full flex flex-col gap-3">
                                  {/* REVENUE — stays on top */}
                                  <p className="text-sm text-green-600 font-semibold">
                                    {formatPrice(totalRevenue)}
                                  </p>

                                  {/* ACTION BUTTONS — below revenue in a single row */}
                                  <div className="grid grid-cols-3 mt-3 flex gap-3 flex-row flex-wrap">
                                    {/* VIEW */}
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="w-9 h-9"
                                      onClick={() =>
                                        handleViewProduct(product._id)
                                      }
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>

                                    {/* EDIT */}
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="w-9 h-9"
                                      onClick={() =>
                                        handleEditProduct(product._id)
                                      }
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>

                                    {/* DELETE */}
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="destructive"
                                          size="icon"
                                          className="w-9 h-9"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>

                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Are you sure?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will mark the product inactive.
                                            You can reactivate later.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>

                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleDeleteProduct(product._id)
                                            }
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          {/* Add Category Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Category</CardTitle>
              <CardDescription>
                Create a new product category to organize your products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="categoryName" className="text-sm font-medium">
                    Category Name *
                  </label>
                  <Input
                    id="categoryName"
                    placeholder="Enter category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="categoryDescription"
                    className="text-sm font-medium"
                  >
                    Description
                  </label>
                  <Input
                    id="categoryDescription"
                    placeholder="Enter category description"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={handleAddCategory}
                disabled={categoryLoading || !newCategoryName.trim()}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {categoryLoading ? "Adding Category..." : "Add Category"}
              </Button>
            </CardContent>
          </Card>

          {/* Categories List */}
          <Card>
            <CardHeader>
              <CardTitle>All Categories ({categories.length})</CardTitle>
              <CardDescription>
                Manage your product categories. Inactive categories won't be
                visible to customers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    No categories found
                  </h3>
                  <p className="text-muted-foreground">
                    Get started by creating your first category
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div
                      key={category._id}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border rounded-lg"
                    >
                      {/* LEFT SIDE */}
                      <div className="flex items-start md:items-center gap-4 w-full">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                          <Tag className="w-5 h-5 text-primary" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold break-words">
                              {category.SS_CATEGORY_NAME}
                            </h3>
                            <Badge
                              variant={
                                category.SS_IS_ACTIVE ? "success" : "secondary"
                              }
                            >
                              {category.SS_IS_ACTIVE ? "Active" : "Inactive"}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground break-words">
                            {category.SS_CATEGORY_DESCRIPTION ||
                              "No description"}
                          </p>

                          <p className="text-xs text-muted-foreground break-words">
                            {category.SS_PRODUCT_COUNT || 0} products • Slug:{" "}
                            {category.slug}
                          </p>
                        </div>
                      </div>

                      {/* RIGHT SIDE - BUTTONS */}
                      <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 md:flex-none"
                          onClick={() => setEditingCategory(category)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>

                        <Button
                          variant={
                            category.SS_IS_ACTIVE ? "outline" : "default"
                          }
                          size="sm"
                          className="flex-1 md:flex-none"
                          onClick={() =>
                            handleToggleCategoryStatus(
                              category._id,
                              category.SS_IS_ACTIVE
                            )
                          }
                        >
                          {category.SS_IS_ACTIVE ? "Deactivate" : "Activate"}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1 md:flex-none"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Category
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will mark the category as inactive.
                                Products in this category remain, but customers
                                won’t see them unless reactivated.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteCategory(
                                    category._id,
                                    category.SS_CATEGORY_NAME
                                  )
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Category Dialog */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Category</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category Name *</label>
                <Input
                  value={editingCategory.SS_CATEGORY_NAME}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      SS_CATEGORY_NAME: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={editingCategory.SS_CATEGORY_DESCRIPTION || ""}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      SS_CATEGORY_DESCRIPTION: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="categoryActive"
                  checked={editingCategory.SS_IS_ACTIVE}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      SS_IS_ACTIVE: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <label htmlFor="categoryActive" className="text-sm">
                  Category is active
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setEditingCategory(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCategory}
                disabled={categoryLoading}
                className="flex-1"
              >
                {categoryLoading ? "Updating..." : "Update Category"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
