import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Order from '@/models/SS_Order';
import SS_User from '@/models/SS_User';
import SS_Customer from '@/models/SS_Customer';
import { verifyAdmin } from '@/middleware/admin-auth';

// GET all orders with search, pagination, filters
export async function GET(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sortBy = searchParams.get('sortBy') || 'SS_CREATED_DATE';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    let query = {};

    // Search in multiple fields
    if (search) {
      query.$or = [
        { SS_ORDER_NUMBER: { $regex: search, $options: 'i' } },
        { 'SS_SHIPPING_ADDRESS.SS_FULL_NAME': { $regex: search, $options: 'i' } },
        { 'SS_SHIPPING_ADDRESS.SS_MOBILE': { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by order status
    if (status && status !== 'all') {
      query.SS_ORDER_STATUS = status;
    }

    // Filter by payment status
    if (paymentStatus && paymentStatus !== 'all') {
      query.SS_PAYMENT_STATUS = paymentStatus;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.SS_CREATED_DATE = {};
      if (startDate) {
        query.SS_CREATED_DATE.$gte = new Date(startDate);
      }
      if (endDate) {
        query.SS_CREATED_DATE.$lte = new Date(endDate);
      }
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    console.log('📦 Fetching orders with query:', { page, limit, query: Object.keys(query) });

    // FIX: Enhanced population with better error handling
    const orders = await SS_Order.find(query)
      .populate({
        path: 'SS_CUSTOMER_ID',
        model: SS_User,
        select: 'SS_USER_EMAIL'
      })
      .sort(sortConfig)
      .skip(skip)
      .limit(limit)
      .lean();

    console.log('📦 Found orders:', orders.length);

    const total = await SS_Order.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get status counts for stats
    const statusCounts = await SS_Order.aggregate([
      {
        $group: {
          _id: '$SS_ORDER_STATUS',
          count: { $sum: 1 }
        }
      }
    ]);

    const paymentStatusCounts = await SS_Order.aggregate([
      {
        $group: {
          _id: '$SS_PAYMENT_STATUS',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate total revenue
    const revenueStats = await SS_Order.aggregate([
      {
        $match: { SS_PAYMENT_STATUS: 'paid' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$SS_ORDER_SUMMARY.SS_TOTAL_AMOUNT' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // FIX: Enhanced customer data transformation with fallbacks
    const transformedOrders = await Promise.all(
      orders.map(async (order) => {
        console.log('📦 Processing order:', order.SS_ORDER_NUMBER);
        console.log('📦 Raw customer data:', order.SS_CUSTOMER_ID);

        let customerEmail = 'No email';
        let customerName = 'Unknown Customer';
        let customerPhone = 'N/A';

        // Method 1: Get email from populated user
        if (order.SS_CUSTOMER_ID && typeof order.SS_CUSTOMER_ID === 'object') {
          customerEmail = order.SS_CUSTOMER_ID.SS_USER_EMAIL || 'No email';
          console.log('📦 Email from populated user:', customerEmail);
        } 
        // Method 2: If SS_CUSTOMER_ID is just an ObjectId, fetch user separately
        else if (order.SS_CUSTOMER_ID) {
          try {
            const user = await SS_User.findById(order.SS_CUSTOMER_ID).select('SS_USER_EMAIL').lean();
            if (user) {
              customerEmail = user.SS_USER_EMAIL || 'No email';
              console.log('📦 Email from separate user fetch:', customerEmail);
            }
          } catch (error) {
            console.error('📦 Error fetching user:', error.message);
          }
        }

        // Method 3: Try to find customer profile for additional info
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

        // Method 5: If still no email, use a placeholder
        if (customerEmail === 'No email') {
          customerEmail = 'customer@example.com'; // Fallback placeholder
        }

        console.log('📦 Final customer data for order:', {
          orderNumber: order.SS_ORDER_NUMBER,
          customerEmail,
          customerName,
          customerPhone
        });
        
        return {
          id: order._id.toString(),
          orderNumber: order.SS_ORDER_NUMBER,
          customer: {
            name: customerName,
            email: customerEmail, // This will always have a value
            phone: customerPhone
          },
          date: order.SS_CREATED_DATE,
          amount: order.SS_ORDER_SUMMARY?.SS_TOTAL_AMOUNT || 0,
          status: order.SS_ORDER_STATUS,
          paymentStatus: order.SS_PAYMENT_STATUS,
          items: order.SS_ORDER_ITEMS?.length || 0,
          shippingAddress: order.SS_SHIPPING_ADDRESS
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        orders: transformedOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats: {
          statusCounts: statusCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {}),
          paymentStatusCounts: paymentStatusCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {}),
          totalRevenue: revenueStats[0]?.totalRevenue || 0,
          totalPaidOrders: revenueStats[0]?.totalOrders || 0
        }
      }
    });

  } catch (error) {
    console.error('Get admin orders error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}