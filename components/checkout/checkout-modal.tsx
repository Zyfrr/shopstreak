"use client";

import type React from "react";

import { X, Check } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/contexts/cart-context";
import { useRouter } from "next/navigation";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCart();
  const [step, setStep] = useState<
    "details" | "shipping" | "payment" | "confirmation"
  >("details");
  const [loading, setLoading] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    fullName: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [shippingData, setShippingData] = useState({
    shippingMethod: "express",
    deliveryDate: "",
  });

  const [paymentData, setPaymentData] = useState({
    paymentMethod: "card",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const subtotal = getTotal();
  const shipping = subtotal > 1000 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setShippingData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "cardNumber") {
      setPaymentData((prev) => ({
        ...prev,
        [name]: value.replace(/\D/g, "").slice(0, 16),
      }));
    } else if (name === "cvv") {
      setPaymentData((prev) => ({
        ...prev,
        [name]: value.replace(/\D/g, "").slice(0, 3),
      }));
    } else {
      setPaymentData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateStep = (): boolean => {
    if (step === "details") {
      return !!(
        formData.email &&
        formData.phone.length === 10 &&
        formData.fullName &&
        formData.address &&
        formData.city &&
        formData.state &&
        formData.pincode.length === 6
      );
    }
    if (step === "shipping") {
      return !!(shippingData.shippingMethod && shippingData.deliveryDate);
    }
    if (step === "payment") {
      return !!(
        paymentData.paymentMethod === "cod" ||
        (paymentData.cardNumber.length === 16 &&
          paymentData.expiryDate &&
          paymentData.cvv.length === 3)
      );
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) {
      alert("Please fill in all required fields");
      return;
    }

    if (step === "details") {
      setStep("shipping");
    } else if (step === "shipping") {
      setStep("payment");
    } else if (step === "payment") {
      setLoading(true);
      // Simulate payment processing
      setTimeout(() => {
        setOrderConfirmed(true);
        setStep("confirmation");
        clearCart();
        setLoading(false);
      }, 2000);
    }
  };

  const handleConfirmation = () => {
    // Generate order ID
    const orderId = "ORD" + Date.now();
    sessionStorage.setItem("lastOrderId", orderId);
    onClose();
    router.push("/account/orders");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Checkout</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {orderConfirmed ? (
          // Confirmation Screen
          <div className="p-6 text-center">
            <div className="bg-green-600/20 border-2 border-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Order Confirmed!</h3>
            <p className="text-muted-foreground mb-6">
              Your order has been placed successfully. You'll receive a
              confirmation email shortly.
            </p>
            <div className="bg-card border border-border rounded-lg p-6 mb-6 text-left">
              <p className="text-sm text-muted-foreground mb-2">Order ID</p>
              <p className="text-lg font-bold mb-4">ORD{Date.now()}</p>
              <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
              <p className="text-2xl font-bold text-primary">₹{total}</p>
            </div>
            <button
              onClick={handleConfirmation}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              View Order Status
            </button>
          </div>
        ) : (
          <>
            {/* Progress Steps */}
            <div className="px-6 py-4 bg-muted border-b border-border">
              <div className="flex gap-4 justify-between">
                {["details", "shipping", "payment"].map((s, idx) => (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                        step === s
                          ? "bg-primary text-primary-foreground"
                          : ["details", "shipping", "payment"].indexOf(step) >
                            idx
                          ? "bg-accent text-accent-foreground"
                          : "bg-border text-muted-foreground"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-xs font-medium hidden sm:inline ${
                        step === s ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {s === "details" && "Details"}
                      {s === "shipping" && "Shipping"}
                      {s === "payment" && "Payment"}
                    </span>
                    {idx < 2 && (
                      <div
                        className={`flex-1 h-1 ${
                          ["details", "shipping", "payment"].indexOf(step) > idx
                            ? "bg-accent"
                            : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Delivery Details */}
              {step === "details" && (
                <div className="space-y-4">
                  <h3 className="font-semibold mb-6">Delivery Details</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Full Name"
                      value={formData.fullName}
                      onChange={handleFormChange}
                      className="col-span-2 px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="col-span-2 px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone (10 digits)"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) =>
                        handleFormChange({
                          ...e,
                          target: {
                            ...e.target,
                            value: e.target.value.replace(/\D/g, ""),
                          },
                        })
                      }
                      className="col-span-2 px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      name="address"
                      placeholder="Address"
                      value={formData.address}
                      onChange={handleFormChange}
                      className="col-span-2 px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleFormChange}
                      className="px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      name="state"
                      placeholder="State"
                      value={formData.state}
                      onChange={handleFormChange}
                      className="px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      name="pincode"
                      placeholder="Pincode (6 digits)"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) =>
                        handleFormChange({
                          ...e,
                          target: {
                            ...e.target,
                            value: e.target.value.replace(/\D/g, ""),
                          },
                        })
                      }
                      className="col-span-2 px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* Shipping */}
              {step === "shipping" && (
                <div className="space-y-4">
                  <h3 className="font-semibold mb-6">Shipping Method</h3>

                  <div className="space-y-3">
                    <label className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted transition">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="express"
                        checked={shippingData.shippingMethod === "express"}
                        onChange={handleShippingChange}
                        className="mr-3"
                      />
                      <span className="font-semibold">
                        Express (24 hrs) - Free
                      </span>
                    </label>
                    <label className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted transition">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="standard"
                        checked={shippingData.shippingMethod === "standard"}
                        onChange={handleShippingChange}
                        className="mr-3"
                      />
                      <span className="font-semibold">
                        Standard (3-5 days) - ₹49
                      </span>
                    </label>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-semibold mb-2">
                      Preferred Delivery Date
                    </label>
                    <input
                      type="date"
                      name="deliveryDate"
                      value={shippingData.deliveryDate}
                      onChange={handleShippingChange}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* Payment */}
              {step === "payment" && (
                <div className="space-y-4">
                  <h3 className="font-semibold mb-6">Payment Method</h3>

                  <div className="space-y-3 mb-6">
                    <label className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted transition">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentData.paymentMethod === "card"}
                        onChange={handlePaymentChange}
                        className="mr-3"
                      />
                      <span className="font-semibold">Credit/Debit Card</span>
                    </label>
                    <label className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted transition">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentData.paymentMethod === "cod"}
                        onChange={handlePaymentChange}
                        className="mr-3"
                      />
                      <span className="font-semibold">Cash on Delivery</span>
                    </label>
                  </div>

                  {paymentData.paymentMethod === "card" && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        name="cardNumber"
                        placeholder="Card Number (16 digits)"
                        value={paymentData.cardNumber}
                        onChange={handlePaymentChange}
                        className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          name="expiryDate"
                          placeholder="MM/YY"
                          value={paymentData.expiryDate}
                          onChange={handlePaymentChange}
                          className="px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <input
                          type="text"
                          name="cvv"
                          placeholder="CVV (3 digits)"
                          value={paymentData.cvv}
                          onChange={handlePaymentChange}
                          className="px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Order Summary */}
              <div className="mt-8 p-4 bg-card border border-border rounded-lg space-y-2 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>₹{tax}</span>
                </div>
                <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{total}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    if (step === "details") onClose();
                    else if (step === "shipping") setStep("details");
                    else if (step === "payment") setStep("shipping");
                  }}
                  className="flex-1 border border-border py-3 rounded-lg font-semibold hover:bg-muted transition"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
                >
                  {loading
                    ? "Processing..."
                    : step === "payment"
                    ? "Complete Order"
                    : "Next"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
