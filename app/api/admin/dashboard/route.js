import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Order from '@/models/SS_Order';
import SS_Product from '@/models/SS_Product';
import SS_User from '@/models/SS_User';
import SS_Customer from '@/models/SS_Customer';
import { verifyAdmin } from '@/middleware/admin-auth';

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
    const period = searchParams.get('period') || 'month';

    // Calculate date range based on period
    const getDateRange = () => {
      const now = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(now.getMonth() - 6);
      }
      
      return { startDate, endDate: now };
    };

    const { startDate, endDate } = getDateRange();

    // Get dashboard data in parallel
    const [
      totalRevenueResult,
      totalOrders,
      totalCustomers,
      totalProducts,
      revenueTrend,
      recentOrders,
      topProducts
    ] = await Promise.all([
      // Total Revenue
      SS_Order.aggregate([
        {
          $match: {
            SS_PAYMENT_STATUS: 'paid',
            SS_CREATED_DATE: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$SS_ORDER_SUMMARY.SS_TOTAL_AMOUNT' }
          }
        }
      ]),
      
      // Total Orders
      SS_Order.countDocuments({
        SS_CREATED_DATE: { $gte: startDate, $lte: endDate }
      }),
      
      // Total Customers
      SS_Customer.countDocuments({
        SS_CREATED_DATE: { $gte: startDate, $lte: endDate }
      }),
      
      // Total Products
      SS_Product.countDocuments({
        SS_CREATED_DATE: { $gte: startDate, $lte: endDate }
      }),
      
      // Revenue Trend Data
      SS_Order.aggregate([
        {
          $match: {
            SS_PAYMENT_STATUS: 'paid',
            SS_CREATED_DATE: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: period === 'year' ? '%Y-%m' : '%Y-%m-%d',
                date: '$SS_CREATED_DATE'
              }
            },
            revenue: { $sum: '$SS_ORDER_SUMMARY.SS_TOTAL_AMOUNT' },
            orders: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $limit: 6
        }
      ]),
      
      // Recent Orders with proper customer data
      SS_Order.find({})
        .populate({
          path: 'SS_CUSTOMER_ID',
          select: 'SS_USER_EMAIL SS_USER_NAME',
          model: SS_User
        })
        .sort({ SS_CREATED_DATE: -1 })
        .limit(6)
        .lean(),
      
      // Top Products - Fixed to use actual sales data
      SS_Product.aggregate([
        {
          $match: {
            'SS_SALES_DATA.TOTAL_SOLD': { $gt: 0 }
          }
        },
        {
          $project: {
            name: '$SS_CUSTOMER_VISIBLE.SS_PRODUCT_TITLE',
            sales: '$SS_SALES_DATA.TOTAL_REVENUE',
            views: '$SS_CUSTOMER_VISIBLE.SS_VIEW_COUNT',
            stock: '$SS_ADMIN_VISIBLE.SS_STOCK_QUANTITY',
            rating: '$SS_CUSTOMER_VISIBLE.SS_AVERAGE_RATING',
            soldCount: '$SS_SALES_DATA.TOTAL_SOLD'
          }
        },
        {
          $sort: { sales: -1 }
        },
        {
          $limit: 5
        }
      ])
    ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Format recent orders with proper customer data
    const formattedRecentOrders = await Promise.all(
      recentOrders.map(async (order) => {
        // Get customer profile data
        let customerProfile = null;
        let customerName = 'Unknown Customer';
        let customerPhone = 'Not provided';
        
        try {
          customerProfile = await SS_Customer.findOne({ 
            SS_USER_ID: order.SS_CUSTOMER_ID?._id 
          }).lean();
          
          if (customerProfile) {
            customerName = `${customerProfile.SS_FIRST_NAME || ''} ${customerProfile.SS_LAST_NAME || ''}`.trim();
            customerPhone = customerProfile.SS_MOBILE_NUMBER || 'Not provided';
          }
        } catch (error) {
          console.error('Error fetching customer profile:', error);
        }

        // Fallback to user email if no customer profile
        if (!customerProfile && order.SS_CUSTOMER_ID) {
          customerName = order.SS_CUSTOMER_ID.SS_USER_EMAIL?.split('@')[0] || 'Unknown Customer';
        }

        const customerEmail = order.SS_CUSTOMER_ID?.SS_USER_EMAIL || 'Not provided';

        // Extract shipping address - use from order first, then from customer profile
        let customerAddress = 'Address not provided';
        if (order.SS_SHIPPING_ADDRESS) {
          const shipping = order.SS_SHIPPING_ADDRESS;
          customerAddress = [
            shipping.SS_ADDRESS_LINE1,
            shipping.SS_CITY,
            shipping.SS_STATE,
            shipping.SS_PINCODE
          ].filter(Boolean).join(', ');
        } else if (customerProfile?.SS_ADDRESSES?.length > 0) {
          const defaultAddress = customerProfile.SS_ADDRESSES.find(addr => addr.SS_IS_DEFAULT) || 
                                customerProfile.SS_ADDRESSES[0];
          customerAddress = [
            defaultAddress.SS_STREET_ADDRESS,
            defaultAddress.SS_CITY,
            defaultAddress.SS_STATE,
            defaultAddress.SS_POSTAL_CODE
          ].filter(Boolean).join(', ');
        }

        const orderNumber = order.SS_ORDER_NUMBER || `ORD${order._id.toString().slice(-8).toUpperCase()}`;
        
        return {
          id: order._id.toString(),
          orderNumber: orderNumber,
          customer: customerName,
          customerEmail: customerEmail,
          customerPhone: customerPhone,
          customerAddress: customerAddress,
          paymentMethod: order.SS_PAYMENT_METHOD || 'Unknown',
          amount: order.SS_ORDER_SUMMARY?.SS_TOTAL_AMOUNT || 0,
          status: order.SS_ORDER_STATUS || 'pending',
          date: order.SS_CREATED_DATE
        };
      })
    );

    // Format top products
    const formattedTopProducts = topProducts.map(product => ({
      id: product._id?.toString() || Math.random().toString(),
      name: product.name || 'Unknown Product',
      sales: product.sales || 0,
      views: product.views || 0,
      stock: product.stock || 0,
      rating: product.rating || 0,
      soldCount: product.soldCount || 0
    }));

    // Format revenue trend
    const formattedRevenueTrend = revenueTrend.map(item => ({
      period: item._id,
      revenue: item.revenue || 0,
      orders: item.orders || 0
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalRevenue,
          totalOrders,
          totalCustomers,
          totalProducts,
          period
        },
        revenueTrend: formattedRevenueTrend,
        recentOrders: formattedRecentOrders,
        topProducts: formattedTopProducts
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        // Provide fallback data
        data: {
          stats: {
            totalRevenue: 0,
            totalOrders: 0,
            totalCustomers: 0,
            totalProducts: 0,
            period: period || 'month'
          },
          revenueTrend: [],
          recentOrders: [],
          topProducts: []
        }
      },
      { status: 500 }
    );
  }
}