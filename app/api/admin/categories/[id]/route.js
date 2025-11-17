// app/api/admin/categories/[id]/route.js - UPDATED
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Category from '@/models/SS_Category';
import SS_Product from '@/models/SS_Product';
import { verifyAdmin } from '@/middleware/admin-auth';

// GET single category
export async function GET(request, { params }) {
  try {
    const admin = await verifyAdmin(request);
    await dbConnect();

    const { id } = await params;
    
    const category = await SS_Category.findById(id)
      .select('SS_CATEGORY_NAME SS_CATEGORY_DESCRIPTION _id SS_SEO_DATA.slug SS_IS_ACTIVE SS_DISPLAY_ORDER SS_PRODUCT_COUNT')
      .lean();

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    const transformedCategory = {
      _id: category._id,
      SS_CATEGORY_NAME: category.SS_CATEGORY_NAME,
      SS_CATEGORY_DESCRIPTION: category.SS_CATEGORY_DESCRIPTION,
      slug: category.SS_SEO_DATA?.slug || '',
      SS_IS_ACTIVE: category.SS_IS_ACTIVE,
      SS_DISPLAY_ORDER: category.SS_DISPLAY_ORDER,
      SS_PRODUCT_COUNT: category.SS_PRODUCT_COUNT || 0
    };

    return NextResponse.json({
      success: true,
      data: transformedCategory
    });

  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 401 }
    );
  }
}

// PATCH update category
export async function PATCH(request, { params }) {
  try {
    const admin = await verifyAdmin(request);
    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    
    const category = await SS_Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (body.SS_CATEGORY_NAME) category.SS_CATEGORY_NAME = body.SS_CATEGORY_NAME;
    if (body.SS_CATEGORY_DESCRIPTION !== undefined) category.SS_CATEGORY_DESCRIPTION = body.SS_CATEGORY_DESCRIPTION;
    if (body.SS_DISPLAY_ORDER !== undefined) category.SS_DISPLAY_ORDER = body.SS_DISPLAY_ORDER;
    if (body.SS_IS_ACTIVE !== undefined) {
      category.SS_IS_ACTIVE = body.SS_IS_ACTIVE;
      
      // Update all products in this category to match the category status
      await SS_Product.updateMany(
        { 'SS_ADMIN_VISIBLE.SS_CATEGORY': id },
        { 'SS_ADMIN_VISIBLE.SS_IS_ACTIVE': body.SS_IS_ACTIVE }
      );
    }

    await category.save();

    // Update product count
    const productCount = await SS_Product.countDocuments({ 
      'SS_ADMIN_VISIBLE.SS_CATEGORY': id 
    });
    category.SS_PRODUCT_COUNT = productCount;
    await category.save();

    const transformedCategory = {
      _id: category._id,
      SS_CATEGORY_NAME: category.SS_CATEGORY_NAME,
      SS_CATEGORY_DESCRIPTION: category.SS_CATEGORY_DESCRIPTION,
      slug: category.SS_SEO_DATA?.slug || '',
      SS_IS_ACTIVE: category.SS_IS_ACTIVE,
      SS_DISPLAY_ORDER: category.SS_DISPLAY_ORDER,
      SS_PRODUCT_COUNT: productCount
    };

    return NextResponse.json({
      success: true,
      data: transformedCategory,
      message: `Category ${body.SS_IS_ACTIVE ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE category - PERMANENT DELETE
export async function DELETE(request, { params }) {
  try {
    const admin = await verifyAdmin(request);
    await dbConnect();

    const { id } = await params;
    
    const category = await SS_Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has products
    const productCount = await SS_Product.countDocuments({ 
      'SS_ADMIN_VISIBLE.SS_CATEGORY': id
    });

    if (productCount > 0) {
      // Option 1: Delete all products in this category (PERMANENT DELETE)
      await SS_Product.deleteMany({ 'SS_ADMIN_VISIBLE.SS_CATEGORY': id });
      
      // Option 2: If you want to keep products but remove category reference, use:
      // await SS_Product.updateMany(
      //   { 'SS_ADMIN_VISIBLE.SS_CATEGORY': id },
      //   { $unset: { 'SS_ADMIN_VISIBLE.SS_CATEGORY': 1 } }
      // );
    }

    // Delete the category
    await SS_Category.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Category and ${productCount} associated products deleted permanently`
    });

  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}