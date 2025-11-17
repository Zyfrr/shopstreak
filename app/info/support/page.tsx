"use client";

import Link from "next/link";
import { ShoppingCart, Search, HelpCircle, MessageSquare } from "lucide-react";
import { useState } from "react";

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: "What is ShopStreak's no-return policy?",
      answer:
        "ShopStreak operates on a strict no-return policy. All sales are final. We ensure product authenticity and quality before delivery, but once you accept the order, returns are not accepted. Please review all product details carefully before purchasing.",
    },
    {
      question: "How long does delivery take?",
      answer:
        "We offer express delivery within 24 hours in most areas. Delivery times may vary based on your location and current order volume. You can track your order status in real-time through your account.",
    },
    {
      question: "Do you deliver outside India?",
      answer:
        "Currently, ShopStreak delivers only within India. We are working on international expansion. Sign up for our newsletter to be notified when we launch in your region.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept UPI, credit cards, debit cards, net banking, and other digital payment options. All payments are processed securely through our encrypted payment gateway.",
    },
    {
      question: "How can I track my order?",
      answer:
        "Once your order is placed, you'll receive a tracking link via email and SMS. You can also track your order from your account dashboard by clicking on the order.",
    },
    {
      question: "What should I do if I receive a damaged product?",
      answer:
        "If you receive a damaged product, contact our support team immediately with photos of the damage. We will work with you to resolve the issue based on our policy.",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">

      {/* Main Content */}
      <div className=" max-w-4xl mx-auto px-4 py-12">
        <section className=" pl-10 bg-primary text-primary-foreground max-w-4xl mx-auto px-4 py-12 border-border rounded-lg">
        <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
          Support & Help
        </h1>
        <p className="text-sm sm:text-base text-primary-foreground/80 mt-1">
          Find answers to common questions and get support
        </p>
      </section>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-6 mb-12 mt-10">
          <Link
            href="/info/contact"
            className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold mb-2">Contact Support</h3>
                <p className="text-sm text-muted-foreground">
                  Get in touch with our support team for personalized help
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="https://wa.me/919876543210"
            className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold mb-2">WhatsApp Support</h3>
                <p className="text-sm text-muted-foreground">
                  Chat with us on WhatsApp for quick assistance
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted transition font-semibold text-left"
                >
                  <span>{faq.question}</span>
                  <span
                    className={`text-2xl transition ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-6 py-4 border-t border-border bg-muted/50">
                    <p className="text-foreground/80 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-12 bg-primary text-primary-foreground rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="mb-6">
            Our support team is available 24/7 to assist you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href= "https://mail.google.com/mail/?view=cm&fs=1&to=shopstreak18@gmail.com"
              className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-bold hover:opacity-90 transition"
            >
              Email Support
            </Link>
            <a
              href="tel:+919791509443"
              className="px-6 py-3 bg-primary-foreground/20 text-primary-foreground rounded-lg font-bold hover:bg-primary-foreground/30 transition"
            >
              Call us: +91 9791509443
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
