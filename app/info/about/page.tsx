"use client"

import Link from "next/link"
import { ShoppingCart, Search, Zap, Lock, Truck, Star, Package, Shield } from "lucide-react"

export default function AboutPage() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Express delivery within 24 hours to your doorstep",
    },
    {
      icon: Lock,
      title: "100% Authentic",
      description: "All products are genuine and verified before delivery",
    },
    {
      icon: Truck,
      title: "Free Shipping",
      description: "Free delivery on all orders across India",
    },
    {
      icon: Package,
      title: "Exclusive Products",
      description: "Rare and high-demand products under ₹6000",
    },
    {
      icon: Shield,
      title: "No Return Policy",
      description: "Focus on quality to ensure you get exactly what you want",
    },
    {
      icon: Star,
      title: "Premium Selection",
      description: "Curated products with high market demand and limited supply",
    },
  ]

  const values = [
    {
      title: "Customer First",
      description: "We prioritize customer satisfaction above everything",
    },
    {
      title: "Quality Assurance",
      description: "Rigorous quality checks on every product",
    },
    {
      title: "Innovation",
      description: "Continuously improving our platform and services",
    },
    {
      title: "Exclusivity",
      description: "Specializing in rare, high-demand products",
    },
  ]

  return (
    <div className="min-h-screen bg-background pb-32">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Hero Section */}
        <section className="bg-primary text-primary-foreground max-w-7xl mx-auto p-11 border-border rounded-lg">
          <div className="max-w-7xl mx-auto pl-4">
            <h1 className="text-4xl font-bold mb-4">About ShopStreak</h1>
            <p className="text-lg text-primary-foreground/80">
              Your trusted destination for rare, high-demand products with fast delivery
            </p>
          </div>
        </section>

        {/* Our Story */}
        <section className="mb-16 mt-10">
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <div className="bg-card border border-border rounded-lg p-8">
            <p className="text-foreground mb-4 leading-relaxed">
              ShopStreak was founded with a unique mission: to bring rare, high-demand products directly to your doorstep 
              at affordable prices under ₹6000. We specialize in products that have high market demand but low supply, 
              making them difficult to find elsewhere.
            </p>
            <p className="text-foreground mb-4 leading-relaxed">
              Our <strong>no-return policy</strong> is designed to ensure we focus on delivering perfect products every time. 
              We conduct rigorous quality checks before shipping, guaranteeing that you receive exactly what you ordered 
              in pristine condition.
            </p>
            <p className="text-foreground mb-4 leading-relaxed">
              We believe in the power of exclusivity and quality. Each product in our catalog is carefully selected based 
              on market trends, customer demand, and quality standards. Our express delivery network ensures you get 
              these exclusive products faster than anyone else.
            </p>
            <p className="text-foreground leading-relaxed">
              Today, ShopStreak serves thousands of satisfied customers across India, delivering rare finds and 
              high-demand products with our signature speed and quality guarantee.
            </p>
          </div>
        </section>

        {/* Key Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Why Choose ShopStreak?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="bg-card border border-border rounded-lg p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Product Focus */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Our Product Focus</h2>
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4 text-primary">Exclusive Range Under ₹6000</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">✓</span>
                    <span>All products priced under ₹6000 for affordability</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">✓</span>
                    <span>Rare and hard-to-find products</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">✓</span>
                    <span>High market demand items</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">✓</span>
                    <span>Limited supply collections</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4 text-primary">Quality Assurance</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">✓</span>
                    <span>Every product verified for authenticity</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">✓</span>
                    <span>Rigorous quality checks before shipping</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">✓</span>
                    <span>No-return policy ensures perfect delivery</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">✓</span>
                    <span>Express 24-hour delivery guarantee</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Our Core Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-muted rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary text-primary-foreground rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Discover Rare Finds?</h2>
          <p className="mb-6 text-primary-foreground/80">
            Explore our exclusive collection of high-demand products under ₹6000
          </p>
          <Link
            href="/product"
            className="inline-block px-8 py-3 bg-accent text-accent-foreground rounded-lg font-bold hover:opacity-90 transition"
          >
            Start Shopping Now
          </Link>
        </section>
      </div>

    </div>
  )
}