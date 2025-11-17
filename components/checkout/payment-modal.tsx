"use client"

import { useState } from "react"
import { X, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

type PaymentTab = "upi" | "card" | "cod"
type PaymentStatus = "idle" | "processing" | "success" | "error"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  orderId?: string
}

export function PaymentModal({ isOpen, onClose, amount, orderId = "SS-2025-001" }: PaymentModalProps) {
  const [tab, setTab] = useState<PaymentTab>("upi")
  const [status, setStatus] = useState<PaymentStatus>("idle")
  const [error, setError] = useState("")

  // UPI State
  const [upiId, setUpiId] = useState("")

  // Card State
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")

  // COD State
  const [acceptCOD, setAcceptCOD] = useState(false)

  const handleUPIPayment = async () => {
    if (!upiId) {
      setError("Please enter a valid UPI ID")
      return
    }

    setStatus("processing")
    setError("")

    setTimeout(() => {
      if (Math.random() > 0.3) {
        setStatus("success")
        setTimeout(() => {
          onClose()
          setStatus("idle")
          setUpiId("")
        }, 2000)
      } else {
        setStatus("error")
        setError("Payment failed. Please try again.")
      }
    }, 2000)
  }

  const handleCardPayment = async () => {
    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
      setError("Please fill all card details")
      return
    }

    setStatus("processing")
    setError("")

    setTimeout(() => {
      if (Math.random() > 0.2) {
        setStatus("success")
        setTimeout(() => {
          onClose()
          setStatus("idle")
          setCardNumber("")
          setCardName("")
          setCardExpiry("")
          setCardCvv("")
        }, 2000)
      } else {
        setStatus("error")
        setError("Card payment failed. Please try again.")
      }
    }, 2000)
  }

  const handleCODConfirm = async () => {
    if (!acceptCOD) {
      setError("Please confirm to proceed with COD")
      return
    }

    setStatus("processing")
    setError("")

    setTimeout(() => {
      setStatus("success")
      setTimeout(() => {
        onClose()
        setStatus("idle")
        setAcceptCOD(false)
      }, 2000)
    }, 1500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-xl font-bold">Payment</h2>
          <button
            onClick={onClose}
            disabled={status === "processing"}
            className="p-1 hover:bg-muted rounded transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Amount */}
        <div className="p-6 bg-primary/5 border-b border-border">
          <p className="text-sm text-muted-foreground mb-1">Amount to pay</p>
          <p className="text-3xl font-bold text-primary">₹{amount}</p>
          <p className="text-xs text-muted-foreground mt-2">Order: {orderId}</p>
        </div>

        {status === "success" ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Payment Successful!</h3>
            <p className="text-sm text-muted-foreground mb-6">Your order has been placed successfully.</p>
            <p className="text-xs text-muted-foreground">Order ID: {orderId}</p>
          </div>
        ) : status === "error" ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-red-600">Payment Failed</h3>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Button
              onClick={() => {
                setStatus("idle")
                setError("")
              }}
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 p-4 border-b border-border">
              {["upi", "card", "cod"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t as PaymentTab)}
                  disabled={status === "processing"}
                  className={`flex-1 py-2 px-3 rounded font-medium text-sm transition ${
                    tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t === "upi" ? "UPI" : t === "card" ? "Card" : "COD"}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-200 text-red-700 text-sm p-3 rounded">{error}</div>
              )}

              {tab === "upi" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select UPI Provider</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { name: "Google Pay", icon: "₹" },
                        { name: "PhonePe", icon: "◉" },
                        { name: "Paytm", icon: "◆" },
                      ].map((provider) => (
                        <button
                          key={provider.name}
                          className="p-4 border-2 border-border rounded-lg hover:border-primary transition text-center"
                        >
                          <span className="text-2xl block mb-1">{provider.icon}</span>
                          <p className="text-xs font-medium">{provider.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Or Enter UPI ID</label>
                    <input
                      type="text"
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      disabled={status === "processing"}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>

                  <Button
                    onClick={handleUPIPayment}
                    disabled={status === "processing" || !upiId}
                    className="w-full"
                    size="lg"
                  >
                    {status === "processing" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Pay with UPI"
                    )}
                  </Button>
                </div>
              )}

              {tab === "card" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      disabled={status === "processing"}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\s/g, "").slice(0, 16)
                        const formatted = val.replace(/(\d{4})/g, "$1 ").trim()
                        setCardNumber(formatted)
                      }}
                      disabled={status === "processing"}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Expiry</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, "").slice(0, 4)
                          if (val.length >= 2) {
                            val = val.slice(0, 2) + "/" + val.slice(2)
                          }
                          setCardExpiry(val)
                        }}
                        disabled={status === "processing"}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        maxLength={3}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                        disabled={status === "processing"}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <Button onClick={handleCardPayment} disabled={status === "processing"} className="w-full" size="lg">
                    {status === "processing" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Pay with Card"
                    )}
                  </Button>
                </div>
              )}

              {tab === "cod" && (
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      You will pay <strong>₹{amount}</strong> when your order is delivered. No additional charges.
                    </p>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptCOD}
                      onChange={(e) => setAcceptCOD(e.target.checked)}
                      disabled={status === "processing"}
                      className="w-4 h-4 mt-1"
                    />
                    <span className="text-sm">I agree to the terms and confirm to proceed with Cash on Delivery</span>
                  </label>

                  <Button
                    onClick={handleCODConfirm}
                    disabled={status === "processing" || !acceptCOD}
                    className="w-full"
                    size="lg"
                  >
                    {status === "processing" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Confirm COD"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
