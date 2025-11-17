export interface OrderStatus {
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  date: string
  trackingId?: string
  carrier?: string
  description: string
}

export interface Order {
  id: string
  date: string
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  items: {
    id: number
    name: string
    quantity: number
    price: number
    image: string
  }[]
  statusHistory: OrderStatus[]
  estimatedDelivery: string
  shippingAddress: {
    name: string
    address: string
    phone: string
  }
}

export const SAMPLE_ORDERS: Order[] = [
  {
    id: "SS-2025-001",
    date: "2025-01-20",
    total: 4999.0,
    status: "shipped",
    items: [
      {
        id: 1,
        name: "Premium Wireless Headphones",
        quantity: 1,
        price: 1999,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
      },
      {
        id: 3,
        name: "USB-C Fast Charger",
        quantity: 2,
        price: 399,
        image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&h=500&fit=crop",
      },
    ],
    statusHistory: [
      {
        status: "pending",
        date: "2025-01-20",
        description: "Order placed successfully",
      },
      {
        status: "processing",
        date: "2025-01-20",
        description: "Order is being prepared for shipment",
      },
      {
        status: "shipped",
        date: "2025-01-21",
        trackingId: "TRK123456789",
        carrier: "DHL Express",
        description: "Package has been shipped",
      },
    ],
    estimatedDelivery: "2025-01-24",
    shippingAddress: {
      name: "Rajesh Kumar",
      address: "123 MG Road, Bangalore, 560001",
      phone: "9876543210",
    },
  },
  {
    id: "SS-2025-002",
    date: "2025-01-18",
    total: 3499.0,
    status: "delivered",
    items: [
      {
        id: 2,
        name: "Smart Watch Pro",
        quantity: 1,
        price: 3499,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
      },
    ],
    statusHistory: [
      {
        status: "pending",
        date: "2025-01-18",
        description: "Order placed successfully",
      },
      {
        status: "processing",
        date: "2025-01-18",
        description: "Order is being prepared",
      },
      {
        status: "shipped",
        date: "2025-01-19",
        trackingId: "TRK987654321",
        carrier: "Fedex",
        description: "Out for delivery",
      },
      {
        status: "delivered",
        date: "2025-01-22",
        description: "Delivered successfully",
      },
    ],
    estimatedDelivery: "2025-01-22",
    shippingAddress: {
      name: "Rajesh Kumar",
      address: "123 MG Road, Bangalore, 560001",
      phone: "9876543210",
    },
  },
]

export function getOrderById(orderId: string): Order | undefined {
  return SAMPLE_ORDERS.find((o) => o.id === orderId)
}

export function getAllOrders(): Order[] {
  return SAMPLE_ORDERS.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
