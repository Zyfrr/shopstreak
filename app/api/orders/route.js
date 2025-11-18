import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Order from '@/models/SS_Order';
import SS_Payment from '@/models/SS_Payment';
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const orders = await SS_Order.find({ SS_CUSTOMER_ID: user.id })
      .sort({ SS_CREATED_DATE: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalOrders = await SS_Order.countDocuments({ SS_CUSTOMER_ID: user.id });

    // Transform order data for frontend
    const transformedOrders = orders.map(order => ({
      id: order._id.toString(),
      orderNumber: order.SS_ORDER_NUMBER,
      date: order.SS_CREATED_DATE,
      total: order.SS_ORDER_SUMMARY.SS_TOTAL_AMOUNT,
      status: order.SS_ORDER_STATUS,
      paymentStatus: order.SS_PAYMENT_STATUS,
      items: order.SS_ORDER_ITEMS.length,
      products: order.SS_ORDER_ITEMS.map(item => ({
        id: item.SS_PRODUCT_ID?.toString() || item.id,
        name: item.SS_PRODUCT_NAME,
        price: item.SS_UNIT_PRICE,
        quantity: item.SS_QUANTITY,
        image: item.SS_PRODUCT_IMAGE,
        total: item.SS_TOTAL_PRICE
      })),
      tracking: {
        currentStatus: getCurrentStatus(order.SS_ORDER_STATUS),
        progress: getOrderProgress(order.SS_ORDER_STATUS),
        lastUpdate: order.SS_MODIFIED_DATE,
        estimatedDelivery: order.SS_SHIPPING_DETAILS?.SS_EXPECTED_DELIVERY
      }
    }));

    return NextResponse.json(ApiResponse.success({
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total: totalOrders,
        pages: Math.ceil(totalOrders / limit)
      }
    }));

  } catch (error) {
    console.error('Orders GET Error:', error);
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

    const { 
      items, 
      shippingAddress, 
      paymentMethod, 
      upiId,
      totalAmount,
      taxAmount,
      shippingCharge,
      discountAmount
    } = await request.json();

    // Validate required fields
    if (!items || !items.length || !shippingAddress || !paymentMethod) {
      return NextResponse.json(
        ApiResponse.error('Missing required order information'),
        { status: 400 }
      );
    }

    // Get user's cart to verify items (but don't clear it)
    const cart = await SS_Cart.findOne({ SS_USER_ID: user.id })
      .populate({
        path: 'SS_ITEMS.SS_PRODUCT_ID',
        model: SS_Product
      });

    if (!cart || !cart.SS_ITEMS.length) {
      return NextResponse.json(
        ApiResponse.error('Cart is empty'),
        { status: 400 }
      );
    }

    // Verify stock and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const cartItem = cart.SS_ITEMS.find(
        cartItem => cartItem.SS_PRODUCT_ID?._id?.toString() === item.id
      );

      if (!cartItem) {
        return NextResponse.json(
          ApiResponse.error(`Product ${item.name} not found in cart`),
          { status: 400 }
        );
      }

      const product = cartItem.SS_PRODUCT_ID;
      
      if (!product) {
        return NextResponse.json(
          ApiResponse.error(`Product ${item.name} not found`),
          { status: 400 }
        );
      }
      
      // Check stock
      const availableStock = product.SS_ADMIN_VISIBLE?.SS_STOCK_QUANTITY || 0;
      if (availableStock < item.quantity) {
        return NextResponse.json(
          ApiResponse.error(`Insufficient stock for ${item.name}. Available: ${availableStock}`),
          { status: 400 }
        );
      }

      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        SS_PRODUCT_ID: product._id,
        SS_PRODUCT_NAME: product.SS_CUSTOMER_VISIBLE?.SS_PRODUCT_TITLE || product.SS_ADMIN_VISIBLE?.SS_PRODUCT_NAME || item.name,
        SS_PRODUCT_IMAGE: product.SS_CUSTOMER_VISIBLE?.SS_MAIN_IMAGE || item.image || '/placeholder.svg',
        SS_QUANTITY: item.quantity,
        SS_UNIT_PRICE: item.price,
        SS_TOTAL_PRICE: itemTotal
      });
    }

    // Map payment method to valid enum values
    const mapPaymentMethod = (method) => {
      const methodMap = {
        'gpay': 'upi',
        'phonepe': 'upi', 
        'paytm': 'upi',
        'upi': 'upi',
        'card': 'card',
        'netbanking': 'netbanking',
        'cod': 'cod'
      };
      return methodMap[method] || 'upi';
    };

    const validPaymentMethod = mapPaymentMethod(paymentMethod);

    // Generate order number
    const orderCount = await SS_Order.countDocuments();
    const orderNumber = `ORD-${Date.now()}${orderCount + 1}`;

    // Create order with all required fields
    const orderData = {
      SS_ORDER_NUMBER: orderNumber,
      SS_CUSTOMER_ID: user.id,
      SS_ORDER_STATUS: 'pending',
      SS_PAYMENT_STATUS: 'pending',
      SS_PAYMENT_METHOD: validPaymentMethod,
      SS_SHIPPING_ADDRESS: {
        SS_FULL_NAME: shippingAddress.SS_FULL_NAME,
        SS_MOBILE: shippingAddress.SS_MOBILE_NUMBER,
        SS_ADDRESS_LINE1: shippingAddress.SS_STREET_ADDRESS,
        SS_CITY: shippingAddress.SS_CITY,
        SS_STATE: shippingAddress.SS_STATE,
        SS_PINCODE: shippingAddress.SS_POSTAL_CODE,
        SS_COUNTRY: shippingAddress.SS_COUNTRY || 'India',
        SS_ADDRESS_TYPE: shippingAddress.SS_ADDRESS_TYPE
      },
      SS_BILLING_ADDRESS: {
        SS_FULL_NAME: shippingAddress.SS_FULL_NAME,
        SS_MOBILE: shippingAddress.SS_MOBILE_NUMBER,
        SS_ADDRESS_LINE1: shippingAddress.SS_STREET_ADDRESS,
        SS_CITY: shippingAddress.SS_CITY,
        SS_STATE: shippingAddress.SS_STATE,
        SS_PINCODE: shippingAddress.SS_POSTAL_CODE,
        SS_COUNTRY: shippingAddress.SS_COUNTRY || 'India'
      },
      SS_ORDER_ITEMS: orderItems,
      SS_ORDER_SUMMARY: {
        SS_SUBTOTAL: subtotal,
        SS_SHIPPING_CHARGE: shippingCharge || 0,
        SS_TAX_AMOUNT: taxAmount || 0,
        SS_DISCOUNT_AMOUNT: discountAmount || 0,
        SS_TOTAL_AMOUNT: totalAmount || subtotal
      }
    };

    const order = new SS_Order(orderData);
    await order.save();

    // Create payment record
    const payment = new SS_Payment({
      SS_ORDER_ID: order._id,
      SS_USER_ID: user.id,
      SS_PAYMENT_METHOD: validPaymentMethod,
      SS_PAYMENT_STATUS: 'pending',
      SS_AMOUNT: totalAmount || subtotal,
      SS_TRANSACTION_ID: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    });

    await payment.save();

    // Process payment based on method
    if (validPaymentMethod === 'upi') {
      // Simulate UPI payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful payment
      payment.SS_PAYMENT_STATUS = 'completed';
      payment.SS_PAYMENT_DATE = new Date();
      order.SS_PAYMENT_STATUS = 'paid';
      order.SS_ORDER_STATUS = 'confirmed';
      
      await payment.save();
      await order.save();

      // Update product stock (but DON'T clear cart)
      for (const item of items) {
        await SS_Product.findByIdAndUpdate(
          item.id,
          { 
            $inc: { 
              'SS_ADMIN_VISIBLE.SS_STOCK_QUANTITY': -item.quantity 
            } 
          }
        );
      }

      // REMOVED: Cart clearing logic - keep items in cart
      // cart.SS_ITEMS = cart.SS_ITEMS.filter(
      //   cartItem => !items.some(item => item.id === cartItem.SS_PRODUCT_ID?._id?.toString())
      // );
      // await cart.save();
    }

    return NextResponse.json(ApiResponse.success({
      order: {
        id: order._id.toString(),
        orderNumber: order.SS_ORDER_NUMBER,
        status: order.SS_ORDER_STATUS,
        paymentStatus: order.SS_PAYMENT_STATUS,
        total: order.SS_ORDER_SUMMARY.SS_TOTAL_AMOUNT
      },
      payment: {
        id: payment._id.toString(),
        status: payment.SS_PAYMENT_STATUS,
        transactionId: payment.SS_TRANSACTION_ID
      }
    }, 'Order placed successfully'));

  } catch (error) {
    console.error('Order POST Error:', error);
    
    // More detailed error logging
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
    }
    
    const response = handleApiError(error);
    return NextResponse.json(response, { status: 500 });
  }
}

// Helper functions
function getCurrentStatus(status) {
  const statusMap = {
    'pending': 'Order Placed',
    'confirmed': 'Order Confirmed',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  };
  return statusMap[status] || 'Order Placed';
}

function getOrderProgress(status) {
  const progressMap = {
    'pending': 20,
    'confirmed': 40,
    'processing': 60,
    'shipped': 80,
    'delivered': 100,
    'cancelled': 0
  };
  return progressMap[status] || 0;
}