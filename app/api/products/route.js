import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Product from '@/models/SS_Product';
import SS_Category from '@/models/SS_Category';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30'); // Increased to 20
    const searchQuery = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const subCategory = searchParams.get('subCategory') || '';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '100000');
    const minRating = parseFloat(searchParams.get('rating') || '0');
    const inStock = searchParams.get('inStock');
    const sort = searchParams.get('sort') || 'popular';

    console.log('🔍 API Received Category:', category);

    // Build filter object
    let filter = {
      'SS_ADMIN_VISIBLE.SS_IS_ACTIVE': true,
      'SS_ADMIN_VISIBLE.SS_SELLING_PRICE': { $gte: minPrice, $lte: maxPrice }
    };

    // Add rating filter only if minRating > 0
    if (minRating > 0) {
      filter['SS_CUSTOMER_VISIBLE.SS_AVERAGE_RATING'] = { $gte: minRating };
    }

    // IMPROVED CATEGORY FILTER - Handle category names properly
    if (category && category !== 'all') {
      const decodedCategory = decodeURIComponent(category);
      console.log('🔍 Decoded Category:', decodedCategory);
      
      // First try to find category by name
      const categories = await SS_Category.find({
        SS_CATEGORY_NAME: { 
          $regex: decodedCategory.replace(/[-&]/g, '.*'), 
          $options: 'i' 
        }
      }).select('_id');
      
      if (categories.length > 0) {
        // Filter by category ObjectId
        const categoryIds = categories.map(cat => cat._id);
        filter['SS_ADMIN_VISIBLE.SS_CATEGORY'] = { $in: categoryIds };
        console.log('🔍 Filtering by category IDs:', categoryIds);
      } else {
        // If no category found, try direct name matching as fallback
        console.log('🔍 No category found, trying direct name matching');
        filter['SS_ADMIN_VISIBLE.SS_CATEGORY_NAME'] = { 
          $regex: decodedCategory, 
          $options: 'i' 
        };
      }
    }

    // Sub-category filter
    if (subCategory) {
      filter['SS_ADMIN_VISIBLE.SS_SUBCATEGORY'] = { 
        $regex: subCategory, $options: 'i' 
      };
    }

    // Stock filter
    if (inStock === 'true') {
      filter['SS_ADMIN_VISIBLE.SS_STOCK_QUANTITY'] = { $gt: 0 };
    }

    // Search query across multiple fields
    if (searchQuery) {
      filter.$or = [
        { 'SS_ADMIN_VISIBLE.SS_PRODUCT_NAME': { $regex: searchQuery, $options: 'i' } },
        { 'SS_CUSTOMER_VISIBLE.SS_PRODUCT_TITLE': { $regex: searchQuery, $options: 'i' } },
        { 'SS_CUSTOMER_VISIBLE.SS_SHORT_DESCRIPTION': { $regex: searchQuery, $options: 'i' } },
        { 'SS_TAGS': { $in: [new RegExp(searchQuery, 'i')] } },
        { 'SS_ADMIN_VISIBLE.SS_BRAND': { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Build sort object
    let sortOptions = {};
    switch (sort) {
      case 'price_asc':
        sortOptions = { 'SS_ADMIN_VISIBLE.SS_SELLING_PRICE': 1 };
        break;
      case 'price_desc':
        sortOptions = { 'SS_ADMIN_VISIBLE.SS_SELLING_PRICE': -1 };
        break;
      case 'rating':
        sortOptions = { 'SS_CUSTOMER_VISIBLE.SS_AVERAGE_RATING': -1 };
        break;
      case 'trending':
        sortOptions = { 'SS_ADMIN_VISIBLE.SS_TRENDING_SCORE': -1 };
        break;
      case 'newest':
        sortOptions = { 'createdAt': -1 };
        break;
      case 'discount':
        sortOptions = { 'SS_ADMIN_VISIBLE.SS_DISCOUNT_PERCENTAGE': -1 };
        break;
      default: // popular
        sortOptions = { 'SS_CUSTOMER_VISIBLE.SS_SOLD_COUNT': -1 };
    }

    console.log('🔍 Final Filter:', JSON.stringify(filter, null, 2));

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    // Use aggregation to properly handle category population
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
          categoryName: {
            $arrayElemAt: ['$categoryData.SS_CATEGORY_NAME', 0]
          }
        }
      },
      { $sort: sortOptions },
      { $skip: skip },
      { $limit: limit }
    ];

    const products = await SS_Product.aggregate(aggregationPipeline);

    // Get total count for pagination
    const total = await SS_Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    console.log('🔍 Products Found:', products.length);

    // Transform products for frontend
    const transformedProducts = products.map(product => {
      // Get main image - prioritize customer visible main image
      let mainImage = product.SS_CUSTOMER_VISIBLE?.SS_MAIN_IMAGE;
      
      // If no main image, try to get from gallery or product images
      if (!mainImage) {
        if (product.SS_CUSTOMER_VISIBLE?.SS_GALLERY_IMAGES?.length > 0) {
          mainImage = product.SS_CUSTOMER_VISIBLE.SS_GALLERY_IMAGES[0];
        } else if (product.SS_ADMIN_VISIBLE?.SS_PRODUCT_IMAGES?.length > 0) {
          const primaryImage = product.SS_ADMIN_VISIBLE.SS_PRODUCT_IMAGES.find((img) => img.isPrimary);
          mainImage = primaryImage ? primaryImage.url : product.SS_ADMIN_VISIBLE.SS_PRODUCT_IMAGES[0].url;
        }
      }

      // Get all images for carousel
      const images = [];
      if (mainImage) images.push(mainImage);
      if (product.SS_CUSTOMER_VISIBLE?.SS_GALLERY_IMAGES) {
        images.push(...product.SS_CUSTOMER_VISIBLE.SS_GALLERY_IMAGES.filter((img) => img && img !== mainImage));
      }

      // Use category name from aggregation or fallback
      const categoryName = product.categoryName || 'Uncategorized';

      return {
        id: product._id.toString(),
        name: product.SS_CUSTOMER_VISIBLE?.SS_PRODUCT_TITLE || product.SS_ADMIN_VISIBLE.SS_PRODUCT_NAME,
        description: product.SS_ADMIN_VISIBLE.SS_PRODUCT_DESCRIPTION,
        shortDescription: product.SS_CUSTOMER_VISIBLE?.SS_SHORT_DESCRIPTION,
        category: categoryName,
        subCategory: product.SS_ADMIN_VISIBLE.SS_SUBCATEGORY,
        brand: product.SS_ADMIN_VISIBLE.SS_BRAND,
        price: product.SS_ADMIN_VISIBLE.SS_SELLING_PRICE,
        originalPrice: product.SS_ADMIN_VISIBLE.SS_DISCOUNT_PERCENTAGE > 0 
          ? Math.round(product.SS_ADMIN_VISIBLE.SS_SELLING_PRICE / (1 - product.SS_ADMIN_VISIBLE.SS_DISCOUNT_PERCENTAGE / 100))
          : null,
        discountPercentage: product.SS_ADMIN_VISIBLE.SS_DISCOUNT_PERCENTAGE,
        stock: product.SS_ADMIN_VISIBLE.SS_STOCK_QUANTITY,
        image: mainImage || '/placeholder.svg',
        images: images.length > 0 ? images : ['/placeholder.svg'],
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
      };
    });

    return NextResponse.json({
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
    });

  } catch (error) {
    console.error('Products API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Helper function to determine product badge
function getProductBadge(product) {
  if (product.SS_ADMIN_VISIBLE?.SS_IS_FEATURED) return 'featured';
  if (product.SS_ADMIN_VISIBLE?.SS_TRENDING_SCORE > 50) return 'trending';
  if (product.SS_CUSTOMER_VISIBLE?.SS_SOLD_COUNT > 100) return 'bestseller';
  if (product.SS_ADMIN_VISIBLE?.SS_DISCOUNT_PERCENTAGE > 20) return 'sale';
  return null;
}