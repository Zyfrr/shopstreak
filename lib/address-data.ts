export interface Address {
  id: string
  type: "home" | "work" | "other"
  name: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export const mockAddresses: Address[] = [
  {
    id: "1",
    type: "home",
    name: "Home",
    phone: "+91 9876543210",
    addressLine1: "123 Main Street",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001",
    isDefault: true,
  },
]
