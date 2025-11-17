// app/checkout/page.tsx
"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  CreditCard,
  Smartphone,
  QrCode,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Check,
  Loader2,
  Home,
  Building,
  Navigation,
} from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useCart } from "@/components/contexts/cart-context";
import { useAuth } from "@/components/contexts/auth-context";
import { useToast } from "@/components/providers/toast-provider";

// Types
interface Address {
  _id: string;
  SS_FULL_NAME: string;
  SS_MOBILE_NUMBER: string;
  SS_STREET_ADDRESS: string;
  SS_CITY: string;
  SS_STATE: string;
  SS_POSTAL_CODE: string;
  SS_COUNTRY: string;
  SS_ADDRESS_TYPE: "home" | "work" | "other";
  SS_IS_DEFAULT: boolean;
  SS_IS_CURRENT: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface PincodePostOffice {
  Name: string;
  District: string;
  State: string;
}

interface PincodeData {
  Message: string;
  Status: string;
  PostOffice: PincodePostOffice[] | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, refreshCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [step, setStep] = useState(1);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");

  // Fetch addresses from API
  const fetchAddresses = async () => {
    if (!isAuthenticated) return;

    setAddressesLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/users/address", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAddresses(result.data.addresses || []);
          // Set current address as selected by default
          const currentAddress = result.data.addresses.find(
            (addr: Address) => addr.SS_IS_CURRENT
          );
          setSelectedAddress(
            currentAddress || result.data.addresses[0] || null
          );
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to load addresses",
        duration: 5000,
      });
    } finally {
      setAddressesLoading(false);
    }
  };

  // Add new address - FIXED
  const addAddress = async (addressData: any): Promise<boolean> => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/users/address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: addressData.SS_FULL_NAME,
          mobileNumber: addressData.SS_MOBILE_NUMBER,
          streetAddress: addressData.SS_STREET_ADDRESS,
          city: addressData.SS_CITY,
          state: addressData.SS_STATE,
          postalCode: addressData.SS_POSTAL_CODE,
          country: addressData.SS_COUNTRY,
          addressType: addressData.SS_ADDRESS_TYPE,
          isDefault: addressData.SS_IS_DEFAULT,
          isCurrent: addressData.SS_IS_CURRENT,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchAddresses(); // Refresh addresses
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding address:", error);
      return false;
    }
  };

  // Update address - FIXED
  const updateAddress = async (
    addressId: string,
    updates: any
  ): Promise<boolean> => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/users/address", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          addressId,
          fullName: updates.SS_FULL_NAME,
          mobileNumber: updates.SS_MOBILE_NUMBER,
          streetAddress: updates.SS_STREET_ADDRESS,
          city: updates.SS_CITY,
          state: updates.SS_STATE,
          postalCode: updates.SS_POSTAL_CODE,
          country: updates.SS_COUNTRY,
          addressType: updates.SS_ADDRESS_TYPE,
          isDefault: updates.SS_IS_DEFAULT,
          isCurrent: updates.SS_IS_CURRENT,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchAddresses(); // Refresh addresses
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating address:", error);
      return false;
    }
  };

  // Delete address
  const deleteAddress = async (addressId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/users/address?addressId=${addressId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        await fetchAddresses(); // Refresh addresses
        if (selectedAddress?._id === addressId) {
          setSelectedAddress(null);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting address:", error);
      return false;
    }
  };

  // In your checkout page, replace these functions:

  // Set default address - FIXED
  const setDefaultAddress = async (addressId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/users/address", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          addressId,
          isDefault: true,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchAddresses(); // Refresh addresses
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error setting default address:", error);
      return false;
    }
  };

  // Set current address - FIXED
  const setCurrentAddress = async (addressId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/users/address", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          addressId,
          isCurrent: true,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchAddresses(); // Refresh addresses
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error setting current address:", error);
      return false;
    }
  };

  // Also update the handleAddressSelect function to handle errors better:
  const handleAddressSelect = async (address: Address) => {
    setSelectedAddress(address);
    // Set as current address when selected
    try {
      const success = await setCurrentAddress(address._id);
      if (success) {
        addToast({
          type: "success",
          title: "Address Updated",
          message: "Delivery address has been set as current",
          duration: 3000,
        });
      } else {
        throw new Error("Failed to set current address");
      }
    } catch (error) {
      console.error("Error setting current address:", error);
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to set current address",
        duration: 5000,
      });
    }
  };
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchAddresses();
  }, [isAuthenticated, router]);

  // Calculate totals
  const subtotal = total;
  const tax = subtotal * 0.18;
  const shipping = subtotal > 1000 ? 0 : 99;
  const finalTotal = subtotal + tax + shipping;

  // Payment methods - Only UPI options
  const paymentMethods: PaymentMethod[] = [
    {
      id: "gpay",
      name: "Google Pay",
      icon: "GPay",
      color: "bg-[#4285F4]",
      description: "Fast and secure UPI payments",
    },
    {
      id: "phonepe",
      name: "PhonePe",
      icon: "PhonePe",
      color: "bg-[#5F259F]",
      description: "Popular UPI payment app",
    },
    {
      id: "paytm",
      name: "Paytm",
      icon: "Paytm",
      color: "bg-[#002970]",
      description: "India's leading payments app",
    },
  ];

  // Replace the handlePayment function in your existing checkout page with this:
  useEffect(() => {
    const stored = sessionStorage.getItem("checkoutItems");
    if (!stored) {
      router.push("/cart");
      return;
    }
    setCheckoutItems(JSON.parse(stored));
  }, []);
  const handlePayment = async () => {
    if (!selectedAddress) {
      addToast({
        type: "error",
        title: "Address Required",
        message: "Please select a delivery address",
        duration: 5000,
      });
      return;
    }

    if (paymentMethod === "upi" && !upiId) {
      addToast({
        type: "error",
        title: "UPI ID Required",
        message: "Please enter your UPI ID",
        duration: 5000,
      });
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem("accessToken");

      // Use checkoutItems from session storage
      const selectedCartItems = checkoutItems;

      if (!selectedCartItems || selectedCartItems.length === 0) {
        throw new Error("No items selected for checkout");
      }

      // Calculate totals
      const subtotal = selectedCartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const tax = subtotal * 0.18;
      const shipping = subtotal > 1000 ? 0 : 99;
      const finalTotal = subtotal + tax + shipping;

      console.log("Creating order with items:", selectedCartItems);

      // Create order
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: selectedCartItems,
          shippingAddress: selectedAddress,
          paymentMethod: paymentMethod, // This will be mapped in the API
          upiId: upiId,
          totalAmount: finalTotal,
          taxAmount: tax,
          shippingCharge: shipping,
          discountAmount: 0,
        }),
      });

      const orderResult = await orderResponse.json();

      if (!orderResult.success) {
        console.error("Order creation failed:", orderResult);
        throw new Error(orderResult.error || "Failed to create order");
      }

      console.log("Order created successfully:", orderResult);

      // Process payment if needed
      if (orderResult.data.order.paymentStatus === "pending") {
        console.log("Processing payment...");

        const paymentResponse = await fetch("/api/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: orderResult.data.order.id,
            paymentMethod: paymentMethod,
            upiId: upiId,
            amount: finalTotal,
          }),
        });

        const paymentResult = await paymentResponse.json();

        if (!paymentResult.success) {
          console.error("Payment failed:", paymentResult);
          throw new Error(paymentResult.error || "Payment failed");
        }

        console.log("Payment processed successfully:", paymentResult);
      }

      addToast({
        type: "success",
        title: "Order Placed Successfully!",
        message: `Your order #${orderResult.data.order.orderNumber} has been confirmed`,
        duration: 5000,
      });

      // Clear session storage
      sessionStorage.removeItem("checkoutItems");

      // Refresh cart and redirect
      refreshCart();
      router.push(`/account/orders/${orderResult.data.order.id}`);
    } catch (error: any) {
      console.error("Payment error:", error);
      addToast({
        type: "error",
        title: "Payment Failed",
        message: error.message || "Please try again or contact support",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const success = await deleteAddress(addressId);
      if (success) {
        addToast({
          type: "success",
          title: "Address Deleted",
          message: "Address has been deleted successfully",
          duration: 3000,
        });
      } else {
        throw new Error("Failed to delete address");
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to delete address",
        duration: 5000,
      });
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const success = await setDefaultAddress(addressId);
      if (success) {
        addToast({
          type: "success",
          title: "Default Address Set",
          message: "Default address has been updated",
          duration: 3000,
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to set default address",
        duration: 5000,
      });
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleCloseAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/checkout/cart" className="hover:text-primary transition">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">Checkout</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Steps */}
        <div className="flex items-center justify-center mb-8 max-w-md mx-auto">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 transition ${
                  s <= step
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {s}
              </div>
              {s < 2 && (
                <div
                  className={`w-16 h-1 ${
                    s < step ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Delivery Address</h2>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm md:px-4 md:py-2 md:text-base"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add New Address</span>
                    <span className="sm:hidden">Add Address</span>
                  </button>
                </div>

                {addressesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <p>Loading addresses...</p>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Addresses</h3>
                    <p className="text-muted-foreground mb-4">
                      Add a delivery address to continue with your order
                    </p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
                    >
                      Add Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <AddressCard
                        key={address._id}
                        address={address}
                        isSelected={selectedAddress?._id === address._id}
                        onSelect={() => handleAddressSelect(address)}
                        onEdit={() => handleEditAddress(address)}
                        onDelete={() => handleDeleteAddress(address._id)}
                        onSetDefault={() =>
                          handleSetDefaultAddress(address._id)
                        }
                        onSetCurrent={() => setCurrentAddress(address._id)}
                      />
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedAddress}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Lock size={24} /> Payment Method
                </h2>

                {/* Selected Address Summary */}
                {selectedAddress && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold mb-1">Deliver to:</h4>
                        <p className="text-sm">
                          {selectedAddress.SS_FULL_NAME} •{" "}
                          {selectedAddress.SS_MOBILE_NUMBER}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedAddress.SS_STREET_ADDRESS},{" "}
                          {selectedAddress.SS_CITY}, {selectedAddress.SS_STATE}{" "}
                          - {selectedAddress.SS_POSTAL_CODE}
                        </p>
                      </div>
                      <button
                        onClick={() => setStep(1)}
                        className="text-primary text-sm font-medium hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* UPI Payment Methods */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {paymentMethods.map((method) => (
                      <PaymentMethodCard
                        key={method.id}
                        method={method}
                        isSelected={paymentMethod === method.id}
                        onSelect={() => setPaymentMethod(method.id)}
                      />
                    ))}
                  </div>

                  {/* UPI ID Input */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Enter UPI ID</h4>
                    <input
                      type="text"
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Enter your UPI ID to receive payment request
                    </p>
                  </div>

                  {/* QR Code for UPI */}
                  <div className="text-center bg-white p-6 rounded-xl border border-border">
                    <div className="bg-white p-4 rounded-lg inline-block">
                      <QrCode className="w-32 h-32 text-gray-800 mx-auto mb-4" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Scan QR Code to Pay
                    </p>
                    <p className="text-lg font-bold text-primary mt-2">
                      ₹{finalTotal.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      UPI ID: shopstreak@upi
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-muted text-foreground py-4 rounded-xl font-bold hover:bg-muted/80 transition"
                  >
                    Back to Address
                  </button>

                  <button
                    onClick={handlePayment}
                    disabled={isProcessing || !upiId}
                    className="flex-1 bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      `Pay ₹${finalTotal.toFixed(2)}`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              tax={tax}
              shipping={shipping}
              finalTotal={finalTotal}
            />
          </div>
        </div>
      </div>

      {/* Address Form Modal */}
      {showAddressForm && (
        <AddressFormModal
          address={editingAddress}
          onClose={handleCloseAddressForm}
          onSuccess={() => {
            handleCloseAddressForm();
            fetchAddresses();
          }}
          addAddress={addAddress}
          updateAddress={updateAddress}
        />
      )}

      <BottomNav />
    </div>
  );
}

// Address Card Component - Updated
function AddressCard({
  address,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  onSetCurrent,
}: {
  address: Address;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onSetCurrent: () => void;
}) {
  const getAddressIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Home className="w-4 h-4" />;
      case "work":
        return <Building className="w-4 h-4" />;
      default:
        return <Navigation className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`border-2 rounded-xl p-4 transition cursor-pointer ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{address.SS_FULL_NAME}</span>
            {address.SS_IS_DEFAULT && (
              <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                Default
              </span>
            )}
            {address.SS_IS_CURRENT && (
              <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                Current
              </span>
            )}
          </div>

          <p className="text-sm mb-1">{address.SS_STREET_ADDRESS}</p>
          <p className="text-sm text-muted-foreground mb-1">
            {address.SS_CITY}, {address.SS_STATE} - {address.SS_POSTAL_CODE}
          </p>
          <p className="text-sm text-muted-foreground">
            {address.SS_MOBILE_NUMBER}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs px-2 py-1 bg-muted rounded flex items-center gap-1 capitalize">
              {getAddressIcon(address.SS_ADDRESS_TYPE)}
              {address.SS_ADDRESS_TYPE}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {!address.SS_IS_DEFAULT && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDefault();
                }}
                className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded transition"
              >
                Set as default
              </button>
            )}
            {!address.SS_IS_CURRENT && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetCurrent();
                }}
                className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 transition"
              >
                Set as current
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 text-muted-foreground hover:text-primary transition"
            title="Edit address"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-muted-foreground hover:text-destructive transition"
            title="Delete address"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              isSelected ? "bg-primary border-primary" : "border-border"
            }`}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>
          <span className="text-sm font-medium">Deliver to this address</span>
        </div>
      </div>
    </div>
  );
}

// Payment Method Card Component
function PaymentMethodCard({
  method,
  isSelected,
  onSelect,
}: {
  method: PaymentMethod;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`border-2 rounded-xl p-4 transition cursor-pointer ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${method.color}`}
        >
          <span className="text-sm font-bold">{method.icon}</span>
        </div>
        <div className="flex-1">
          <span className="font-semibold text-sm">{method.name}</span>
          <p className="text-xs text-muted-foreground mt-1">
            {method.description}
          </p>
        </div>
        <div
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            isSelected ? "bg-primary border-primary" : "border-border"
          }`}
        >
          {isSelected && <Check className="w-2 h-2 text-white" />}
        </div>
      </div>
    </div>
  );
}

