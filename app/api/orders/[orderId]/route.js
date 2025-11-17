import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Order from '@/models/SS_Order';
import SS_Payment from '@/models/SS_Payment';
import { ApiResponse, handleApiError } from '@/lib/utils';
import { JWTMiddleware } from '@/middleware/jwtMiddleware';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    // Await the params promise
    const { orderId } = await params;
    
    const user = await JWTMiddleware.requireAuth(request);
    if (!user) {
      return NextResponse.json(ApiResponse.unauthorized(), { status: 401 });
    }

    console.log('Fetching order:', orderId, 'for user:', user.id);

    const order = await SS_Order.findOne({
      _id: orderId,
      SS_CUSTOMER_ID: user.id
    }).lean();

    if (!order) {
      console.log('Order not found:', orderId);
      return NextResponse.json(
        ApiResponse.error('Order not found'),
        { status: 404 }
      );
    }

    const payment = await SS_Payment.findOne({
      SS_ORDER_ID: orderId
    }).lean();

    // Transform order data with detailed tracking
    const transformedOrder = {
      id: order._id.toString(),
      orderNumber: order.SS_ORDER_NUMBER,
      date: order.SS_CREATED_DATE,
      status: order.SS_ORDER_STATUS,
      paymentStatus: order.SS_PAYMENT_STATUS,
      items: order.SS_ORDER_ITEMS.map(item => ({
        id: item.SS_PRODUCT_ID?.toString() || 'unknown',
        name: item.SS_PRODUCT_NAME || 'Unknown Product',
        price: item.SS_UNIT_PRICE || 0,
        quantity: item.SS_QUANTITY || 1,
        image: item.SS_PRODUCT_IMAGE || '/placeholder.svg',
        total: item.SS_TOTAL_PRICE || 0
      })),
      summary: {
        subtotal: order.SS_ORDER_SUMMARY?.SS_SUBTOTAL || 0,
        shipping: order.SS_ORDER_SUMMARY?.SS_SHIPPING_CHARGE || 0,
        tax: order.SS_ORDER_SUMMARY?.SS_TAX_AMOUNT || 0,
        discount: order.SS_ORDER_SUMMARY?.SS_DISCOUNT_AMOUNT || 0,
        total: order.SS_ORDER_SUMMARY?.SS_TOTAL_AMOUNT || 0
      },
      shippingAddress: order.SS_SHIPPING_ADDRESS || {},
      billingAddress: order.SS_BILLING_ADDRESS || {},
      payment: payment ? {
        method: payment.SS_PAYMENT_METHOD,
        status: payment.SS_PAYMENT_STATUS,
        transactionId: payment.SS_TRANSACTION_ID,
        amount: payment.SS_AMOUNT,
        date: payment.SS_PAYMENT_DATE
      } : null,
      shipping: order.SS_SHIPPING_DETAILS || {},
      tracking: generateTrackingTimeline(order)
    };

    return NextResponse.json(ApiResponse.success({
      order: transformedOrder
    }));

  } catch (error) {
    console.error('Order Detail GET Error:', error);
    const response = handleApiError(error);
    return NextResponse.json(response, { status: 500 });
  }
}

function generateTrackingTimeline(order) {
  const timeline = [];
  const statusDates = {
    ordered: order.SS_CREATED_DATE,
    confirmed: order.SS_MODIFIED_DATE,
    shipped: order.SS_SHIPPING_DETAILS?.SS_SHIPPED_DATE,
    'out-for-delivery': order.SS_SHIPPING_DETAILS?.SS_EXPECTED_DELIVERY,
    delivered: order.SS_SHIPPING_DETAILS?.SS_DELIVERED_DATE
  };

  const statusFlow = [
    { status: 'ordered', description: 'Order Placed' },
    { status: 'confirmed', description: 'Order Confirmed' },
    { status: 'shipped', description: 'Shipped' },
    { status: 'out-for-delivery', description: 'Out for Delivery' },
    { status: 'delivered', description: 'Delivered' }
  ];

  const currentStatusIndex = statusFlow.findIndex(step => 
    step.status === getTimelineStatus(order.SS_ORDER_STATUS)
  );

  statusFlow.forEach((step, index) => {
    const completed = index <= currentStatusIndex;
    const date = statusDates[step.status];
    
    timeline.push({
      status: step.status,
      description: step.description,
      date: date ? new Date(date).toLocaleString('en-IN') : '',
      completed
    });
  });

  return timeline;
}

function getTimelineStatus(orderStatus) {
  const statusMap = {
    'pending': 'ordered',
    'confirmed': 'confirmed',
    'processing': 'confirmed',
    'shipped': 'shipped',
    'delivered': 'delivered',
    'cancelled': 'ordered'
  };
  return statusMap[orderStatus] || 'ordered';
}