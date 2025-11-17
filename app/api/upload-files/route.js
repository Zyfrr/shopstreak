// app/api/upload-files/route.js
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = "nodejs";

// Allowed file types and sizes
const ALLOWED_FILE_TYPES = {
  'image/jpeg': 'image',
  'image/jpg': 'image', 
  'image/png': 'image',
  'application/pdf': 'raw'
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES[file.type]) {
      return NextResponse.json(
        { error: "File type not allowed. Allowed types: JPEG, JPG, PNG, PDF" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine resource type
    const resourceType = ALLOWED_FILE_TYPES[file.type];
    const isImage = resourceType === 'image';

    // Upload options - SIMPLIFIED to avoid transformation errors
    const uploadOptions = {
      folder: "user_documents",
      resource_type: resourceType,
    };

    // Only add image-specific optimizations for images
    if (isImage) {
      uploadOptions.quality = "auto:good";
      // Remove format: "auto" as it can cause issues
    }

    // Upload to Cloudinary
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    const uploadResult = uploadResponse;

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      resourceType: resourceType
    });

  } catch (error) {
    console.error("Upload Error:", error);
    
    // More specific error handling
    if (error.message.includes('Invalid extension')) {
      return NextResponse.json(
        { error: "Cloudinary configuration error. Please check upload settings." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "File upload failed" },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';