// Order Summary Component
function OrderSummary({
  items,
  subtotal,
  tax,
  shipping,
  finalTotal,
}: {
  items: any[];
  subtotal: number;
  tax: number;
  shipping: number;
  finalTotal: number;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 h-fit sticky top-20">
      <h2 className="font-bold text-xl mb-6">Order Summary</h2>

      {/* Items List */}
      <div className="space-y-4 mb-6 pb-6 border-b border-border">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <img
              src={item.image || "/placeholder.svg"}
              alt={item.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm line-clamp-1">{item.name}</p>
              <p className="text-muted-foreground text-sm">
                ₹{item.price} × {item.quantity}
              </p>
            </div>
            <p className="font-semibold">
              ₹{(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6 pb-6 border-b border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax (18%)</span>
          <span>₹{tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className={shipping === 0 ? "text-green-600" : ""}>
            {shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between font-bold text-xl mb-6">
        <span>Total</span>
        <span className="text-primary">₹{finalTotal.toFixed(2)}</span>
      </div>

      {/* Trust Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-green-700 text-sm font-medium">
          🔒 Your payment is secure and encrypted
        </p>
      </div>
    </div>
  );
}

// Address Form Modal Component
function AddressFormModal({
  address,
  onClose,
  onSuccess,
  addAddress,
  updateAddress,
}: {
  address?: Address | null;
  onClose: () => void;
  onSuccess: () => void;
  addAddress: (address: any) => Promise<boolean>;
  updateAddress: (addressId: string, updates: any) => Promise<boolean>;
}) {
  const [formData, setFormData] = useState({
    fullName: address?.SS_FULL_NAME || "",
    mobileNumber: address?.SS_MOBILE_NUMBER || "",
    streetAddress: address?.SS_STREET_ADDRESS || "",
    city: address?.SS_CITY || "",
    state: address?.SS_STATE || "",
    postalCode: address?.SS_POSTAL_CODE || "",
    addressType:
      address?.SS_ADDRESS_TYPE || ("home" as "home" | "work" | "other"),
    isDefault: address?.SS_IS_DEFAULT || false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPincode, setIsLoadingPincode] = useState(false);
  const { addToast } = useToast();

  // Fetch pincode data
  const fetchPincodeData = async (pincode: string) => {
    if (pincode.length !== 6) return;

    setIsLoadingPincode(true);
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );
      const data: PincodeData[] = await response.json();

      if (
        data[0].Status === "Success" &&
        data[0].PostOffice &&
        data[0].PostOffice.length > 0
      ) {
        const postOffice = data[0].PostOffice[0];
        setFormData((prev) => ({
          ...prev,
          city: postOffice.Name,
          state: postOffice.State,
        }));

        addToast({
          type: "success",
          title: "Location Found",
          message: `City and state auto-filled for pincode ${pincode}`,
          duration: 3000,
        });
      } else {
        addToast({
          type: "warning",
          title: "Pincode Not Found",
          message: "Please enter city and state manually",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error fetching pincode data:", error);
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to fetch pincode data",
        duration: 5000,
      });
    } finally {
      setIsLoadingPincode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate mobile number (10 digits)
    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      addToast({
        type: "error",
        title: "Invalid Mobile Number",
        message: "Please enter a valid 10-digit mobile number",
        duration: 5000,
      });
      return;
    }

    // Validate pincode (6 digits)
    if (!/^\d{6}$/.test(formData.postalCode)) {
      addToast({
        type: "error",
        title: "Invalid Pincode",
        message: "Please enter a valid 6-digit pincode",
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const addressData = {
        SS_FULL_NAME: formData.fullName,
        SS_MOBILE_NUMBER: formData.mobileNumber,
        SS_STREET_ADDRESS: formData.streetAddress,
        SS_CITY: formData.city,
        SS_STATE: formData.state,
        SS_POSTAL_CODE: formData.postalCode,
        SS_COUNTRY: "India",
        SS_ADDRESS_TYPE: formData.addressType,
        SS_IS_DEFAULT: formData.isDefault,
        SS_IS_CURRENT: false,
      };

      let success: boolean;

      if (address) {
        // Update existing address
        success = await updateAddress(address._id, addressData);
      } else {
        // Add new address
        success = await addAddress(addressData);
      }

      if (success) {
        addToast({
          type: "success",
          title: address ? "Address Updated" : "Address Added",
          message: address
            ? "Address has been updated successfully"
            : "New address has been added successfully",
          duration: 3000,
        });
        onSuccess();
      } else {
        throw new Error(
          address ? "Failed to update address" : "Failed to add address"
        );
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        message: address ? "Failed to update address" : "Failed to add address",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));

    // Auto-fetch pincode data when pincode is entered
    if (name === "postalCode" && value.length === 6) {
      fetchPincodeData(value);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">
            {address ? "Edit Address" : "Add New Address"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Mobile Number *
            </label>
            <input
              type="tel"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              required
              pattern="[0-9]{10}"
              maxLength={10}
              placeholder="10-digit mobile number"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Street Address *
            </label>
            <textarea
              name="streetAddress"
              value={formData.streetAddress}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Postal Code *
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                required
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="6-digit pincode"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {isLoadingPincode && (
                <div className="flex items-center gap-2 mt-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-xs text-muted-foreground">
                    Finding location...
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Address Type
              </label>
              <select
                name="addressType"
                value={formData.addressType}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">State *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleChange}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <label className="text-sm font-medium">
              Set as default address
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-muted text-foreground py-3 rounded-lg font-semibold hover:bg-muted/80 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : address ? (
                "Update Address"
              ) : (
                "Save Address"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
