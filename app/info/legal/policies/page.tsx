"use client";


export default function PoliciesPage() {
  return (
    <div className="bg-background min-h-screen pb-32">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl font-bold mb-10 text-foreground text-center">
          ShopStreak Policies
        </h1>

        {/* No Return Policy */}
        <section className="mb-10 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">
            No Return Policy
          </h2>
          <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            <p>
              ShopStreak operates with a strict <strong>No Return Policy</strong>.
              All sales are final once the order is placed and confirmed by the customer.
            </p>
            <p>Before placing an order, customers are strongly advised to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
              <li>Carefully review all product descriptions and specifications</li>
              <li>Check product images and dimensions</li>
              <li>Verify compatibility with their devices</li>
              <li>Read customer reviews and ratings</li>
            </ul>
            <p>
              By placing an order, customers acknowledge and accept this policy.
              If you have questions, please contact our support team before ordering.
            </p>
          </div>
        </section>

        {/* Shipping Policy */}
        <section className="mb-10 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">
            Shipping Policy
          </h2>
          <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            <p>ShopStreak offers free shipping on all orders across India.</p>
            <p className="font-medium text-foreground">Delivery Timelines:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
              <li>Standard Delivery: <strong>3–5 business days</strong></li>
              <li>Express Delivery: <strong>1–2 business days</strong> (₹99 extra)</li>
            </ul>
            <p>
              Orders are processed only on business days (Monday–Friday).
              Deliveries on weekends and holidays may take longer.
            </p>
          </div>
        </section>

        {/* Privacy Policy */}
        <section className="mb-10 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">
            Privacy Policy
          </h2>
          <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            <p>
              ShopStreak is committed to protecting your privacy. We collect
              personal information only to process orders and provide customer service.
            </p>
            <p className="font-medium text-foreground">Information We Collect:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
              <li>Name and contact details</li>
              <li>Shipping address</li>
              <li>Secure payment information</li>
              <li>Order history and preferences</li>
            </ul>
            <p>
              We never share your information with third parties without consent,
              except when required for delivery or legal compliance.
            </p>
          </div>
        </section>

        {/* Terms & Conditions */}
        <section className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">
            Terms & Conditions
          </h2>
          <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            <p>
              By using ShopStreak, you agree to follow all terms and conditions listed here.
            </p>
            <p className="font-medium text-foreground">User Responsibilities:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
              <li>Provide accurate and complete information</li>
              <li>Pay for orders through authorized payment methods</li>
              <li>Use the platform only for lawful purposes</li>
              <li>Respect intellectual property rights</li>
            </ul>
            <p className="font-medium text-foreground">Product Liability:</p>
            <p>
              ShopStreak is not responsible for defects beyond the manufacturing
              period. All products are sold as-is unless specified otherwise.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
