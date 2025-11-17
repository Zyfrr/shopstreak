// app/admin/products/new/page.tsx (FIXED VERSION)
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Link, Plus, X, Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Category {
  _id: string;
  SS_CATEGORY_NAME: string;
  SS_CATEGORY_DESCRIPTION?: string;
}

interface ImageUpload {
  url: string;
  alt: string;
  isPrimary: boolean;
  file?: File;
  publicId?: string;
}

interface FormData {
  SS_PRODUCT_NAME: string;
  SS_PRODUCT_DESCRIPTION: string;
  SS_CATEGORY: string;
  SS_SUBCATEGORY: string;
  SS_BRAND: string;
  SS_COST_PRICE: string;
  SS_SELLING_PRICE: string;
  SS_STOCK_QUANTITY: string;
  SS_MIN_STOCK_ALERT: string;
  SS_DISCOUNT_PERCENTAGE: string;
  SS_TAX_RATE: string;
  SS_SUPPLIER_SKU: string;
  SS_RETURN_POLICY: string;
  SS_IS_ACTIVE: boolean;
  SS_IS_FEATURED: boolean;
  SS_PRODUCT_TITLE: string;
  SS_SHORT_DESCRIPTION: string;
  SS_WARRANTY: string;
  SS_DELIVERY_ESTIMATE_MIN: string;
  SS_DELIVERY_ESTIMATE_MAX: string;
  metaTitle: string;
  metaDescription: string;
  SS_HIGHLIGHTS: string[];
  SS_TAGS: string[];
}

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageUploadMethod, setImageUploadMethod] = useState<"url" | "upload">("upload");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data from localStorage or use defaults
  const initializeFormData = (): FormData => {
    if (typeof window === 'undefined') {
      return getDefaultFormData();
    }
    
    const savedData = localStorage.getItem('productFormData');
    if (savedData) {
      try {
        return { ...getDefaultFormData(), ...JSON.parse(savedData) };
      } catch (error) {
        console.error('Error parsing saved form data:', error);
        return getDefaultFormData();
      }
    }
    return getDefaultFormData();
  };

  const getDefaultFormData = (): FormData => ({
    SS_PRODUCT_NAME: "",
    SS_PRODUCT_DESCRIPTION: "",
    SS_CATEGORY: "",
    SS_SUBCATEGORY: "",
    SS_BRAND: "",
    SS_COST_PRICE: "",
    SS_SELLING_PRICE: "",
    SS_STOCK_QUANTITY: "",
    SS_MIN_STOCK_ALERT: "10",
    SS_DISCOUNT_PERCENTAGE: "0",
    SS_TAX_RATE: "0",
    SS_SUPPLIER_SKU: "",
    SS_RETURN_POLICY: "no_return",
    SS_IS_ACTIVE: true,
    SS_IS_FEATURED: false,
    SS_PRODUCT_TITLE: "",
    SS_SHORT_DESCRIPTION: "",
    SS_WARRANTY: "",
    SS_DELIVERY_ESTIMATE_MIN: "3",
    SS_DELIVERY_ESTIMATE_MAX: "7",
    metaTitle: "",
    metaDescription: "",
    SS_HIGHLIGHTS: [""],
    SS_TAGS: [""],
  });

  const [formData, setFormData] = useState<FormData>(initializeFormData);
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" }
  ]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('productFormData', JSON.stringify(formData));
    }
  }, [formData]);

  // Save images to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('productFormImages', JSON.stringify(images));
    }
  }, [images]);

  // Save specifications to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('productFormSpecifications', JSON.stringify(specifications));
    }
  }, [specifications]);

  // Load saved data on component mount
  useEffect(() => {
    const loadSavedData = () => {
      if (typeof window !== 'undefined') {
        const savedImages = localStorage.getItem('productFormImages');
        const savedSpecs = localStorage.getItem('productFormSpecifications');
        
        if (savedImages) {
          try {
            setImages(JSON.parse(savedImages));
          } catch (error) {
            console.error('Error parsing saved images:', error);
          }
        }
        
        if (savedSpecs) {
          try {
            setSpecifications(JSON.parse(savedSpecs));
          } catch (error) {
            console.error('Error parsing saved specifications:', error);
          }
        }
      }
    };

    loadSavedData();
  }, []);

  // Clear saved data when leaving the page
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        // Only clear if we're not in the middle of a successful submission
        const shouldClear = !localStorage.getItem('productSubmitSuccess');
        if (shouldClear) {
          localStorage.removeItem('productFormData');
          localStorage.removeItem('productFormImages');
          localStorage.removeItem('productFormSpecifications');
        } else {
          localStorage.removeItem('productSubmitSuccess');
        }
      }
    };
  }, []);

  useEffect(() => {
  const checkAuth = () => {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      router.push('/admin/login');
    }
  };

  checkAuth();
}, [router]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
  try {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      toast.error('Authentication required');
      router.push('/admin/login');
      return;
    }

    const response = await fetch('/api/admin/categories', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      localStorage.removeItem('adminAccessToken');
      router.push('/admin/login');
      return;
    }
    
    if (response.ok) {
      const result = await response.json();
      setCategories(result.data?.categories || []);
    } else {
      toast.error('Failed to fetch categories');
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    toast.error('Failed to fetch categories');
  }
};


    fetchCategories();
  }, [router]);

  // Handle form input changes
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle array field changes (highlights, tags)
  const handleArrayFieldChange = (field: "SS_HIGHLIGHTS" | "SS_TAGS", index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field: "SS_HIGHLIGHTS" | "SS_TAGS") => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }));
  };

  const removeArrayField = (field: "SS_HIGHLIGHTS" | "SS_TAGS", index: number) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  // Handle specifications
  const handleSpecificationChange = (index: number, field: "key" | "value", value: string) => {
    const updatedSpecs = [...specifications];
    updatedSpecs[index][field] = value;
    setSpecifications(updatedSpecs);
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: "", value: "" }]);
  };

  const removeSpecification = (index: number) => {
    if (specifications.length > 1) {
      setSpecifications(specifications.filter((_, i) => i !== index));
    }
  };

  // Image handling - Multiple file upload
  const handleMultipleImageUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 5MB`);
        continue;
      }

      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} is not an image`);
        continue;
      }

      await handleImageUpload(file);
    }
  };

  const handleImageUpload = async (file: File) => {
    const tempId = Math.random().toString(36).substring(7);
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate upload progress
      setUploadProgress(prev => ({ ...prev, [tempId]: 0 }));
      
      const response = await fetch('/api/upload-files', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const newImage: ImageUpload = {
          url: result.url,
          alt: file.name,
          isPrimary: images.length === 0,
          publicId: result.publicId
        };
        setImages(prev => [...prev, newImage]);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[tempId];
          return newProgress;
        });
        toast.success(`Image "${file.name}" uploaded successfully`);
      } else {
        toast.error(result.error || `Failed to upload image "${file.name}"`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload image "${file.name}"`);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[tempId];
        return newProgress;
      });
    }
  };

  const handleImageUrlAdd = () => {
    if (imageUrlInput.trim()) {
      // Basic URL validation
      try {
        new URL(imageUrlInput.trim());
        const newImage: ImageUpload = {
          url: imageUrlInput.trim(),
          alt: "Product image",
          isPrimary: images.length === 0
        };
        setImages(prev => [...prev, newImage]);
        setImageUrlInput("");
        toast.success("Image URL added successfully");
      } catch (error) {
        toast.error("Please enter a valid URL");
      }
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = images[index];
    
    setImages(prev => prev.filter((_, i) => i !== index));
    
    // If we removed the primary image, make the first image primary
    if (imageToRemove.isPrimary && images.length > 1) {
      setImages(prev => prev.map((img, i) => ({
        ...img,
        isPrimary: i === 0
      })));
    }
    
    toast.success("Image removed");
  };

  const setPrimaryImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })));
    toast.success("Primary image updated");
  };

  // Clear all form data
  const clearForm = () => {
    setFormData(getDefaultFormData());
    setImages([]);
    setSpecifications([{ key: "", value: "" }]);
    setImageUrlInput("");
    if (typeof window !== 'undefined') {
      localStorage.removeItem('productFormData');
      localStorage.removeItem('productFormImages');
      localStorage.removeItem('productFormSpecifications');
    }
    toast.success("Form cleared");
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('adminAccessToken');
      
      if (!token) {
        toast.error('Authentication required');
        router.push('/admin/login');
        return;
      }

      // Validate required fields
      if (!formData.SS_PRODUCT_NAME.trim()) {
        toast.error('Product name is required');
        setLoading(false);
        return;
      }

      if (!formData.SS_PRODUCT_DESCRIPTION.trim()) {
        toast.error('Product description is required');
        setLoading(false);
        return;
      }

      if (!formData.SS_CATEGORY) {
        toast.error('Please select a category');
        setLoading(false);
        return;
      }

      if (!formData.SS_COST_PRICE || parseFloat(formData.SS_COST_PRICE) <= 0) {
        toast.error('Valid cost price is required');
        setLoading(false);
        return;
      }

      if (!formData.SS_SELLING_PRICE || parseFloat(formData.SS_SELLING_PRICE) <= 0) {
        toast.error('Valid selling price is required');
        setLoading(false);
        return;
      }

      if (!formData.SS_STOCK_QUANTITY || parseInt(formData.SS_STOCK_QUANTITY) < 0) {
        toast.error('Valid stock quantity is required');
        setLoading(false);
        return;
      }

      if (images.length === 0) {
        toast.error('Please add at least one product image');
        setLoading(false);
        return;
      }

      // Prepare product data according to your schema
      const productData = {
        // Admin Visible
        SS_PRODUCT_NAME: formData.SS_PRODUCT_NAME.trim(),
        SS_PRODUCT_DESCRIPTION: formData.SS_PRODUCT_DESCRIPTION.trim(),
        SS_CATEGORY: formData.SS_CATEGORY,
        SS_SUBCATEGORY: formData.SS_SUBCATEGORY.trim(),
        SS_BRAND: formData.SS_BRAND.trim(),
        SS_COST_PRICE: parseFloat(formData.SS_COST_PRICE),
        SS_SELLING_PRICE: parseFloat(formData.SS_SELLING_PRICE),
        SS_STOCK_QUANTITY: parseInt(formData.SS_STOCK_QUANTITY),
        SS_MIN_STOCK_ALERT: parseInt(formData.SS_MIN_STOCK_ALERT) || 10,
        SS_DISCOUNT_PERCENTAGE: parseFloat(formData.SS_DISCOUNT_PERCENTAGE) || 0,
        SS_TAX_RATE: parseFloat(formData.SS_TAX_RATE) || 0,
        SS_SUPPLIER_SKU: formData.SS_SUPPLIER_SKU.trim(),
        SS_RETURN_POLICY: formData.SS_RETURN_POLICY,
        SS_IS_ACTIVE: formData.SS_IS_ACTIVE,
        SS_IS_FEATURED: formData.SS_IS_FEATURED,

        // Customer Visible
        SS_PRODUCT_TITLE: formData.SS_PRODUCT_TITLE.trim() || formData.SS_PRODUCT_NAME.trim(),
        SS_SHORT_DESCRIPTION: formData.SS_SHORT_DESCRIPTION.trim(),
        SS_WARRANTY: formData.SS_WARRANTY.trim(),
        SS_DELIVERY_ESTIMATE: {
          minDays: parseInt(formData.SS_DELIVERY_ESTIMATE_MIN) || 3,
          maxDays: parseInt(formData.SS_DELIVERY_ESTIMATE_MAX) || 7
        },
        SS_HIGHLIGHTS: formData.SS_HIGHLIGHTS.filter(h => h.trim() !== ""),
        SS_SPECIFICATIONS: specifications.reduce((acc, spec) => {
          if (spec.key.trim() && spec.value.trim()) {
            acc[spec.key.trim()] = spec.value.trim();
          }
          return acc;
        }, {} as Record<string, string>),

        // SEO (Optional)
        metaTitle: formData.metaTitle.trim(),
        metaDescription: formData.metaDescription.trim(),

        // Images
        SS_PRODUCT_IMAGES: images,
        SS_MAIN_IMAGE: images.find(img => img.isPrimary)?.url || images[0]?.url,
        SS_GALLERY_IMAGES: images.map(img => img.url),

        // Tags
        SS_TAGS: formData.SS_TAGS.filter(tag => tag.trim() !== "")
      };

      console.log('Submitting product data:', productData);

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      const result = await response.json();

      if (result.success) {
        // Mark submission as successful to prevent clearing data
        if (typeof window !== 'undefined') {
          localStorage.setItem('productSubmitSuccess', 'true');
        }
        
        toast.success('Product created successfully');
        
        // Clear form data after successful submission
        clearForm();
        
        // Redirect to products page
        router.push('/admin/products');
      } else {
        toast.error(result.error || 'Failed to create product');
        console.error('API Error:', result);
      }
    } catch (error) {
      console.error('Create product error:', error);
      toast.error('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/products')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add New Product</h1>
            <p className="text-muted-foreground">Create a new product for your store</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={clearForm}
          disabled={loading}
        >
          Clear Form
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential product details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="SS_PRODUCT_NAME">Product Name *</Label>
                <Input
                  id="SS_PRODUCT_NAME"
                  value={formData.SS_PRODUCT_NAME}
                  onChange={(e) => handleInputChange("SS_PRODUCT_NAME", e.target.value)}
                  placeholder="Enter product name"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="SS_PRODUCT_TITLE">Product Title</Label>
                <Input
                  id="SS_PRODUCT_TITLE"
                  value={formData.SS_PRODUCT_TITLE}
                  onChange={(e) => handleInputChange("SS_PRODUCT_TITLE", e.target.value)}
                  placeholder="Customer-facing title (optional)"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="SS_PRODUCT_DESCRIPTION">Product Description *</Label>
              <Textarea
                id="SS_PRODUCT_DESCRIPTION"
                value={formData.SS_PRODUCT_DESCRIPTION}
                onChange={(e) => handleInputChange("SS_PRODUCT_DESCRIPTION", e.target.value)}
                placeholder="Detailed product description"
                rows={4}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="SS_SHORT_DESCRIPTION">Short Description</Label>
              <Textarea
                id="SS_SHORT_DESCRIPTION"
                value={formData.SS_SHORT_DESCRIPTION}
                onChange={(e) => handleInputChange("SS_SHORT_DESCRIPTION", e.target.value)}
                placeholder="Brief description for product listings"
                rows={2}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Category & Brand */}
        <Card>
          <CardHeader>
            <CardTitle>Category & Brand</CardTitle>
            <CardDescription>Product categorization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="SS_CATEGORY">Category *</Label>
                <Select
                  value={formData.SS_CATEGORY}
                  onValueChange={(value) => handleInputChange("SS_CATEGORY", value)}
                  disabled={loading || categories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      categories.length === 0 ? "Loading categories..." : "Select category"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.SS_CATEGORY_NAME}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No categories found. Please create categories first.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="SS_SUBCATEGORY">Subcategory</Label>
                <Input
                  id="SS_SUBCATEGORY"
                  value={formData.SS_SUBCATEGORY}
                  onChange={(e) => handleInputChange("SS_SUBCATEGORY", e.target.value)}
                  placeholder="Enter subcategory"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="SS_BRAND">Brand</Label>
              <Input
                id="SS_BRAND"
                value={formData.SS_BRAND}
                onChange={(e) => handleInputChange("SS_BRAND", e.target.value)}
                placeholder="Enter brand name"
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
            <CardDescription>Product pricing and stock information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="SS_COST_PRICE">Cost Price (₹) *</Label>
                <Input
                  id="SS_COST_PRICE"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.SS_COST_PRICE}
                  onChange={(e) => handleInputChange("SS_COST_PRICE", e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="SS_SELLING_PRICE">Selling Price (₹) *</Label>
                <Input
                  id="SS_SELLING_PRICE"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.SS_SELLING_PRICE}
                  onChange={(e) => handleInputChange("SS_SELLING_PRICE", e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="SS_DISCOUNT_PERCENTAGE">Discount (%)</Label>
                <Input
                  id="SS_DISCOUNT_PERCENTAGE"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.SS_DISCOUNT_PERCENTAGE}
                  onChange={(e) => handleInputChange("SS_DISCOUNT_PERCENTAGE", e.target.value)}
                  placeholder="0"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="SS_STOCK_QUANTITY">Stock Quantity *</Label>
                <Input
                  id="SS_STOCK_QUANTITY"
                  type="number"
                  min="0"
                  value={formData.SS_STOCK_QUANTITY}
                  onChange={(e) => handleInputChange("SS_STOCK_QUANTITY", e.target.value)}
                  placeholder="0"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="SS_MIN_STOCK_ALERT">Low Stock Alert</Label>
                <Input
                  id="SS_MIN_STOCK_ALERT"
                  type="number"
                  min="0"
                  value={formData.SS_MIN_STOCK_ALERT}
                  onChange={(e) => handleInputChange("SS_MIN_STOCK_ALERT", e.target.value)}
                  placeholder="10"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="SS_TAX_RATE">Tax Rate (%)</Label>
                <Input
                  id="SS_TAX_RATE"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.SS_TAX_RATE}
                  onChange={(e) => handleInputChange("SS_TAX_RATE", e.target.value)}
                  placeholder="0"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="SS_SUPPLIER_SKU">Supplier SKU</Label>
              <Input
                id="SS_SUPPLIER_SKU"
                value={formData.SS_SUPPLIER_SKU}
                onChange={(e) => handleInputChange("SS_SUPPLIER_SKU", e.target.value)}
                placeholder="Enter supplier SKU"
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
            <CardDescription>
              Upload multiple product images. First image will be set as primary.
              {images.length > 0 && ` (${images.length} images added)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image Upload Method Toggle */}
            <div className="flex gap-4 mb-4">
              <Button
                type="button"
                variant={imageUploadMethod === "upload" ? "default" : "outline"}
                onClick={() => setImageUploadMethod("upload")}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </Button>
              <Button
                type="button"
                variant={imageUploadMethod === "url" ? "default" : "outline"}
                onClick={() => setImageUploadMethod("url")}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <Link className="w-4 h-4" />
                Image URLs
              </Button>
            </div>

            {/* File Upload - Multiple */}
            {imageUploadMethod === "upload" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload Images</Label>
                  <div 
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => !loading && fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG, JPEG up to 5MB each
                    </p>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && !loading) {
                          handleMultipleImageUpload(files);
                        }
                        e.target.value = '';
                      }}
                      className="hidden"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Upload Progress */}
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="space-y-2">
                    <Label>Upload Progress</Label>
                    {Object.entries(uploadProgress).map(([id, progress]) => (
                      <div key={id} className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* URL Input */}
            {imageUploadMethod === "url" && (
              <div className="space-y-2">
                <Label>Add Image URLs</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !loading) {
                        e.preventDefault();
                        handleImageUrlAdd();
                      }
                    }}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    onClick={handleImageUrlAdd}
                    disabled={loading || !imageUrlInput.trim()}
                  >
                    Add URL
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Press Enter or click Add URL to add multiple image URLs
                </p>
              </div>
            )}

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="space-y-2">
                <Label>Product Images ({images.length})</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className={`aspect-square rounded-lg border-2 overflow-hidden ${
                        image.isPrimary ? 'border-primary' : 'border-border'
                      }`}>
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                          }}
                        />
                        {image.isPrimary && (
                          <Badge className="absolute top-1 left-1" variant="secondary">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {!image.isPrimary && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setPrimaryImage(index)}
                            className="h-8 w-8 p-0"
                            title="Set as primary"
                            disabled={loading}
                          >
                            <ImageIcon className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => removeImage(index)}
                          className="h-8 w-8 p-0"
                          title="Remove image"
                          disabled={loading}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {images.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No images added yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>Additional product information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Highlights */}
            <div className="space-y-2">
              <Label>Product Highlights</Label>
              {formData.SS_HIGHLIGHTS.map((highlight, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={highlight}
                    onChange={(e) => handleArrayFieldChange("SS_HIGHLIGHTS", index, e.target.value)}
                    placeholder="Enter product highlight"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayField("SS_HIGHLIGHTS", index)}
                    disabled={loading || formData.SS_HIGHLIGHTS.length === 1}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayField("SS_HIGHLIGHTS")}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <Plus className="w-4 h-4" />
                Add Highlight
              </Button>
            </div>

            {/* Specifications */}
            <div className="space-y-2">
              <Label>Specifications</Label>
              {specifications.map((spec, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    value={spec.key}
                    onChange={(e) => handleSpecificationChange(index, "key", e.target.value)}
                    placeholder="Specification name"
                    disabled={loading}
                  />
                  <div className="flex gap-2">
                    <Input
                      value={spec.value}
                      onChange={(e) => handleSpecificationChange(index, "value", e.target.value)}
                      placeholder="Specification value"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeSpecification(index)}
                      disabled={loading || specifications.length === 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSpecification}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <Plus className="w-4 h-4" />
                Add Specification
              </Button>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Product Tags</Label>
              {formData.SS_TAGS.map((tag, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={tag}
                    onChange={(e) => handleArrayFieldChange("SS_TAGS", index, e.target.value)}
                    placeholder="Enter tag"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayField("SS_TAGS", index)}
                    disabled={loading || formData.SS_TAGS.length === 1}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayField("SS_TAGS")}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <Plus className="w-4 h-4" />
                Add Tag
              </Button>
            </div>

            {/* Warranty & Delivery */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="SS_WARRANTY">Warranty</Label>
                <Input
                  id="SS_WARRANTY"
                  value={formData.SS_WARRANTY}
                  onChange={(e) => handleInputChange("SS_WARRANTY", e.target.value)}
                  placeholder="e.g., 1 Year Manufacturer Warranty"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>Delivery Estimate (Days)</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.SS_DELIVERY_ESTIMATE_MIN}
                    onChange={(e) => handleInputChange("SS_DELIVERY_ESTIMATE_MIN", e.target.value)}
                    placeholder="Min"
                    type="number"
                    min="1"
                    disabled={loading}
                  />
                  <Input
                    value={formData.SS_DELIVERY_ESTIMATE_MAX}
                    onChange={(e) => handleInputChange("SS_DELIVERY_ESTIMATE_MAX", e.target.value)}
                    placeholder="Max"
                    type="number"
                    min="1"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Return Policy */}
            <div className="space-y-2">
              <Label htmlFor="SS_RETURN_POLICY">Return Policy</Label>
              <Select
                value={formData.SS_RETURN_POLICY}
                onValueChange={(value) => handleInputChange("SS_RETURN_POLICY", value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select return policy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_return">No Returns</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* SEO Settings - Optional */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings (Optional)</CardTitle>
            <CardDescription>Search engine optimization settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle}
                onChange={(e) => handleInputChange("metaTitle", e.target.value)}
                placeholder="SEO title (optional)"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) => handleInputChange("metaDescription", e.target.value)}
                placeholder="SEO description (optional)"
                rows={2}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status & Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Actions</CardTitle>
            <CardDescription>Product visibility and actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="SS_IS_ACTIVE">Product Status</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.SS_IS_ACTIVE ? "Product is active and visible" : "Product is inactive and hidden"}
                </p>
              </div>
              <Switch
                id="SS_IS_ACTIVE"
                checked={formData.SS_IS_ACTIVE}
                onCheckedChange={(checked) => handleInputChange("SS_IS_ACTIVE", checked)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="SS_IS_FEATURED">Featured Product</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.SS_IS_FEATURED ? "Product is featured" : "Product is not featured"}
                </p>
              </div>
              <Switch
                id="SS_IS_FEATURED"
                checked={formData.SS_IS_FEATURED}
                onCheckedChange={(checked) => handleInputChange("SS_IS_FEATURED", checked)}
                disabled={loading}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading || images.length === 0}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Product...
                  </>
                ) : (
                  "Create Product"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/products')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}