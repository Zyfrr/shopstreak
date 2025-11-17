import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Product from '@/models/SS_Product';
import { verifyAdmin } from '@/middleware/admin-auth';

// GET single product
export async function GET(request, { params }) {
  try {
    const admin = await verifyAdmin(request);
    await dbConnect();

    // Await the params to resolve the Promise
    const { id } = await params;
    
    const product = await SS_Product.findById(id)
      .populate('SS_ADMIN_VISIBLE.SS_CATEGORY', 'SS_CATEGORY_NAME slug')
      .populate('SS_ADMIN_VISIBLE.SS_SUPPLIER_ID', 'name email phone')
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 401 }
    );
  }
}

// PATCH update product
export async function PATCH(request, { params }) {
  try {
    const admin = await verifyAdmin(request);
    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    const product = await SS_Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Update fields dynamically
    if (body.SS_ADMIN_VISIBLE) {
      Object.keys(body.SS_ADMIN_VISIBLE).forEach(key => {
        product.SS_ADMIN_VISIBLE[key] = body.SS_ADMIN_VISIBLE[key];
      });
    }

    if (body.SS_CUSTOMER_VISIBLE) {
      Object.keys(body.SS_CUSTOMER_VISIBLE).forEach(key => {
        product.SS_CUSTOMER_VISIBLE[key] = body.SS_CUSTOMER_VISIBLE[key];
      });
    }

    if (body.SS_SEO_DATA) {
      Object.keys(body.SS_SEO_DATA).forEach(key => {
        product.SS_SEO_DATA[key] = body.SS_SEO_DATA[key];
      });
    }

    if (body.SS_TAGS) {
      product.SS_TAGS = body.SS_TAGS;
    }

    if (body.SS_VARIANTS) {
      product.SS_VARIANTS = body.SS_VARIANTS;
    }

    await product.save();
    await product.populate('SS_ADMIN_VISIBLE.SS_CATEGORY', 'SS_CATEGORY_NAME slug');
    await product.populate('SS_ADMIN_VISIBLE.SS_SUPPLIER_ID', 'name email');

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 401 }
    );
  }
}

// DELETE product - HARD DELETE (Complete removal)
export async function DELETE(request, { params }) {
  try {
    const admin = await verifyAdmin(request);
    await dbConnect();

    const { id } = await params;
    console.log('Hard deleting product with ID:', id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Find product first to get name for response
    const product = await SS_Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const productName = product.SS_ADMIN_VISIBLE.SS_PRODUCT_NAME;

    // Hard delete - completely remove from database
    await SS_Product.findByIdAndDelete(id);

    console.log('Product hard deleted successfully:', id);

    return NextResponse.json({
      success: true,
      message: `Product "${productName}" permanently deleted`,
      data: {
        id: id,
        name: productName
      }
    });

  } catch (error) {
    console.error('Hard delete product error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete product: ' + error.message 
      },
      { status: 500 }
    );
  }
}