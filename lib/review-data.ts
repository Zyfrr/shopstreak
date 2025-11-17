export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  unhelpful: number;
  createdAt: Date;
  adminResponse?: {
    response: string;
    respondedAt: Date;
  };
}

// This function can be deprecated now since we're using API
export function getProductReviews(productId: string): Review[] {
  // Return empty array since we're fetching from API
  return [];
}

// New function to fetch reviews from API
export async function fetchProductReviews(productId: string, page = 1, limit = 10) {
  try {
    const response = await fetch(
      `/api/products/review?productId=${productId}&page=${page}&limit=${limit}`
    );
    const result = await response.json();
    
    if (result.success) {
      return {
        reviews: result.data.reviews,
        pagination: result.data.pagination,
        summary: result.data.summary
      };
    }
    return { reviews: [], pagination: null, summary: null };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return { reviews: [], pagination: null, summary: null };
  }
}