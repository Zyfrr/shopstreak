import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Product from '@/models/SS_Product';
import SS_Category from '@/models/SS_Category';

// Cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

// Add indexes to your MongoDB schema for these fields:
// - SS_ADMIN_VISIBLE.SS_IS_ACTIVE
// - SS_ADMIN_VISIBLE.SS_SELLING_PRICE
// - SS_CUSTOMER_VISIBLE.SS_AVERAGE_RATING
// - SS_ADMIN_VISIBLE.SS_CATEGORY
// - createdAt

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    
    // Generate cache key from request parameters
    const cacheKey = `products:${searchParams.toString()}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('🔍 Serving from cache:', cacheKey);
      return NextResponse.json(cached.data);
    }

    // Extract query parameters with optimized defaults
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const searchQuery = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const subCategory = searchParams.get('subCategory') || '';
    const minPrice = Math.max(0, parseFloat(searchParams.get('minPrice') || '0'));
    const maxPrice = Math.min(100000, parseFloat(searchParams.get('maxPrice') || '100000'));
    const minRating = Math.max(0, Math.min(5, parseFloat(searchParams.get('rating') || '0')));
    const inStock = searchParams.get('inStock');
    const sort = searchParams.get('sort') || 'popular';

    // Build optimized filter object
    const filter = {
      'SS_ADMIN_VISIBLE.SS_IS_ACTIVE': true,
      'SS_ADMIN_VISIBLE.SS_SELLING_PRICE': { 
        $gte: minPrice, 
        $lte: maxPrice 
      }
    };

    // Add rating filter only if needed
    if (minRating > 0) {
      filter['SS_CUSTOMER_VISIBLE.SS_AVERAGE_RATING'] = { $gte: minRating };
    }

    // Optimized category filtering
    if (category && category !== 'all') {
      const decodedCategory = decodeURIComponent(category);
      
      // Use category cache for better performance
      let categoryIds = cache.get(`category:${decodedCategory}`);
      
      if (!categoryIds) {
        const categories = await SS_Category.find({
          SS_CATEGORY_NAME: { 
            $regex: decodedCategory.replace(/[-&]/g, '.*'), 
            $options: 'i' 
          }
        }).select('_id').lean();
        
        categoryIds = categories.map(cat => cat._id);
        cache.set(`category:${decodedCategory}`, categoryIds);
      }

      if (categoryIds.length > 0) {
        filter['SS_ADMIN_VISIBLE.SS_CATEGORY'] = { $in: categoryIds };
      }
    }

    // Sub-category filter
    if (subCategory) {
      filter['SS_ADMIN_VISIBLE.SS_SUBCATEGORY'] = { 
        $regex: subCategory, 
        $options: 'i' 
      };
    }

    // Stock filter
    if (inStock === 'true') {
      filter['SS_ADMIN_VISIBLE.SS_STOCK_QUANTITY'] = { $gt: 0 };
    }

    // Optimized search query
    if (searchQuery) {
      filter.$or = [
        { 'SS_ADMIN_VISIBLE.SS_PRODUCT_NAME': { $regex: searchQuery, $options: 'i' } },
        { 'SS_CUSTOMER_VISIBLE.SS_PRODUCT_TITLE': { $regex: searchQuery, $options: 'i' } },
        { 'SS_TAGS': { $in: [new RegExp(searchQuery, 'i')] } }
      ];
    }

    // Optimized sort configuration
    const sortOptions = getSortOptions(sort);

    // Execute query with optimized projection
    const skip = (page - 1) * limit;
    
    const aggregationPipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'ss_categories',
          localField: 'SS_ADMIN_VISIBLE.SS_CATEGORY',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      {
        $addFields: {
          categoryName: { $arrayElemAt: ['$categoryData.SS_CATEGORY_NAME', 0] },
          // Pre-calculate fields used in sorting and display
          calculatedPrice: '$SS_ADMIN_VISIBLE.SS_SELLING_PRICE',
          calculatedRating: '$SS_CUSTOMER_VISIBLE.SS_AVERAGE_RATING',
          calculatedSoldCount: '$SS_CUSTOMER_VISIBLE.SS_SOLD_COUNT',
          mainImage: {
            $cond: {
              if: { $gt: [{ $ifNull: ['$SS_CUSTOMER_VISIBLE.SS_MAIN_IMAGE', ''] }, ''] },
              then: '$SS_CUSTOMER_VISIBLE.SS_MAIN_IMAGE',
              else: {
                $arrayElemAt: [
                  {
                    $cond: {
                      if: { $gt: [{ $size: '$SS_CUSTOMER_VISIBLE.SS_GALLERY_IMAGES' }, 0] },
                      then: '$SS_CUSTOMER_VISIBLE.SS_GALLERY_IMAGES',
                      else: {
                        $map: {
                          input: {
                            $filter: {
                              input: '$SS_ADMIN_VISIBLE.SS_PRODUCT_IMAGES',
                              as: 'img',
                              cond: { $eq: ['$$img.isPrimary', true] }
                            }
                          },
                          as: 'img',
                          in: '$$img.url'
                        }
                      }
                    }
                  },
                  0
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          // Only include necessary fields
          'SS_CUSTOMER_VISIBLE.SS_PRODUCT_TITLE': 1,
          'SS_ADMIN_VISIBLE.SS_PRODUCT_NAME': 1,
          'SS_ADMIN_VISIBLE.SS_PRODUCT_DESCRIPTION': 1,
          'SS_CUSTOMER_VISIBLE.SS_SHORT_DESCRIPTION': 1,
          'SS_ADMIN_VISIBLE.SS_SUBCATEGORY': 1,
          'SS_ADMIN_VISIBLE.SS_BRAND': 1,
          'SS_ADMIN_VISIBLE.SS_SELLING_PRICE': 1,
          'SS_ADMIN_VISIBLE.SS_DISCOUNT_PERCENTAGE': 1,
          'SS_ADMIN_VISIBLE.SS_STOCK_QUANTITY': 1,
          'SS_CUSTOMER_VISIBLE.SS_AVERAGE_RATING': 1,
          'SS_CUSTOMER_VISIBLE.SS_REVIEW_COUNT': 1,
          'SS_CUSTOMER_VISIBLE.SS_SOLD_COUNT': 1,
          'SS_CUSTOMER_VISIBLE.SS_GALLERY_IMAGES': 1,
          'SS_CUSTOMER_VISIBLE.SS_SPECIFICATIONS': 1,
          'SS_CUSTOMER_VISIBLE.SS_HIGHLIGHTS': 1,
          'SS_CUSTOMER_VISIBLE.SS_DELIVERY_ESTIMATE': 1,
          'SS_CUSTOMER_VISIBLE.SS_WARRANTY': 1,
          'SS_ADMIN_VISIBLE.SS_RETURN_POLICY': 1,
          'SS_ADMIN_VISIBLE.SS_IS_FEATURED': 1,
          'SS_ADMIN_VISIBLE.SS_TRENDING_SCORE': 1,
          'SS_VARIANTS': 1,
          'SS_TAGS': 1,
          'SS_SEO_DATA.slug': 1,
          categoryName: 1,
          mainImage: 1,
          calculatedPrice: 1,
          calculatedRating: 1,
          calculatedSoldCount: 1
        }
      },
      { $sort: sortOptions },
      { $skip: skip },
      { $limit: limit }
    ];

    // Parallel execution of count and data query
    const [products, total] = await Promise.all([
      SS_Product.aggregate(aggregationPipeline),
      SS_Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    // Transform products efficiently
    const transformedProducts = products.map(product => ({
      id: product._id.toString(),
      name: product.SS_CUSTOMER_VISIBLE?.SS_PRODUCT_TITLE || product.SS_ADMIN_VISIBLE.SS_PRODUCT_NAME,
      description: product.SS_ADMIN_VISIBLE.SS_PRODUCT_DESCRIPTION,
      shortDescription: product.SS_CUSTOMER_VISIBLE?.SS_SHORT_DESCRIPTION,
      category: product.categoryName || 'Uncategorized',
      subCategory: product.SS_ADMIN_VISIBLE.SS_SUBCATEGORY,
      brand: product.SS_ADMIN_VISIBLE.SS_BRAND,
      price: product.SS_ADMIN_VISIBLE.SS_SELLING_PRICE,
      originalPrice: product.SS_ADMIN_VISIBLE.SS_DISCOUNT_PERCENTAGE > 0 
        ? Math.round(product.SS_ADMIN_VISIBLE.SS_SELLING_PRICE / (1 - product.SS_ADMIN_VISIBLE.SS_DISCOUNT_PERCENTAGE / 100))
        : null,
      discountPercentage: product.SS_ADMIN_VISIBLE.SS_DISCOUNT_PERCENTAGE,
      stock: product.SS_ADMIN_VISIBLE.SS_STOCK_QUANTITY,
      image: product.mainImage || '/placeholder.svg',
      images: [product.mainImage || '/placeholder.svg'], // Simplified for performance
      rating: product.SS_CUSTOMER_VISIBLE?.SS_AVERAGE_RATING || 0,
      reviews: product.SS_CUSTOMER_VISIBLE?.SS_REVIEW_COUNT || 0,
      soldCount: product.SS_CUSTOMER_VISIBLE?.SS_SOLD_COUNT || 0,
      specifications: product.SS_CUSTOMER_VISIBLE?.SS_SPECIFICATIONS || {},
      highlights: product.SS_CUSTOMER_VISIBLE?.SS_HIGHLIGHTS || [],
      deliveryEstimate: product.SS_CUSTOMER_VISIBLE?.SS_DELIVERY_ESTIMATE || { minDays: 3, maxDays: 7 },
      warranty: product.SS_CUSTOMER_VISIBLE?.SS_WARRANTY || 'No warranty',
      noReturn: product.SS_ADMIN_VISIBLE.SS_RETURN_POLICY === 'no_return',
      badge: getProductBadge(product),
      variants: product.SS_VARIANTS || [],
      tags: product.SS_TAGS || [],
      slug: product.SS_SEO_DATA?.slug
    }));

    const responseData = {
      success: true,
      data: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

    // Cache the response
    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Products API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function for sort options
function getSortOptions(sort) {
  const sortMap = {
    'price_asc': { 'SS_ADMIN_VISIBLE.SS_SELLING_PRICE': 1 },
    'price_desc': { 'SS_ADMIN_VISIBLE.SS_SELLING_PRICE': -1 },
    'rating': { 'SS_CUSTOMER_VISIBLE.SS_AVERAGE_RATING': -1 },
    'trending': { 'SS_ADMIN_VISIBLE.SS_TRENDING_SCORE': -1 },
    'newest': { 'createdAt': -1 },
    'discount': { 'SS_ADMIN_VISIBLE.SS_DISCOUNT_PERCENTAGE': -1 },
    'popular': { 'SS_CUSTOMER_VISIBLE.SS_SOLD_COUNT': -1 }
  };
  
  return sortMap[sort] || sortMap['popular'];
}

// Helper function to determine product badge
function getProductBadge(product) {
  if (product.SS_ADMIN_VISIBLE?.SS_IS_FEATURED) return 'featured';
  if (product.SS_ADMIN_VISIBLE?.SS_TRENDING_SCORE > 50) return 'trending';
  if (product.SS_CUSTOMER_VISIBLE?.SS_SOLD_COUNT > 100) return 'bestseller';
  if (product.SS_ADMIN_VISIBLE?.SS_DISCOUNT_PERCENTAGE > 20) return 'sale';
  return null;
}