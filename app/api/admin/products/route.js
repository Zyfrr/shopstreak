// app/api/admin/products/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Product from '@/models/SS_Product';
import SS_Category from '@/models/SS_Category';
import { verifyAdmin } from '@/middleware/admin-auth';

// GET all products with search, pagination, filters
export async function GET(request) {
  try {
    const admin = await verifyAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'SS_CREATED_DATE';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    await dbConnect();

    // Build query
    let query = {};
    
    // Search in multiple fields
    if (search) {
      query.$or = [
        { 'SS_ADMIN_VISIBLE.SS_PRODUCT_NAME': { $regex: search, $options: 'i' } },
        { 'SS_CUSTOMER_VISIBLE.SS_PRODUCT_TITLE': { $regex: search, $options: 'i' } },
        { 'SS_SEO_DATA.slug': { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      const categoryDoc = await SS_Category.findOne({ 
        $or: [
          { name: { $regex: category, $options: 'i' } },
          { slug: { $regex: category, $options: 'i' } }
        ]
      });
      if (categoryDoc) {
        query['SS_ADMIN_VISIBLE.SS_CATEGORY'] = categoryDoc._id;
      }
    }

    // Filter by status
    if (status) {
      query['SS_ADMIN_VISIBLE.SS_IS_ACTIVE'] = status === 'active';
    }

    // Sort configuration
    const sortConfig = {};
    if (sortBy.includes('SS_ADMIN_VISIBLE.')) {
      sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy.includes('SS_CUSTOMER_VISIBLE.')) {
      sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
  // In your GET products API, update the population and sorting
const products = await SS_Product.find(query)
  .populate('SS_ADMIN_VISIBLE.SS_CATEGORY', 'SS_CATEGORY_NAME slug')
  .populate('SS_ADMIN_VISIBLE.SS_SUPPLIER_ID', 'name email')
  .sort(sortConfig)
  .skip(skip)
  .limit(limit)
  .lean();

    const total = await SS_Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 401 }
    );
  }
}

// POST create new product
export async function POST(request) {
  try {
    const admin = await verifyAdmin(request);
    await dbConnect();

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'SS_PRODUCT_NAME', 'SS_PRODUCT_DESCRIPTION', 'SS_CATEGORY',
      'SS_COST_PRICE', 'SS_SELLING_PRICE', 'SS_STOCK_QUANTITY'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Generate slug
    const slug = body.SS_PRODUCT_NAME
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check if slug exists
    const existingProduct = await SS_Product.findOne({ 'SS_SEO_DATA.slug': slug });
    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product with similar name already exists' },
        { status: 400 }
      );
    }

    const productData = {
      SS_ADMIN_VISIBLE: {
        SS_PRODUCT_NAME: body.SS_PRODUCT_NAME,
        SS_PRODUCT_DESCRIPTION: body.SS_PRODUCT_DESCRIPTION,
        SS_CATEGORY: body.SS_CATEGORY,
        SS_SUBCATEGORY: body.SS_SUBCATEGORY,
        SS_BRAND: body.SS_BRAND,
        SS_SUPPLIER_ID: body.SS_SUPPLIER_ID,
        SS_COST_PRICE: parseFloat(body.SS_COST_PRICE),
        SS_SELLING_PRICE: parseFloat(body.SS_SELLING_PRICE),
        SS_DISCOUNT_PERCENTAGE: parseFloat(body.SS_DISCOUNT_PERCENTAGE) || 0,
        SS_DISCOUNT_AMOUNT: parseFloat(body.SS_DISCOUNT_AMOUNT) || 0,
        SS_STOCK_QUANTITY: parseInt(body.SS_STOCK_QUANTITY),
        SS_MIN_STOCK_ALERT: parseInt(body.SS_MIN_STOCK_ALERT) || 10,
        SS_SUPPLIER_SKU: body.SS_SUPPLIER_SKU,
        SS_PRODUCT_IMAGES: body.SS_PRODUCT_IMAGES || [],
        SS_RETURN_POLICY: body.SS_RETURN_POLICY || 'no_return',
        SS_SHIPPING_DETAILS: body.SS_SHIPPING_DETAILS || {},
        SS_TAX_RATE: parseFloat(body.SS_TAX_RATE) || 0,
        SS_IS_ACTIVE: body.SS_IS_ACTIVE !== false,
        SS_IS_FEATURED: body.SS_IS_FEATURED || false,
        SS_TRENDING_SCORE: parseInt(body.SS_TRENDING_SCORE) || 0
      },
      SS_CUSTOMER_VISIBLE: {
        SS_PRODUCT_TITLE: body.SS_PRODUCT_TITLE || body.SS_PRODUCT_NAME,
        SS_SHORT_DESCRIPTION: body.SS_SHORT_DESCRIPTION,
        SS_HIGHLIGHTS: body.SS_HIGHLIGHTS || [],
        SS_SPECIFICATIONS: body.SS_SPECIFICATIONS || {},
        SS_DELIVERY_ESTIMATE: body.SS_DELIVERY_ESTIMATE || { minDays: 3, maxDays: 7 },
        SS_WARRANTY: body.SS_WARRANTY || '',
        SS_MAIN_IMAGE: body.SS_MAIN_IMAGE || '',
        SS_GALLERY_IMAGES: body.SS_GALLERY_IMAGES || []
      },
      SS_SEO_DATA: {
        metaTitle: body.metaTitle || body.SS_PRODUCT_NAME,
        metaDescription: body.metaDescription || body.SS_SHORT_DESCRIPTION,
        slug
      },
      SS_TAGS: body.SS_TAGS || [],
      SS_VARIANTS: body.SS_VARIANTS || []
    };

    const product = new SS_Product(productData);
    await product.save();

    // Populate for response
    await product.populate('SS_ADMIN_VISIBLE.SS_CATEGORY', 'name slug');
    await product.populate('SS_ADMIN_VISIBLE.SS_SUPPLIER_ID', 'name email');

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 401 }
    );
  }
}