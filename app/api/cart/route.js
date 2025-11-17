import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Cart from '@/models/SS_Cart';
import SS_Product from '@/models/SS_Product';
import { ApiResponse, handleApiError } from '@/lib/utils';
import { JWTMiddleware } from '@/middleware/jwtMiddleware';

export async function GET(request) {
  try {
    await dbConnect();
    
    const user = await JWTMiddleware.requireAuth(request);
    if (!user) {
      return NextResponse.json(ApiResponse.unauthorized(), { status: 401 });
    }

    const cart = await SS_Cart.findOne({ SS_USER_ID: user.id })
      .populate({
        path: 'SS_ITEMS.SS_PRODUCT_ID',
        model: SS_Product
      })
      .lean();

    if (!cart) {
      return NextResponse.json(ApiResponse.success({ 
        items: [], 
        total: 0,
        itemCount: 0 
      }));
    }

    // Transform cart data with better error handling
    const transformedItems = cart.SS_ITEMS.map(item => {
      const product = item.SS_PRODUCT_ID;
      if (!product) return null;
      
      return {
        id: product._id?.toString(),
        name: product.SS_CUSTOMER_VISIBLE?.SS_PRODUCT_TITLE || 
               product.SS_ADMIN_VISIBLE?.SS_PRODUCT_NAME || 'Unknown Product',
        price: product.SS_ADMIN_VISIBLE?.SS_SELLING_PRICE || 0,
        image: product.SS_CUSTOMER_VISIBLE?.SS_MAIN_IMAGE || '/placeholder.svg',
        quantity: item.SS_QUANTITY || 1,
        stock: product.SS_ADMIN_VISIBLE?.SS_STOCK_QUANTITY || 0,
        inStock: (product.SS_ADMIN_VISIBLE?.SS_STOCK_QUANTITY || 0) > 0
      };
    }).filter(Boolean); // Remove null items

    const total = transformedItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );

    const itemCount = transformedItems.reduce((sum, item) => 
      sum + item.quantity, 0
    );

    return NextResponse.json(ApiResponse.success({
      items: transformedItems,
      total,
      itemCount,
      cartId: cart._id.toString()
    }));

  } catch (error) {
    console.error('Cart GET Error:', error);
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

    const { productId, quantity = 1 } = await request.json();

    if (!productId) {
      return NextResponse.json(ApiResponse.error('Product ID is required'), { status: 400 });
    }

    // Verify product exists and is active
    const product = await SS_Product.findOne({
      _id: productId,
      'SS_ADMIN_VISIBLE.SS_IS_ACTIVE': true
    });

    if (!product) {
      return NextResponse.json(ApiResponse.error('Product not found or unavailable'), { status: 404 });
    }

    // Check stock availability
    const availableStock = product.SS_ADMIN_VISIBLE?.SS_STOCK_QUANTITY || 0;
    if (availableStock <= 0) {
      return NextResponse.json(ApiResponse.error('Product is out of stock'), { status: 400 });
    }

    // Find or create cart
    let cart = await SS_Cart.findOne({ SS_USER_ID: user.id });

    if (!cart) {
      cart = new SS_Cart({
        SS_USER_ID: user.id,
        SS_ITEMS: []
      });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.SS_ITEMS.findIndex(
      item => item.SS_PRODUCT_ID.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity - ensure it doesn't exceed available stock
      const newQuantity = cart.SS_ITEMS[existingItemIndex].SS_QUANTITY + quantity;
      const maxQuantity = Math.min(availableStock, 10); // Max 10 per product
      
      if (newQuantity > maxQuantity) {
        return NextResponse.json(
          ApiResponse.error(`Maximum ${maxQuantity} allowed per order. Only ${availableStock} in stock.`), 
          { status: 400 }
        );
      }
      
      cart.SS_ITEMS[existingItemIndex].SS_QUANTITY = newQuantity;
    } else {
      // Add new item - check quantity doesn't exceed available stock
      const maxQuantity = Math.min(availableStock, 10);
      if (quantity > maxQuantity) {
        return NextResponse.json(
          ApiResponse.error(`Maximum ${maxQuantity} allowed per order. Only ${availableStock} in stock.`), 
          { status: 400 }
        );
      }
      
      cart.SS_ITEMS.push({
        SS_PRODUCT_ID: productId,
        SS_QUANTITY: quantity,
        SS_ADDED_DATE: new Date()
      });
    }

    await cart.save();

    return NextResponse.json(ApiResponse.success({
      message: 'Item added to cart successfully'
    }));

  } catch (error) {
    console.error('Cart POST Error:', error);
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

    const cart = await SS_Cart.findOne({ SS_USER_ID: user.id });

    if (!cart) {
      return NextResponse.json(ApiResponse.error('Cart not found'), { status: 404 });
    }

    if (productId) {
      // Remove specific item
      cart.SS_ITEMS = cart.SS_ITEMS.filter(
        item => item.SS_PRODUCT_ID.toString() !== productId
      );
    } else {
      // Clear entire cart
      cart.SS_ITEMS = [];
    }

    await cart.save();

    return NextResponse.json(ApiResponse.success({
      message: productId ? 'Item removed from cart' : 'Cart cleared successfully'
    }));

  } catch (error) {
    console.error('Cart DELETE Error:', error);
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

    const { productId, quantity } = await request.json();

    if (!productId || quantity === undefined) {
      return NextResponse.json(ApiResponse.error('Product ID and quantity are required'), { status: 400 });
    }

    if (quantity < 0) {
      return NextResponse.json(ApiResponse.error('Quantity cannot be negative'), { status: 400 });
    }

    const cart = await SS_Cart.findOne({ SS_USER_ID: user.id });

    if (!cart) {
      return NextResponse.json(ApiResponse.error('Cart not found'), { status: 404 });
    }

    const item = cart.SS_ITEMS.find(
      item => item.SS_PRODUCT_ID.toString() === productId
    );

    if (!item) {
      return NextResponse.json(ApiResponse.error('Item not found in cart'), { status: 404 });
    }

    // Get product to check stock
    const product = await SS_Product.findById(productId);
    const availableStock = product?.SS_ADMIN_VISIBLE?.SS_STOCK_QUANTITY || 0;
    const maxQuantity = Math.min(availableStock, 10);

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.SS_ITEMS = cart.SS_ITEMS.filter(
        item => item.SS_PRODUCT_ID.toString() !== productId
      );
    } else if (quantity > maxQuantity) {
      return NextResponse.json(
        ApiResponse.error(`Maximum ${maxQuantity} allowed per order. Only ${availableStock} in stock.`), 
        { status: 400 }
      );
    } else {
      item.SS_QUANTITY = quantity;
    }

    await cart.save();

    return NextResponse.json(ApiResponse.success({
      message: 'Cart updated successfully'
    }));

  } catch (error) {
    console.error('Cart PATCH Error:', error);
    const response = handleApiError(error);
    return NextResponse.json(response, { status: 500 });
  }
}