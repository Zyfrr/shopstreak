// app/api/admin/categories/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Category from '@/models/SS_Category';
import { verifyAdmin } from '@/middleware/admin-auth';

// GET all categories
export async function GET(request) {
  try {
    const admin = await verifyAdmin(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const query = includeInactive ? {} : { SS_IS_ACTIVE: true };
    
    const categories = await SS_Category.find(query)
      .sort({ SS_DISPLAY_ORDER: 1, SS_CATEGORY_NAME: 1 })
      .select('SS_CATEGORY_NAME SS_CATEGORY_DESCRIPTION _id SS_SEO_DATA.slug SS_IS_ACTIVE SS_PRODUCT_COUNT')
      .lean();

    // Transform the data to match the frontend expectations
    const transformedCategories = categories.map(category => ({
      _id: category._id,
      SS_CATEGORY_NAME: category.SS_CATEGORY_NAME,
      SS_CATEGORY_DESCRIPTION: category.SS_CATEGORY_DESCRIPTION,
      slug: category.SS_SEO_DATA?.slug || '',
      SS_IS_ACTIVE: category.SS_IS_ACTIVE,
      SS_PRODUCT_COUNT: category.SS_PRODUCT_COUNT || 0
    }));

    return NextResponse.json({
      success: true,
      data: {
        categories: transformedCategories
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 401 }
    );
  }
}

// POST create new category
export async function POST(request) {
  try {
    const admin = await verifyAdmin(request);
    await dbConnect();

    const body = await request.json();
    
    // Validate required fields
    if (!body.SS_CATEGORY_NAME) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = body.SS_CATEGORY_NAME
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check if category exists
    const existingCategory = await SS_Category.findOne({ 
      $or: [
        { SS_CATEGORY_NAME: body.SS_CATEGORY_NAME },
        { 'SS_SEO_DATA.slug': slug }
      ]
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category with this name already exists' },
        { status: 400 }
      );
    }

    const categoryData = {
      SS_CATEGORY_NAME: body.SS_CATEGORY_NAME,
      SS_CATEGORY_DESCRIPTION: body.SS_CATEGORY_DESCRIPTION,
      SS_PARENT_CATEGORY: body.SS_PARENT_CATEGORY,
      SS_CATEGORY_IMAGE: body.SS_CATEGORY_IMAGE,
      SS_CATEGORY_ICON: body.SS_CATEGORY_ICON,
      SS_SEO_DATA: {
        metaTitle: body.metaTitle || body.SS_CATEGORY_NAME,
        metaDescription: body.metaDescription || body.SS_CATEGORY_DESCRIPTION,
        slug
      },
      SS_DISPLAY_ORDER: body.SS_DISPLAY_ORDER || 0,
      SS_IS_ACTIVE: body.SS_IS_ACTIVE !== false
    };

    const category = new SS_Category(categoryData);
    await category.save();

    // Return transformed category
    const transformedCategory = {
      _id: category._id,
      SS_CATEGORY_NAME: category.SS_CATEGORY_NAME,
      SS_CATEGORY_DESCRIPTION: category.SS_CATEGORY_DESCRIPTION,
      slug: category.SS_SEO_DATA?.slug || '',
      SS_IS_ACTIVE: category.SS_IS_ACTIVE,
      SS_PRODUCT_COUNT: 0
    };

    return NextResponse.json({
      success: true,
      data: transformedCategory,
      message: 'Category created successfully'
    });

  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}