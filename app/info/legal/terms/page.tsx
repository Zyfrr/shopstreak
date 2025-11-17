"use client";

export default function TermsPage() {
  return (
    <div className="bg-background min-h-screen pb-32">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl font-bold mb-10 text-foreground text-center">
          ShopStreak Terms & Conditions
        </h1>

        {/* 1. Acceptance of Terms */}
        <section className="mb-10 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">1. Acceptance of Terms</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            By using <strong>ShopStreak</strong>, you agree to comply with these Terms and Conditions.
            If you do not agree, please discontinue using our website and services immediately.
          </p>
        </section>

        {/* 2. No Return Policy */}
        <section className="mb-10 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">2. No Return Policy</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            ShopStreak operates with a strict <strong>No Return Policy</strong>.
            All sales are final once an order is placed. Please review all product details,
            descriptions, and compatibility before confirming your purchase.
          </p>
        </section>

        {/* 3. Product Accuracy */}
        <section className="mb-10 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">3. Product Accuracy</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            We strive to ensure all product descriptions, pricing, and images on ShopStreak are accurate.
            However, we do not warrant that such information is error-free, complete, or up to date.
          </p>
        </section>

        {/* 4. Delivery Terms */}
        <section className="mb-10 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">4. Delivery Terms</h2>
          <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Express Delivery:</strong> We aim to deliver within
              <strong> 24 hours</strong> in most serviceable areas. Delivery times may vary by location.
            </p>
            <p>
              <strong className="text-foreground">Delivery Confirmation:</strong> Customers must accept
              their orders upon delivery. Refusal to accept will be treated as a return, and no refund
              will be issued under our no-return policy.
            </p>
          </div>
        </section>

        {/* 5. Payment */}
        <section className="mb-10 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">5. Payment</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Payments can be made using UPI, debit/credit cards, and other supported digital payment options.
            Orders will only be processed once payment confirmation is received.
          </p>
        </section>

        {/* 6. User Accounts */}
        <section className="mb-10 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">6. User Accounts</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials.
            Do not share your password or account access with others. ShopStreak will not be liable for
            any loss due to unauthorized account access.
          </p>
        </section>

        {/* 7. Limitation of Liability */}
        <section className="mb-10 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">7. Limitation of Liability</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            To the fullest extent permitted by law, ShopStreak will not be liable for indirect, incidental,
            special, or consequential damages resulting from your use of our website or products.
          </p>
        </section>

        {/* 8. Changes to Terms */}
        <section className="mb-10 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">8. Changes to Terms</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            ShopStreak reserves the right to modify these Terms and Conditions at any time. Updates will take effect
            immediately upon posting to the website, and continued use of the platform implies acceptance of changes.
          </p>
        </section>

        {/* 9. Contact Us */}
        <section className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">9. Contact Us</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            For any legal or policy-related inquiries, please contact us at{" "}
            <a
              href= "https://mail.google.com/mail/?view=cm&fs=1&to=shopstreak18@gmail.com"
              className="text-primary font-medium hover:underline"
            >
              shopstreak18@gmail.com
            </a>.
          </p>
        </section>

        {/* Last Updated */}
        <div className="mt-12 p-6 bg-muted rounded-lg text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Last updated: January 2024. ShopStreak reserves the right to update these Terms
            and Conditions without prior notice.
          </p>
        </div>
      </main>
    </div>
  );
}
