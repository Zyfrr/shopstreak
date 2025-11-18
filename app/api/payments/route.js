import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Payment from '@/models/SS_Payment';
import SS_Order from '@/models/SS_Order';
import SS_Product from '@/models/SS_Product';
import { ApiResponse, handleApiError } from '@/lib/utils';
import { JWTMiddleware } from '@/middleware/jwtMiddleware';

export async function POST(request) {
  try {
    await dbConnect();
    
    const user = await JWTMiddleware.requireAuth(request);
    if (!user) {
      return NextResponse.json(ApiResponse.unauthorized(), { status: 401 });
    }

    const { orderId, paymentMethod, upiId, amount } = await request.json();

    if (!orderId || !paymentMethod || !amount) {
      return NextResponse.json(
        ApiResponse.error('Missing required payment information'),
        { status: 400 }
      );
    }

    // Verify order exists and belongs to user
    const order = await SS_Order.findOne({
      _id: orderId,
      SS_CUSTOMER_ID: user.id
    });

    if (!order) {
      return NextResponse.json(
        ApiResponse.error('Order not found'),
        { status: 404 }
      );
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

    // Check if payment already exists
    let payment = await SS_Payment.findOne({ SS_ORDER_ID: orderId });

    if (payment && payment.SS_PAYMENT_STATUS === 'completed') {
      return NextResponse.json(
        ApiResponse.error('Payment already completed for this order'),
        { status: 400 }
      );
    }

    if (!payment) {
      payment = new SS_Payment({
        SS_ORDER_ID: orderId,
        SS_USER_ID: user.id,
        SS_PAYMENT_METHOD: validPaymentMethod,
        SS_PAYMENT_STATUS: 'pending',
        SS_AMOUNT: amount,
        SS_TRANSACTION_ID: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`
      });
    }

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // For demo, always succeed
    payment.SS_PAYMENT_STATUS = 'completed';
    payment.SS_PAYMENT_DATE = new Date();
    
    // Update order status
    order.SS_PAYMENT_STATUS = 'paid';
    order.SS_ORDER_STATUS = 'confirmed';
    
    await payment.save();
    await order.save();

    // Update product stock (but DON'T clear cart)
    for (const item of order.SS_ORDER_ITEMS) {
      await SS_Product.findByIdAndUpdate(
        item.SS_PRODUCT_ID,
        { 
          $inc: { 
            'SS_ADMIN_VISIBLE.SS_STOCK_QUANTITY': -item.SS_QUANTITY 
          } 
        }
      );
    }

    return NextResponse.json(ApiResponse.success({
      payment: {
        id: payment._id.toString(),
        status: payment.SS_PAYMENT_STATUS,
        transactionId: payment.SS_TRANSACTION_ID,
        method: payment.SS_PAYMENT_METHOD,
        amount: payment.SS_AMOUNT,
        date: payment.SS_PAYMENT_DATE
      },
      order: {
        id: order._id.toString(),
        status: order.SS_ORDER_STATUS,
        paymentStatus: order.SS_PAYMENT_STATUS
      }
    }, 'Payment completed successfully'));

  } catch (error) {
    console.error('Payment POST Error:', error);
    const response = handleApiError(error);
    return NextResponse.json(response, { status: 500 });
  }
}