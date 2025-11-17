import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Order from '@/models/SS_Order';
import SS_Payment from '@/models/SS_Payment';
import SS_User from '@/models/SS_User';
import SS_Customer from '@/models/SS_Customer';
import { verifyAdmin } from '@/middleware/admin-auth';

// GET single order details
export async function GET(request, { params }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { orderId } = await params;

    console.log('📦 Fetching order details for:', orderId);

    // FIX: Enhanced population with multiple fallbacks
    const order = await SS_Order.findOne({ _id: orderId })
      .populate({
        path: 'SS_CUSTOMER_ID',
        model: SS_User,
        select: 'SS_USER_EMAIL'
      })
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('📦 Order found:', order.SS_ORDER_NUMBER);
    console.log('📦 Raw customer data:', order.SS_CUSTOMER_ID);

    const payment = await SS_Payment.findOne({ SS_ORDER_ID: orderId }).lean();

    // FIX: Enhanced customer data extraction with multiple fallbacks
    let customerEmail = 'customer@example.com'; // Default fallback
    let customerName = 'Unknown Customer';
    let customerPhone = 'N/A';

    // Method 1: Get email from populated user
    if (order.SS_CUSTOMER_ID && typeof order.SS_CUSTOMER_ID === 'object') {
      customerEmail = order.SS_CUSTOMER_ID.SS_USER_EMAIL || 'customer@example.com';
      console.log('📦 Email from populated user:', customerEmail);
    } 
    // Method 2: If SS_CUSTOMER_ID is just an ObjectId, fetch user separately
    else if (order.SS_CUSTOMER_ID) {
      try {
        const user = await SS_User.findById(order.SS_CUSTOMER_ID).select('SS_USER_EMAIL').lean();
        if (user) {
          customerEmail = user.SS_USER_EMAIL || 'customer@example.com';
          console.log('📦 Email from separate user fetch:', customerEmail);
        }
      } catch (error) {
        console.error('📦 Error fetching user:', error.message);
      }
    }

    // Method 3: Try to find customer profile for name and phone
    if (order.SS_CUSTOMER_ID) {
      try {
        const customerProfile = await SS_Customer.findOne({ 
          SS_USER_ID: order.SS_CUSTOMER_ID._id || order.SS_CUSTOMER_ID 
        }).lean();
        
        if (customerProfile) {
          customerName = `${customerProfile.SS_FIRST_NAME || ''} ${customerProfile.SS_LAST_NAME || ''}`.trim() || customerEmail;
          customerPhone = customerProfile.SS_MOBILE_NUMBER || 'N/A';
          console.log('📦 Customer profile found:', { customerName, customerPhone });
        }
      } catch (error) {
        console.error('📦 Error fetching customer profile:', error.message);
      }
    }

    // Method 4: Final fallback to shipping address
    if (customerName === 'Unknown Customer' && order.SS_SHIPPING_ADDRESS?.SS_FULL_NAME) {
      customerName = order.SS_SHIPPING_ADDRESS.SS_FULL_NAME;
    }
    if (customerPhone === 'N/A' && order.SS_SHIPPING_ADDRESS?.SS_MOBILE) {
      customerPhone = order.SS_SHIPPING_ADDRESS.SS_MOBILE;
    }

    // Method 5: If name is still unknown, use email as name
    if (customerName === 'Unknown Customer') {
      customerName = customerEmail;
    }

    console.log('📦 Final customer data:', { 
      customerName, 
      customerEmail, 
      customerPhone
    });

    const transformedOrder = {
      id: order._id.toString(),
      orderNumber: order.SS_ORDER_NUMBER,
      customer: {
        id: order.SS_CUSTOMER_ID?._id?.toString() || order.SS_CUSTOMER_ID?.toString(),
        name: customerName,
        email: customerEmail, // This will ALWAYS have a value
        phone: customerPhone
      },
      date: order.SS_CREATED_DATE,
      status: order.SS_ORDER_STATUS,
      paymentStatus: order.SS_PAYMENT_STATUS,
      paymentMethod: order.SS_PAYMENT_METHOD,
      items: (order.SS_ORDER_ITEMS || []).map(item => ({
        id: item.SS_PRODUCT_ID?.toString(),
        name: item.SS_PRODUCT_NAME || 'Unknown Product',
        price: item.SS_UNIT_PRICE || 0,
        quantity: item.SS_QUANTITY || 0,
        image: item.SS_PRODUCT_IMAGE || '/placeholder-image.jpg',
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
        id: payment._id.toString(),
        method: payment.SS_PAYMENT_METHOD,
        status: payment.SS_PAYMENT_STATUS,
        transactionId: payment.SS_TRANSACTION_ID,
        amount: payment.SS_AMOUNT,
        date: payment.SS_PAYMENT_DATE
      } : null,
      shipping: order.SS_SHIPPING_DETAILS || {},
      customerNotes: order.SS_CUSTOMER_NOTES || '',
      adminNotes: order.SS_ADMIN_NOTES || '',
      tracking: generateTrackingTimeline(order)
    };

    return NextResponse.json({
      success: true,
      data: {
        order: transformedOrder
      }
    });

  } catch (error) {
    console.error('Get admin order detail error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// UPDATE order status and details (keep this as is)
export async function PATCH(request, { params }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { orderId } = await params;
    const updates = await request.json();

    // Allowed fields to update
    const allowedUpdates = {
      SS_ORDER_STATUS: updates.status,
      SS_PAYMENT_STATUS: updates.paymentStatus,
      SS_SHIPPING_DETAILS: updates.shippingDetails,
      SS_ADMIN_NOTES: updates.adminNotes
    };

    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    // Update shipping details if provided
    if (updates.shippingDetails) {
      allowedUpdates.SS_SHIPPING_DETAILS = {
        ...updates.shippingDetails,
        SS_MODIFIED_DATE: new Date()
      };
    }

    const order = await SS_Order.findByIdAndUpdate(
      orderId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: order._id.toString(),
          status: order.SS_ORDER_STATUS,
          paymentStatus: order.SS_PAYMENT_STATUS,
          shipping: order.SS_SHIPPING_DETAILS,
          adminNotes: order.SS_ADMIN_NOTES
        }
      },
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('Update admin order error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to generate tracking timeline (keep this as is)
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