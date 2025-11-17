import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SS_Product from '@/models/SS_Product';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit')) || 8;

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Enhanced search with better ranking
    const products = await SS_Product.aggregate([
      {
        $match: {
          'SS_ADMIN_VISIBLE.SS_IS_ACTIVE': true,
          $or: [
            { 'SS_ADMIN_VISIBLE.SS_PRODUCT_NAME': { $regex: query, $options: 'i' } },
            { 'SS_CUSTOMER_VISIBLE.SS_PRODUCT_TITLE': { $regex: query, $options: 'i' } },
            { 'SS_CUSTOMER_VISIBLE.SS_SHORT_DESCRIPTION': { $regex: query, $options: 'i' } },
            { 'SS_TAGS': { $in: [new RegExp(query, 'i')] } },
            { 'SS_ADMIN_VISIBLE.SS_BRAND': { $regex: query, $options: 'i' } },
            { 'SS_ADMIN_VISIBLE.SS_SUBCATEGORY': { $regex: query, $options: 'i' } }
          ]
        }
      },
      {
        $addFields: {
          // Score products based on search relevance
          score: {
            $add: [
              { $cond: [{ $regexMatch: { input: '$SS_ADMIN_VISIBLE.SS_PRODUCT_NAME', regex: new RegExp(query, 'i') } }, 10, 0] },
              { $cond: [{ $regexMatch: { input: '$SS_CUSTOMER_VISIBLE.SS_PRODUCT_TITLE', regex: new RegExp(query, 'i') } }, 8, 0] },
              { $cond: [{ $regexMatch: { input: '$SS_ADMIN_VISIBLE.SS_BRAND', regex: new RegExp(query, 'i') } }, 6, 0] },
              { $cond: [{ $in: [new RegExp(query, 'i'), '$SS_TAGS'] }, 4, 0] },
              { $cond: [{ $regexMatch: { input: '$SS_CUSTOMER_VISIBLE.SS_SHORT_DESCRIPTION', regex: new RegExp(query, 'i') } }, 2, 0] },
              // Boost trending and high-rated products
              { $multiply: ['$SS_CUSTOMER_VISIBLE.SS_AVERAGE_RATING', 0.5] },
              { $multiply: ['$SS_ADMIN_VISIBLE.SS_TRENDING_SCORE', 0.01] }
            ]
          }
        }
      },
      {
        $sort: { score: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 1,
          'SS_ADMIN_VISIBLE': 1,
          'SS_CUSTOMER_VISIBLE': 1,
          'SS_SEO_DATA': 1,
          score: 1
        }
      }
    ]);

    const transformedProducts = products.map(product => ({
      id: product._id.toString(),
      name: product.SS_CUSTOMER_VISIBLE?.SS_PRODUCT_TITLE || product.SS_ADMIN_VISIBLE.SS_PRODUCT_NAME,
      category: product.SS_ADMIN_VISIBLE.SS_CATEGORY?.SS_CATEGORY_NAME || 'Uncategorized',
      price: product.SS_ADMIN_VISIBLE.SS_SELLING_PRICE,
      image: product.SS_CUSTOMER_VISIBLE?.SS_MAIN_IMAGE || '/placeholder.svg',
      slug: product.SS_SEO_DATA?.slug,
      rating: product.SS_CUSTOMER_VISIBLE?.SS_AVERAGE_RATING || 0,
      brand: product.SS_ADMIN_VISIBLE.SS_BRAND,
      score: product.score
    }));

    return NextResponse.json({
      success: true,
      data: transformedProducts
    });

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}