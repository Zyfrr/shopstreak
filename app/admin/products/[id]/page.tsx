// app/admin/products/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Calendar,
  Package,
  Tag,
  Star,
  Truck,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Product {
  _id: string;
  SS_ADMIN_VISIBLE: {
    SS_PRODUCT_NAME: string;
    SS_PRODUCT_DESCRIPTION: string;
    SS_CATEGORY: { _id: string; SS_CATEGORY_NAME: string; slug: string };
    SS_SUBCATEGORY: string;
    SS_BRAND: string;
    SS_COST_PRICE: number;
    SS_SELLING_PRICE: number;
    SS_DISCOUNT_PERCENTAGE: number;
    SS_STOCK_QUANTITY: number;
    SS_MIN_STOCK_ALERT: number;
    SS_TAX_RATE: number;
    SS_SUPPLIER_SKU: string;
    SS_RETURN_POLICY: string;
    SS_IS_ACTIVE: boolean;
    SS_IS_FEATURED: boolean;
    SS_PRODUCT_IMAGES: { url: string; alt: string; isPrimary: boolean }[];
  };
  SS_CUSTOMER_VISIBLE: {
    SS_PRODUCT_TITLE: string;
    SS_SHORT_DESCRIPTION: string;
    SS_HIGHLIGHTS: string[];
    SS_SPECIFICATIONS: Record<string, string>;
    SS_DELIVERY_ESTIMATE: { minDays: number; maxDays: number };
    SS_WARRANTY: string;
    SS_MAIN_IMAGE: string;
    SS_GALLERY_IMAGES: string[];
    SS_AVERAGE_RATING: number;
    SS_REVIEW_COUNT: number;
    SS_SOLD_COUNT: number;
  };
  SS_SEO_DATA: {
    metaTitle: string;
    metaDescription: string;
    slug: string;
  };
  SS_TAGS: string[];
  SS_CREATED_DATE: string;
  SS_UPDATED_DATE: string;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Replace the existing fetchProduct function with this:
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("adminAccessToken");

        if (!token) {
          router.push("/admin/login");
          return;
        }

        const productId = Array.isArray(params.id) ? params.id[0] : params.id;

        const response = await fetch(`/api/admin/products/${productId}`, {
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
          setProduct(result.data);
        } else {
          toast.error(result.error || "Failed to fetch product");
          router.push("/admin/products");
        }
      } catch (error) {
        console.error("Fetch product error:", error);
        toast.error("Failed to fetch product");
        router.push("/admin/products");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, router]);

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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const nextImage = () => {
    if (!product) return;
    setCurrentImageIndex((prev) =>
      prev === product.SS_ADMIN_VISIBLE.SS_PRODUCT_IMAGES.length - 1
        ? 0
        : prev + 1
    );
  };

  const prevImage = () => {
    if (!product) return;
    setCurrentImageIndex((prev) =>
      prev === 0
        ? product.SS_ADMIN_VISIBLE.SS_PRODUCT_IMAGES.length - 1
        : prev - 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <Button onClick={() => router.push("/admin/products")}>
          Back to Products
        </Button>
      </div>
    );
  }

  const images = product.SS_ADMIN_VISIBLE.SS_PRODUCT_IMAGES || [];
  const currentImage = images[currentImageIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/products")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {product.SS_ADMIN_VISIBLE.SS_PRODUCT_NAME}
            </h1>
            <p className="text-muted-foreground">
              {product.SS_CUSTOMER_VISIBLE.SS_PRODUCT_TITLE}
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/admin/products/${product._id}/edit`)}
          className="flex items-center gap-2"
        >
          <Edit2 className="w-4 h-4" />
          Edit Product
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Carousel */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              {images.length > 0 ? (
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={currentImage?.url}
                      alt={
                        currentImage?.alt ||
                        product.SS_ADMIN_VISIBLE.SS_PRODUCT_NAME
                      }
                      className="w-full h-full object-cover"
                    />

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={nextImage}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </>
                    )}

                    {/* Image Counter */}
                    {images.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                            index === currentImageIndex
                              ? "border-primary"
                              : "border-transparent"
                          }`}
                          onClick={() => goToImage(index)}
                        >
                          <img
                            src={image.url}
                            alt={image.alt}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No images available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Product Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">
                    {product.SS_ADMIN_VISIBLE.SS_PRODUCT_DESCRIPTION}
                  </p>
                </CardContent>
              </Card>

              {product.SS_CUSTOMER_VISIBLE.SS_HIGHLIGHTS?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Highlights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {product.SS_CUSTOMER_VISIBLE.SS_HIGHLIGHTS.map(
                        (highlight, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <span>{highlight}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="specifications" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(
                    product.SS_CUSTOMER_VISIBLE.SS_SPECIFICATIONS || {}
                  ).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(
                        product.SS_CUSTOMER_VISIBLE.SS_SPECIFICATIONS
                      ).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between py-2 border-b"
                        >
                          <span className="font-medium">{key}</span>
                          <span className="text-muted-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No specifications available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>SEO Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Meta Title</h4>
                    <p className="text-muted-foreground">
                      {product.SS_SEO_DATA.metaTitle || "Not set"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Meta Description</h4>
                    <p className="text-muted-foreground">
                      {product.SS_SEO_DATA.metaDescription || "Not set"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Slug</h4>
                    <p className="text-muted-foreground">
                      {product.SS_SEO_DATA.slug}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Product Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Status</span>
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
              </div>
              <div className="flex justify-between items-center">
                <span>Featured</span>
                <Badge
                  variant={
                    product.SS_ADMIN_VISIBLE.SS_IS_FEATURED
                      ? "default"
                      : "outline"
                  }
                >
                  {product.SS_ADMIN_VISIBLE.SS_IS_FEATURED ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Return Policy</span>
                <Badge variant="outline">
                  {product.SS_ADMIN_VISIBLE.SS_RETURN_POLICY?.replace(
                    "_",
                    " "
                  ) || "No return"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Cost Price</span>
                <span className="font-medium">
                  {formatPrice(product.SS_ADMIN_VISIBLE.SS_COST_PRICE)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Selling Price</span>
                <span className="font-medium text-green-600">
                  {formatPrice(product.SS_ADMIN_VISIBLE.SS_SELLING_PRICE)}
                </span>
              </div>
              {product.SS_ADMIN_VISIBLE.SS_DISCOUNT_PERCENTAGE > 0 && (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="font-medium text-red-600">
                    {product.SS_ADMIN_VISIBLE.SS_DISCOUNT_PERCENTAGE}%
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax Rate</span>
                <span>{product.SS_ADMIN_VISIBLE.SS_TAX_RATE}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Stock Quantity</span>
                <span
                  className={`font-medium ${
                    product.SS_ADMIN_VISIBLE.SS_STOCK_QUANTITY === 0
                      ? "text-red-600"
                      : product.SS_ADMIN_VISIBLE.SS_STOCK_QUANTITY <=
                        product.SS_ADMIN_VISIBLE.SS_MIN_STOCK_ALERT
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {product.SS_ADMIN_VISIBLE.SS_STOCK_QUANTITY}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Low Stock Alert</span>
                <span>{product.SS_ADMIN_VISIBLE.SS_MIN_STOCK_ALERT}</span>
              </div>
              <div className="flex justify-between">
                <span>Supplier SKU</span>
                <span className="font-mono text-sm">
                  {product.SS_ADMIN_VISIBLE.SS_SUPPLIER_SKU || "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span>
                  Category:{" "}
                  {product.SS_ADMIN_VISIBLE.SS_CATEGORY?.SS_CATEGORY_NAME}
                </span>
              </div>
              {product.SS_ADMIN_VISIBLE.SS_SUBCATEGORY && (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span>
                    Subcategory: {product.SS_ADMIN_VISIBLE.SS_SUBCATEGORY}
                  </span>
                </div>
              )}
              {product.SS_ADMIN_VISIBLE.SS_BRAND && (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span>Brand: {product.SS_ADMIN_VISIBLE.SS_BRAND}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-muted-foreground" />
                <span>
                  Delivery:{" "}
                  {product.SS_CUSTOMER_VISIBLE.SS_DELIVERY_ESTIMATE.minDays}-
                  {product.SS_CUSTOMER_VISIBLE.SS_DELIVERY_ESTIMATE.maxDays}{" "}
                  days
                </span>
              </div>
              {product.SS_CUSTOMER_VISIBLE.SS_WARRANTY && (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span>
                    Warranty: {product.SS_CUSTOMER_VISIBLE.SS_WARRANTY}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-muted-foreground" />
                <span>
                  Rating: {product.SS_CUSTOMER_VISIBLE.SS_AVERAGE_RATING || 0}/5
                  ({product.SS_CUSTOMER_VISIBLE.SS_REVIEW_COUNT || 0} reviews)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Created: {formatDate(product.SS_CREATED_DATE)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Updated: {formatDate(product.SS_UPDATED_DATE)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {product.SS_TAGS?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.SS_TAGS.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
