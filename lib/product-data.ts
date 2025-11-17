export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  category: string
  image: string
  rating: number
  reviews: number
  stock: number
  badge?: "bestseller" | "trending" | "new"
  description: string
  slug: string
  inStock: boolean
  features: string[]
  specifications: Record<string, string>
  images: string[]
  noReturn?: boolean
}

export interface ProductReview {
  id: string
  reviewer: string
  rating: number
  date: string
  comment: string
  helpful: number
}

export const categories = [
  { id: "all", name: "All Products" },
  { id: "Skincare & Beauty", name: "Skincare & Beauty" },
  { id: "Electronics", name: "Electronics" },
  { id: "Fashion", name: "Fashion" },
  { id: "Home & Living", name: "Home & Living" },
  { id: "Sports", name: "Sports" },
  { id: "Personal Care", name: "Personal Care" }
]

export const products: Product[] = [
  {
    id: "1",
    name: "Minimalist Sunscreen SPF 50 PA+++",
    price: 599,
    originalPrice: 799,
    category: "Skincare & Beauty",
    image: "/sunscreen-spf-50.jpg",
    rating: 4.7,
    reviews: 245,
    stock: 120,
    badge: "bestseller",
    description: "Lightweight, fast-absorbing sunscreen with broad spectrum UVA/UVB protection",
    slug: "minimalist-sunscreen-spf50",
    inStock: true,
    features: [
      "Broad spectrum UVA/UVB protection",
      "Lightweight and non-greasy",
      "Fast absorbing formula",
      "Suitable for all skin types"
    ],
    specifications: {
      "SPF": "50",
      "PA Rating": "+++",
      "Volume": "50ml",
      "Skin Type": "All",
      "Water Resistant": "Yes"
    },
    images: ["/sunscreen-spf-50.jpg", "/sunscreen-spf-50-2.jpg"],
    noReturn: true
  },
  {
    id: "9",
    name: "boAt Airdopes 161 TWS Earbuds",
    price: 1299,
    originalPrice: 1599,
    category: "Electronics",
    image: "/wireless-earbuds-boat.jpg",
    rating: 4.7,
    reviews: 523,
    stock: 78,
    badge: "bestseller",
    description: "True wireless earbuds with 8 hours battery life",
    slug: "boat-airdopes-161",
    inStock: true,
    features: [
      "8 hours playback time",
      "Bluetooth 5.0",
      "IPX4 water resistance",
      "Touch controls"
    ],
    specifications: {
      "Battery Life": "8 hours",
      "Charging Case": "Additional 24 hours",
      "Bluetooth": "5.0",
      "Water Resistance": "IPX4"
    },
    images: ["/wireless-earbuds-boat.jpg", "/wireless-earbuds-boat-2.jpg"]
  }
]

export const productReviews: Record<string, ProductReview[]> = {
  "1": [
    {
      id: "1",
      reviewer: "Priya M",
      rating: 5,
      date: "Oct 15, 2024",
      comment: "Excellent sunscreen! No white cast and feels lightweight.",
      helpful: 234,
    },
    {
      id: "2",
      reviewer: "Rahul K",
      rating: 4,
      date: "Oct 10, 2024",
      comment: "Good protection but a bit oily for my skin type.",
      helpful: 156,
    }
  ]
}