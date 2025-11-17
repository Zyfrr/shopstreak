import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Product from '@/models/SS_Product';
import SS_Category from '@/models/SS_Category';

export async function GET(request, { params }) {
  try {
    await dbConnect();

    // Await the params promise
    const { id } = await params;

    const product = await SS_Product.findById(id)
      .populate('SS_ADMIN_VISIBLE.SS_CATEGORY')
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!product.SS_ADMIN_VISIBLE.SS_IS_ACTIVE) {
      return NextResponse.json(
        { success: false, error: 'Product not available' },
        { status: 404 }
      );
    }

    // Get related products
    const relatedProducts = await SS_Product.find({
      'SS_ADMIN_VISIBLE.SS_IS_ACTIVE': true,
      'SS_ADMIN_VISIBLE.SS_CATEGORY': product.SS_ADMIN_VISIBLE.SS_CATEGORY,
      _id: { $ne: id }
    })
    .limit(4)
    .lean();

    // Transform product data
    const transformedProduct = {
      id: product._id.toString(),
      name: product.SS_CUSTOMER_VISIBLE.SS_PRODUCT_TITLE || product.SS_ADMIN_VISIBLE.SS_PRODUCT_NAME,
      description: product.SS_ADMIN_VISIBLE.SS_PRODUCT_DESCRIPTION,
      shortDescription: product.SS_CUSTOMER_VISIBLE.SS_SHORT_DESCRIPTION,
      category: product.SS_ADMIN_VISIBLE.SS_CATEGORY?.SS_CATEGORY_NAME || 'Uncategorized',
      subCategory: product.SS_ADMIN_VISIBLE.SS_SUBCATEGORY,
      brand: product.SS_ADMIN_VISIBLE.SS_BRAND,
      price: product.SS_ADMIN_VISIBLE.SS_SELLING_PRICE,
      originalPrice: product.SS_ADMIN_VISIBLE.SS_DISCOUNT_PERCENTAGE > 0 
        ? product.SS_ADMIN_VISIBLE.SS_SELLING_PRICE / (1 - product.SS_ADMIN_VISIBLE.SS_DISCOUNT_PERCENTAGE / 100)
        : null,
      discountPercentage: product.SS_ADMIN_VISIBLE.SS_DISCOUNT_PERCENTAGE,
      stock: product.SS_ADMIN_VISIBLE.SS_STOCK_QUANTITY,
      images: [
        product.SS_CUSTOMER_VISIBLE.SS_MAIN_IMAGE,
        ...(product.SS_CUSTOMER_VISIBLE.SS_GALLERY_IMAGES || [])
      ].filter(Boolean),
      mainImage: product.SS_CUSTOMER_VISIBLE.SS_MAIN_IMAGE,
      rating: product.SS_CUSTOMER_VISIBLE.SS_AVERAGE_RATING,
      reviews: product.SS_CUSTOMER_VISIBLE.SS_REVIEW_COUNT,
      soldCount: product.SS_CUSTOMER_VISIBLE.SS_SOLD_COUNT,
      specifications: product.SS_CUSTOMER_VISIBLE.SS_SPECIFICATIONS,
      highlights: product.SS_CUSTOMER_VISIBLE.SS_HIGHLIGHTS,
      features: product.SS_CUSTOMER_VISIBLE.SS_HIGHLIGHTS, // Using highlights as features
      deliveryEstimate: product.SS_CUSTOMER_VISIBLE.SS_DELIVERY_ESTIMATE,
      warranty: product.SS_CUSTOMER_VISIBLE.SS_WARRANTY,
      noReturn: product.SS_ADMIN_VISIBLE.SS_RETURN_POLICY === 'no_return',
      badge: product.SS_ADMIN_VISIBLE.SS_IS_FEATURED ? 'featured' : 
             product.SS_ADMIN_VISIBLE.SS_TRENDING_SCORE > 50 ? 'trending' : 
             product.SS_CUSTOMER_VISIBLE.SS_SOLD_COUNT > 100 ? 'bestseller' : null,
      variants: product.SS_VARIANTS,
      tags: product.SS_TAGS,
      slug: product.SS_SEO_DATA?.slug
    };

    // Transform related products
    const transformedRelatedProducts = relatedProducts.map(prod => ({
      id: prod._id.toString(),
      name: prod.SS_CUSTOMER_VISIBLE.SS_PRODUCT_TITLE || prod.SS_ADMIN_VISIBLE.SS_PRODUCT_NAME,
      category: prod.SS_ADMIN_VISIBLE.SS_CATEGORY?.SS_CATEGORY_NAME || 'Uncategorized',
      price: prod.SS_ADMIN_VISIBLE.SS_SELLING_PRICE,
      image: prod.SS_CUSTOMER_VISIBLE.SS_MAIN_IMAGE,
      rating: prod.SS_CUSTOMER_VISIBLE.SS_AVERAGE_RATING,
      reviews: prod.SS_CUSTOMER_VISIBLE.SS_REVIEW_COUNT
    }));

    return NextResponse.json({
      success: true,
      data: {
        product: transformedProduct,
        relatedProducts: transformedRelatedProducts
      }
    });

  } catch (error) {
    console.error('Product Detail API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}