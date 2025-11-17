import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_User from '@/models/SS_User';
import SS_Customer from '@/models/SS_Customer';
import SS_Order from '@/models/SS_Order';
import mongoose from 'mongoose';
import { verifyAdmin } from '@/middleware/admin-auth';

// GET all customers with search, pagination, and stats
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
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'SS_CREATED_DATE';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log('🔍 Customer Search query:', search);

    // Build base query for filtered results
    let userQuery = { SS_USER_ROLE: 'customer' };

    // Enhanced search with better space and case handling
    if (search && search.trim() !== '') {
      const searchTerm = search.trim().toLowerCase();
      
      // Create search conditions array
      const searchConditions = [
        { SS_USER_EMAIL: { $regex: searchTerm, $options: 'i' } }
      ];

      // Enhanced customer profile search with space tolerance
      try {
        // Split search term into words for better name matching
        const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
        
        let nameSearchConditions = [];
        
        if (searchWords.length > 0) {
          // Search for each word in first name and last name
          searchWords.forEach(word => {
            if (word.length > 1) { // Only search for words with more than 1 character
              const wordRegex = { $regex: word, $options: 'i' };
              nameSearchConditions.push(
                { SS_FIRST_NAME: wordRegex },
                { SS_LAST_NAME: wordRegex }
              );
            }
          });
        }

        // Also search for full name concatenation
        const fullNameRegex = { 
          $regex: searchTerm.replace(/\s+/g, '.*'), 
          $options: 'i' 
        };
        
        nameSearchConditions.push({
          $expr: {
            $regexMatch: {
              input: { $concat: ["$SS_FIRST_NAME", " ", "$SS_LAST_NAME"] },
              regex: searchTerm.replace(/\s+/g, '.*'),
              options: 'i'
            }
          }
        });

        // Search mobile number
        nameSearchConditions.push({ 
          SS_MOBILE_NUMBER: { $regex: searchTerm, $options: 'i' } 
        });

        const matchingCustomers = await SS_Customer.find({
          $or: nameSearchConditions
        }).select('SS_USER_ID').lean();

        if (matchingCustomers.length > 0) {
          const matchingUserIds = matchingCustomers.map(c => c.SS_USER_ID);
          searchConditions.push({ _id: { $in: matchingUserIds } });
        }
      } catch (profileError) {
        console.log('Profile search error:', profileError);
      }

      userQuery.$or = searchConditions;
    }

    // Filter by status
    if (status !== 'all') {
      userQuery.SS_USER_STATUS = status;
    }

    // Get TOTAL stats (unfiltered) for the cards - FIXED
    const totalStats = await Promise.all([
      // Total Customers (all time)
      SS_User.countDocuments({ SS_USER_ROLE: 'customer' }),
      
      // Active Customers (all time)
      SS_User.countDocuments({ 
        SS_USER_ROLE: 'customer',
        SS_USER_STATUS: 'active' 
      }),
      
      // Inactive Customers (all time)
      SS_User.countDocuments({ 
        SS_USER_ROLE: 'customer',
        SS_USER_STATUS: 'inactive' 
      }),
      
      // Suspended Customers (all time)
      SS_User.countDocuments({ 
        SS_USER_ROLE: 'customer',
        SS_USER_STATUS: 'suspended' 
      }),
      
      // Total Revenue (all time) - FIXED: Get from orders
      SS_Order.aggregate([
        {
          $match: { 
            SS_PAYMENT_STATUS: 'paid',
            SS_ORDER_STATUS: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$SS_ORDER_SUMMARY.SS_TOTAL_AMOUNT' }
          }
        }
      ])
    ]);

    const [totalCustomers, activeCustomers, inactiveCustomers, suspendedCustomers, revenueStats] = totalStats;

    // Get FILTERED counts for pagination
    const filteredTotalCustomers = await SS_User.countDocuments(userQuery);

    // Get users with pagination (filtered results)
    const skip = (page - 1) * limit;
    const users = await SS_User.find(userQuery)
      .select('SS_USER_EMAIL SS_USER_STATUS SS_CREATED_DATE SS_ONBOARDING_STATUS')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log('📊 Found filtered users:', users.length);

    // Enhanced customer data with orders and profile info
    const customers = await Promise.all(
      users.map(async (user) => {
        try {
          // Get customer profile
          const customerProfile = await SS_Customer.findOne({ 
            SS_USER_ID: user._id 
          }).lean();

          // Get customer orders
          const customerOrders = await SS_Order.find({ 
            SS_CUSTOMER_ID: user._id 
          }).lean();

          // Calculate order stats
          const totalOrders = customerOrders.length;
          const totalSpent = customerOrders
            .filter(order => order.SS_PAYMENT_STATUS === 'paid')
            .reduce((sum, order) => sum + (order.SS_ORDER_SUMMARY?.SS_TOTAL_AMOUNT || 0), 0);

          // Get last order date
          const lastOrder = customerOrders
            .sort((a, b) => new Date(b.SS_CREATED_DATE) - new Date(a.SS_CREATED_DATE))[0];

          return {
            id: user._id.toString(),
            email: user.SS_USER_EMAIL,
            status: user.SS_USER_STATUS,
            joinDate: user.SS_CREATED_DATE,
            onboardingStatus: user.SS_ONBOARDING_STATUS,
            profile: customerProfile ? {
              firstName: customerProfile.SS_FIRST_NAME,
              lastName: customerProfile.SS_LAST_NAME,
              mobile: customerProfile.SS_MOBILE_NUMBER,
              gender: customerProfile.SS_GENDER,
              dateOfBirth: customerProfile.SS_DATE_OF_BIRTH,
              addresses: customerProfile.SS_ADDRESSES?.length || 0
            } : null,
            stats: {
              totalOrders,
              totalSpent,
              lastOrderDate: lastOrder?.SS_CREATED_DATE || null,
              averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
            }
          };
        } catch (error) {
          console.error('Error processing user:', user._id, error);
          return {
            id: user._id.toString(),
            email: user.SS_USER_EMAIL,
            status: user.SS_USER_STATUS,
            joinDate: user.SS_CREATED_DATE,
            onboardingStatus: user.SS_ONBOARDING_STATUS,
            profile: null,
            stats: {
              totalOrders: 0,
              totalSpent: 0,
              lastOrderDate: null,
              averageOrderValue: 0
            }
          };
        }
      })
    );

    const totalPages = Math.ceil(filteredTotalCustomers / limit);

    return NextResponse.json({
      success: true,
      data: {
        customers: customers || [], // Ensure always array
        pagination: {
          page,
          limit,
          total: filteredTotalCustomers,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats: {
          // Use TOTAL stats (unfiltered) for the cards
          totalCustomers: totalCustomers || 0,
          activeCustomers: activeCustomers || 0,
          inactiveCustomers: inactiveCustomers || 0,
          suspendedCustomers: suspendedCustomers || 0,
          totalRevenue: revenueStats[0]?.totalRevenue || 0
        }
      }
    });

  } catch (error) {
    console.error('Get admin customers error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        data: {
          customers: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          },
          stats: {
            totalCustomers: 0,
            activeCustomers: 0,
            inactiveCustomers: 0,
            suspendedCustomers: 0,
            totalRevenue: 0
          }
        }
      },
      { status: 500 }
    );
  }
}