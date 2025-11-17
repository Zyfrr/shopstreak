import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Wishlist from '@/models/SS_Wishlight';
import SS_Product from '@/models/SS_Product'; // Add this import
import { ApiResponse, handleApiError } from '@/lib/utils';
import { JWTMiddleware } from '@/middleware/jwtMiddleware';

export async function GET(request) {
  try {
    await dbConnect();
    
    const user = await JWTMiddleware.requireAuth(request);
    if (!user) {
      return NextResponse.json(ApiResponse.unauthorized(), { status: 401 });
    }

    const wishlist = await SS_Wishlist.findOne({ SS_USER_ID: user.id })
      .populate('SS_PRODUCTS.SS_PRODUCT_ID')
      .lean();

    if (!wishlist) {
      return NextResponse.json(ApiResponse.success({ 
        items: [], 
        totalValue: 0,
        itemCount: 0 
      }));
    }

    // Transform wishlist data with better error handling
    const transformedItems = wishlist.SS_PRODUCTS.map(item => {
      const product = item.SS_PRODUCT_ID;
      if (!product) return null;

      const price = product.SS_ADMIN_VISIBLE?.SS_SELLING_PRICE || 0;
      const discountPercentage = product.SS_ADMIN_VISIBLE?.SS_DISCOUNT_PERCENTAGE || 0;
      
      return {
        id: product._id.toString(),
        name: product.SS_CUSTOMER_VISIBLE?.SS_PRODUCT_TITLE || 
               product.SS_ADMIN_VISIBLE?.SS_PRODUCT_NAME || 'Unknown Product',
        price: price,
        originalPrice: discountPercentage > 0 ? 
          Math.round(price / (1 - discountPercentage / 100)) : null,
        image: product.SS_CUSTOMER_VISIBLE?.SS_MAIN_IMAGE || '/placeholder.svg',
        category: product.SS_ADMIN_VISIBLE?.SS_CATEGORY?.SS_CATEGORY_NAME || 'Uncategorized',
        rating: product.SS_CUSTOMER_VISIBLE?.SS_AVERAGE_RATING || 0,
        reviews: product.SS_CUSTOMER_VISIBLE?.SS_REVIEW_COUNT || 0,
        inStock: (product.SS_ADMIN_VISIBLE?.SS_STOCK_QUANTITY || 0) > 0,
        badge: product.SS_ADMIN_VISIBLE?.SS_IS_FEATURED ? 'featured' : 
               product.SS_ADMIN_VISIBLE?.SS_TRENDING_SCORE > 50 ? 'trending' : null,
        addedDate: item.SS_ADDED_DATE
      };
    }).filter(Boolean); // Remove null items

    const totalValue = transformedItems.reduce((sum, item) => sum + item.price, 0);
    const itemCount = transformedItems.length;

    return NextResponse.json(ApiResponse.success({
      items: transformedItems,
      totalValue,
      itemCount,
      wishlistId: wishlist._id.toString()
    }));

  } catch (error) {
    console.error('Wishlist GET Error:', error);
    const response = handleApiError(error);
    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    
    const user = await JWTMiddleware.requireAuth(request);
    if (!user) {
      return NextResponse.json(ApiResponse.unauthorized(), { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(ApiResponse.error('Product ID is required'), { status: 400 });
    }

    // Verify product exists - FIXED: SS_Product is now imported
    const product = await SS_Product.findOne({
      _id: productId,
      'SS_ADMIN_VISIBLE.SS_IS_ACTIVE': true
    });

    if (!product) {
      return NextResponse.json(ApiResponse.error('Product not found'), { status: 404 });
    }

    // Find or create wishlist
    let wishlist = await SS_Wishlist.findOne({ SS_USER_ID: user.id });

    if (!wishlist) {
      wishlist = new SS_Wishlist({
        SS_USER_ID: user.id,
        SS_PRODUCTS: []
      });
    }

    // Check if product already exists in wishlist
    const existingProduct = wishlist.SS_PRODUCTS.find(
      item => item.SS_PRODUCT_ID.toString() === productId
    );

    if (existingProduct) {
      return NextResponse.json(ApiResponse.error('Product already in wishlist'), { status: 400 });
    }

    // Add new product
    wishlist.SS_PRODUCTS.push({
      SS_PRODUCT_ID: productId,
      SS_ADDED_DATE: new Date()
    });

    await wishlist.save();

    return NextResponse.json(ApiResponse.success({
      message: 'Product added to wishlist successfully',
      wishlistId: wishlist._id.toString()
    }));

  } catch (error) {
    console.error('Wishlist POST Error:', error);
    const response = handleApiError(error);
    return NextResponse.json(response, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    
    const user = await JWTMiddleware.requireAuth(request);
    if (!user) {
      return NextResponse.json(ApiResponse.unauthorized(), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(ApiResponse.error('Product ID is required'), { status: 400 });
    }

    const wishlist = await SS_Wishlist.findOne({ SS_USER_ID: user.id });

    if (!wishlist) {
      return NextResponse.json(ApiResponse.error('Wishlist not found'), { status: 404 });
    }

    // Remove product from wishlist
    wishlist.SS_PRODUCTS = wishlist.SS_PRODUCTS.filter(
      item => item.SS_PRODUCT_ID.toString() !== productId
    );

    // Delete entire document if no products left
    if (wishlist.SS_PRODUCTS.length === 0) {
      await SS_Wishlist.findByIdAndDelete(wishlist._id);
      return NextResponse.json(ApiResponse.success({
        message: 'Product removed from wishlist',
        wishlistDeleted: true
      }));
    }

    await wishlist.save();

    return NextResponse.json(ApiResponse.success({
      message: 'Product removed from wishlist',
      wishlistDeleted: false
    }));

  } catch (error) {
    console.error('Wishlist DELETE Error:', error);
    const response = handleApiError(error);
    return NextResponse.json(response, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await dbConnect();
    
    const user = await JWTMiddleware.requireAuth(request);
    if (!user) {
      return NextResponse.json(ApiResponse.unauthorized(), { status: 401 });
    }

    const { productIds, action } = await request.json();

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(ApiResponse.error('Product IDs array is required'), { status: 400 });
    }

    const wishlist = await SS_Wishlist.findOne({ SS_USER_ID: user.id });

    if (!wishlist) {
      return NextResponse.json(ApiResponse.error('Wishlist not found'), { status: 404 });
    }

    if (action === 'remove') {
      // Remove multiple products
      wishlist.SS_PRODUCTS = wishlist.SS_PRODUCTS.filter(
        item => !productIds.includes(item.SS_PRODUCT_ID.toString())
      );

      // Delete entire document if no products left
      if (wishlist.SS_PRODUCTS.length === 0) {
        await SS_Wishlist.findByIdAndDelete(wishlist._id);
        return NextResponse.json(ApiResponse.success({
          message: `Successfully removed ${productIds.length} items`,
          wishlistDeleted: true
        }));
      }
    }

    await wishlist.save();

    return NextResponse.json(ApiResponse.success({
      message: `Successfully ${action === 'remove' ? 'removed' : 'updated'} ${productIds.length} items`,
      wishlistDeleted: false
    }));

  } catch (error) {
    console.error('Wishlist PATCH Error:', error);
    const response = handleApiError(error);
    return NextResponse.json(response, { status: 500 });
  }
}