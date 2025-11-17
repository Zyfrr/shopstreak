// app/api/admin/analytics/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Order from '@/models/SS_Order';
import SS_Product from '@/models/SS_Product';
import SS_User from '@/models/SS_User';
import SS_Category from '@/models/SS_Category';
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

    // Get analytics data in parallel
    const [
      totalRevenueResult,
      totalOrders,
      totalCustomers,
      totalProducts,
      revenueTrend,
      categorySalesData
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
      SS_User.countDocuments({
        SS_USER_ROLE: 'customer',
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
      
      // Category Performance Query
      SS_Order.aggregate([
        {
          $match: {
            SS_PAYMENT_STATUS: 'paid',
            SS_CREATED_DATE: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $unwind: '$SS_ORDER_ITEMS'
        },
        {
          $lookup: {
            from: 'ss_products',
            localField: 'SS_ORDER_ITEMS.SS_PRODUCT_ID',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $lookup: {
            from: 'ss_categories',
            localField: 'product.SS_ADMIN_VISIBLE.SS_CATEGORY',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $unwind: {
            path: '$category',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: {
              categoryId: '$category._id',
              categoryName: '$category.SS_CATEGORY_NAME'
            },
            totalSales: { $sum: '$SS_ORDER_ITEMS.SS_TOTAL_PRICE' },
            orderCount: { $sum: 1 }
          }
        },
        {
          $sort: { totalSales: -1 }
        }
      ])
    ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Format category performance data
    let formattedCategoryData = categorySalesData.map(item => {
      const categoryName = item._id.categoryName || 'Uncategorized';
      const categoryId = item._id.categoryId;
      
      return {
        category: categoryName,
        categoryId: categoryId,
        sales: item.totalSales || 0,
        orders: item.orderCount || 0,
        percentage: totalRevenue > 0 ? Math.round((item.totalSales / totalRevenue) * 100) : 0
      };
    });

    // Handle empty category data
    if (formattedCategoryData.length === 0) {
      const allCategories = await SS_Category.find({ SS_IS_ACTIVE: true })
        .select('SS_CATEGORY_NAME _id')
        .lean();

      formattedCategoryData = allCategories.map(cat => ({
        category: cat.SS_CATEGORY_NAME,
        categoryId: cat._id,
        sales: 0,
        orders: 0,
        percentage: 0
      }));

      if (formattedCategoryData.length === 0) {
        formattedCategoryData = [
          { category: 'Electronics', sales: 0, orders: 0, percentage: 0 },
          { category: 'Fashion', sales: 0, orders: 0, percentage: 0 },
          { category: 'Home & Kitchen', sales: 0, orders: 0, percentage: 0 },
          { category: 'Sports', sales: 0, orders: 0, percentage: 0 },
          { category: 'Books', sales: 0, orders: 0, percentage: 0 }
        ];
      }
    }

    // Filter out uncategorized items
    formattedCategoryData = formattedCategoryData.filter(item => item.category && item.category !== 'Uncategorized');

    // Mock customer acquisition data
    const customerAcquisition = revenueTrend.map(item => ({
      period: item._id,
      newCustomers: Math.floor(Math.random() * 50),
      returningCustomers: Math.floor(Math.random() * 30)
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
        categoryPerformance: formattedCategoryData,
        customerAcquisition: customerAcquisition
      }
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}