// app/product/[id]/page.jsx - COMPLETE UPDATED VERSION
"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Heart,
  Share2,
  ArrowLeft,
  ShoppingCart,
  Star,
  ChevronRight,
  Truck,
  Shield,
  Clock,
  Ban,
  Check,
  MessageSquare,
} from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useCart } from "@/components/contexts/cart-context";
import { ReviewCard } from "@/components/shared/review-card";
import { ReviewForm } from "@/components/shared/review-form";
import { ImageCarousel } from "@/components/shared/image-carousel";
import { useAuth } from "@/components/contexts/auth-context";
import { useToast } from "@/components/providers/toast-provider";

interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  images: string[];
  rating: number;
  reviews: number;
  specifications: any;
  highlights: string[];
  features: string[];
  deliveryEstimate: { minDays: number; maxDays: number };
  warranty: string;
  noReturn: boolean;
  badge?: string;
  variants: any[];
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  unhelpful: number;
  createdAt: string;
  adminResponse?: {
    response: string;
    respondedAt: string;
  };
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [showShareModal, setShowShareModal] = useState(false);

  // Review states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState({
    average: 0,
    total: 0,
    distribution: [] as any[],
  });
  const [reviewPagination, setReviewPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    pages: 0,
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [editReview, setEditReview] = useState<Review | null>(null);

  const { addItem } = useCart();
  const { isAuthenticated, user } = useAuth();

  // Fetch product and initial reviews
  useEffect(() => {
    if (productId) {
      fetchProduct();
      checkWishlistStatus();
      fetchReviews(1, 5); // Fetch reviews with proper limit
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();

      if (data.success) {
        const productData = data.data.product;
        const mainImage = productData.mainImage;
        const galleryImages = productData.images || [];

        // Remove main image from gallery images to avoid duplicates
        const uniqueImages = galleryImages.filter(
          (img: string, index: number, arr: string[]) =>
            img !== mainImage && arr.indexOf(img) === index
        );

        // Always include main image as first image
        const finalImages = mainImage
          ? [mainImage, ...uniqueImages]
          : uniqueImages;

        setProduct({
          ...productData,
          images: finalImages,
        });
        setRelatedProducts(data.data.relatedProducts || []);
      } else {
        setError(data.error || "Product not found");
      }
    } catch (err) {
      setError("Failed to fetch product");
      console.error("Error fetching product:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = useCallback(
    async (page = 1, limit = 5) => {
      if (!productId) return;

      setReviewsLoading(true);
      try {
        console.log(
          `🔄 Fetching reviews for product ${productId}, page ${page}`
        );

        const response = await fetch(
          `/api/products/review?productId=${productId}&page=${page}&limit=${limit}&sortBy=recent`
        );

        if (!response.ok) {
          // Don't throw error, just handle gracefully
          console.warn(`⚠️ Reviews API returned status: ${response.status}`);
          setReviews([]);
          setReviewStats({ average: 0, total: 0, distribution: [] });
          return;
        }

        const result = await response.json();
        console.log("📥 Reviews API response:", result);

        if (result.success) {
          const reviewsData = result.data.reviews || [];
          const summaryData = result.data.summary || {
            average: 0,
            total: 0,
            distribution: [],
          };
          const paginationData = result.data.pagination || {
            page: 1,
            limit: 5,
            total: 0,
            pages: 0,
          };

          console.log("✅ Setting reviews:", reviewsData);
          console.log("✅ Setting review stats:", summaryData);

          setReviews(reviewsData);
          setReviewStats(summaryData);
          setReviewPagination(paginationData);
        } else {
          console.error("Failed to fetch reviews:", result.error);
          setReviews([]);
          setReviewStats({ average: 0, total: 0, distribution: [] });
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviews([]);
        setReviewStats({ average: 0, total: 0, distribution: [] });
      } finally {
        setReviewsLoading(false);
      }
    },
    [productId]
  );

  const checkWishlistStatus = async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const isInWishlist = result.data.items.some(
            (item: any) => item.id === productId
          );
          setIsWishlisted(isInWishlist);
        }
      }
    } catch (error) {
      console.error("Error checking wishlist status:", error);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    try {
      await addItem(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0],
        },
        quantity
      );

      // Show success feedback
      const button = document.querySelector(".add-to-cart-btn");
      if (button) {
        const originalContent = button.innerHTML;
        button.innerHTML = '<Check className="w-5 h-5" /> Added to Cart';
        button.classList.add("bg-green-600");

        setTimeout(() => {
          button.innerHTML = originalContent;
          button.classList.remove("bg-green-600");
        }, 2000);
      }
    } catch (error: any) {
      alert(error.message || "Failed to add item to cart");
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    setWishlistLoading(true);
    try {
      const token = localStorage.getItem("accessToken");

      if (isWishlisted) {
        // Remove from wishlist
        const response = await fetch(`/api/wishlist?productId=${productId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();
        if (result.success) {
          setIsWishlisted(false);
          addToast({
            type: "success",
            title: "Removed from Wishlist",
            message: "Product removed from your wishlist",
            duration: 3000,
          });
        }
      } else {
        // Add to wishlist
        const response = await fetch("/api/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        });

        const result = await response.json();
        if (result.success) {
          setIsWishlisted(true);
          addToast({
            type: "success",
            title: "Added to Wishlist",
            message: "Product added to your wishlist",
            duration: 3000,
          });
        }
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      addToast({
        type: "error",
        title: "Wishlist Error",
        message: "Failed to update wishlist",
        duration: 5000,
      });
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddReview = () => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // REMOVED: Check for existing review - Allow multiple reviews
    // Always open new review form
    setEditReview(null);
    setShowReviewForm(true);
  };

  const handleEditReview = (review: Review) => {
    setEditReview(review);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/products/review/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        // Refresh reviews
        fetchReviews(reviewPagination.page);
        addToast({
          type: "success",
          title: "Review Deleted",
          message: "Your review has been deleted successfully",
          duration: 3000,
        });
      } else {
        addToast({
          type: "error",
          title: "Delete Failed",
          message: result.error || "Failed to delete review",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      addToast({
        type: "error",
        title: "Delete Failed",
        message: "Failed to delete review. Please try again.",
        duration: 5000,
      });
    }
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    setEditReview(null);

    addToast({
      type: "success",
      title: "Review submitted",
      message: editReview
        ? "Review updated successfully"
        : "Review submitted successfully",
      duration: 3000,
    });

    // Refresh all data with a small delay
    setTimeout(() => {
      fetchReviews(reviewPagination.page);
      fetchProduct(); // Refresh product to update rating
    }, 500);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.shortDescription,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      setShowShareModal(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast({
      type: "success",
      title: "Link Copied",
      message: "Product link copied to clipboard!",
      duration: 3000,
    });
    setShowShareModal(false);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!product) return;

    const maxQuantity = Math.min(10, product.stock);
    setQuantity(Math.max(1, Math.min(newQuantity, maxQuantity)));
  };

  // Calculate rating percentages for display
  const getRatingPercentage = (rating: number) => {
    if (!reviewStats?.distribution || reviewStats.total === 0) return 0;
    const ratingData = reviewStats.distribution.find(
      (d: any) => d.rating === rating
    );
    return ratingData ? ratingData.percentage : 0;
  };

  const getRatingCount = (rating: number) => {
    if (!reviewStats?.distribution || reviewStats.total === 0) return 0 + "review";
    const ratingData = reviewStats.distribution.find(
      (d: any) => d.rating === rating
    );
    return ratingData ? ratingData.count : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-muted rounded-xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-6 bg-muted rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {error || "Product not found"}
          </p>
          <Link href="/product" className="text-primary hover:underline">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const maxQuantity = Math.min(10, product.stock);

  const renderReviewsContent = () => (
    <div className="space-y-6">
      {/* Review Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-bold mb-2">Customer Reviews</h3>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                {reviewStats.average.toFixed(1)}
              </div>
              <div className="flex items-center gap-1 justify-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(reviewStats.average)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {reviewStats.total} review{reviewStats.total !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const percentage = getRatingPercentage(rating);
                const count = getRatingCount(rating);

                return (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-4">{rating}</span>
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={handleAddReview}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Write a Review
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviewsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading reviews...</p>
          </div>
        ) : reviews.length > 0 ? (
          <>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onEdit={
                  isAuthenticated && user?.id === review.userId
                    ? handleEditReview
                    : undefined
                }
                onDelete={
                  isAuthenticated && user?.id === review.userId
                    ? handleDeleteReview
                    : undefined
                }
              />
            ))}

            {/* Pagination */}
            {reviewPagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-6">
                <button
                  onClick={() => fetchReviews(reviewPagination.page - 1)}
                  disabled={reviewPagination.page <= 1}
                  className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="text-sm text-muted-foreground">
                  Page {reviewPagination.page} of {reviewPagination.pages}
                </span>

                <button
                  onClick={() => fetchReviews(reviewPagination.page + 1)}
                  disabled={reviewPagination.page >= reviewPagination.pages}
                  className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h4 className="text-lg font-semibold mb-2">No Reviews Yet</h4>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Be the first to share your experience with this product!
            </p>
            <button
              onClick={handleAddReview}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
            >
              Write First Review
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/product"
              className="flex items-center gap-2 text-primary hover:underline text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground truncate">
              {product.category}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm truncate">{product.name}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Product Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Images with Carousel */}
          <div>
            <ImageCarousel images={product.images} productName={product.name} />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                {product.category}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(reviewStats.average || product.rating)
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">
                    {reviewStats.average.toFixed(1) || product.rating}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  ({reviewStats.total || product.reviews} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="space-y-2 mb-4">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl md:text-4xl font-bold text-primary">
                    ₹{product.price}
                  </span>
                  {product.originalPrice && (
                    <>
                      <span className="text-xl text-muted-foreground line-through">
                        ₹{product.originalPrice}
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Inclusive of all taxes
                </p>
              </div>

              {/* Stock Status */}
              <div
                className={`text-sm font-medium mb-6 ${
                  product.stock > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {product.stock > 0
                  ? `✓ ${product.stock} in stock`
                  : "Out of stock"}
              </div>
            </div>

            {/* Short Description */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm leading-relaxed">
                {product.shortDescription || product.description}
              </p>
            </div>

            {/* Quantity & Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center gap-2 bg-card border border-border p-2 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= maxQuantity}
                    className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                {maxQuantity > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Max {maxQuantity} per order
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 add-to-cart-btn bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>

                <button
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                  className={`p-4 rounded-xl border transition ${
                    isWishlisted
                      ? "bg-red-50 border-red-200 text-red-600"
                      : "bg-card border-border hover:bg-muted"
                  } ${wishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Heart
                    className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`}
                  />
                </button>

                <button
                  onClick={handleShare}
                  className="p-4 rounded-xl bg-card border border-border hover:bg-muted transition"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-card border border-border rounded-xl text-center text-sm">
              <div className="flex flex-col items-center">
                <Truck className="w-6 h-6 text-primary mb-1" />
                <div className="text-muted-foreground">Free Delivery</div>
              </div>
              <div className="flex flex-col items-center">
                <Shield className="w-6 h-6 text-primary mb-1" />
                <div className="text-muted-foreground">{product.warranty}</div>
              </div>
              {product.deliveryEstimate && (
                <div className="flex flex-col items-center">
                  <Clock className="w-6 h-6 text-primary mb-1" />
                  <div className="text-muted-foreground">
                    {product.deliveryEstimate.minDays}-
                    {product.deliveryEstimate.maxDays} days
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center">
                <Ban className="w-6 h-6 text-primary mb-1" />
                <div className="text-muted-foreground">No Return Policy</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section - REMOVED Related Products Tab */}
        <div className="mb-12">
          <div className="border-b border-border overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {[
                { id: "description", label: "Description" },
                { id: "specifications", label: "Specifications" },
                { id: "reviews", label: `Reviews (${reviewStats.total})` },
                // REMOVED: Related Products tab
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-1 border-b-2 transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="py-8">
            {activeTab === "description" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-4">Product Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>

                {product.highlights && product.highlights.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Key Features</h4>
                    <ul className="space-y-2">
                      {product.highlights.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-primary font-bold mt-1">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "specifications" && product.specifications && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-4">Specifications</h3>
                <div className="grid gap-4">
                  {Object.entries(product.specifications).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between py-3 border-b border-border"
                      >
                        <span className="text-muted-foreground font-medium">
                          {key}
                        </span>
                        <span className="font-medium text-right">
                          {String(value)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {activeTab === "reviews" && renderReviewsContent()}
          </div>
        </div>

        {/* Related Products Section - MOVED BELOW TABS */}
        {relatedProducts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Related Products</h3>
              <Link
                href="/product"
                className="text-primary hover:underline font-medium"
              >
                View All
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/product/${relatedProduct.id}`}
                  className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative bg-muted overflow-hidden h-48">
                    <img
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {relatedProduct.name}
                    </h4>
                    <div className="flex items-end justify-between">
                      <span className="text-lg font-bold text-primary">
                        ₹{relatedProduct.price}
                      </span>
                      <div className="flex items-center gap-1 text-xs">
                        <span>⭐</span>
                        <span className="text-muted-foreground">
                          {relatedProduct.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Share Product</h3>
            <div className="space-y-3">
              <button
                onClick={copyToClipboard}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full bg-muted text-foreground py-3 rounded-lg font-semibold hover:bg-muted/80 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewForm
          productId={productId}
          productName={product?.name || ""}
          onSuccess={handleReviewSuccess}
          onCancel={() => {
            setShowReviewForm(false);
            setEditReview(null);
          }}
          editReview={editReview}
        />
      )}

      <BottomNav />
    </div>
  );
}