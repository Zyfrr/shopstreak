"use client";

export default function PrivacyPage() {
  return (
    <div className="bg-background min-h-screen pb-32">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl font-bold mb-10 text-foreground text-center">
          ShopStreak Privacy Policy
        </h1>

        {/* Introduction */}
        <section className="mb-10 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">1. Introduction</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            ShopStreak (“we”, “us”, “our”) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard
            your personal information when you use our services.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="mb-10 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">2. Information We Collect</h2>
          <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Personal Information:</strong> Includes
              your name, email address, contact number, and shipping details.
            </p>
            <p>
              <strong className="text-foreground">Order Information:</strong> Details about
              your orders, purchase history, and delivery preferences.
            </p>
            <p>
              <strong className="text-foreground">Browsing Data:</strong> We collect analytics
              and cookie-based data to enhance your experience on our website.
            </p>
          </div>
        </section>

        {/* How We Use Your Information */}
        <section className="mb-10 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-muted-foreground leading-relaxed ml-2 sm:ml-4">
            <li>To process and fulfill orders efficiently</li>
            <li>To communicate updates about your account or purchases</li>
            <li>To improve website functionality and customer experience</li>
            <li>To send promotional content (with your consent)</li>
            <li>To comply with applicable laws and regulations</li>
          </ul>
        </section>

        {/* Data Security */}
        <section className="mb-10 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">4. Data Security</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            We employ advanced security protocols to protect your personal data from
            unauthorized access, misuse, or disclosure. Sensitive payment information
            is processed through secure, encrypted gateways.
          </p>
        </section>

        {/* Your Rights */}
        <section className="mb-10 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">5. Your Rights</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            You have the right to access, correct, or request deletion of your personal
            information. You may also opt out of marketing communications at any time
            by contacting our support team.
          </p>
        </section>

        {/* Contact Us */}
        <section className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-primary">6. Contact Us</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            For any privacy-related concerns or requests, please reach out to us at{" "}
            <a href= "https://mail.google.com/mail/?view=cm&fs=1&to=shopstreak18@gmail.com" className="text-primary font-medium hover:underline">
              shopstreak18@gmail.com
            </a>{" "}
            or call us at <span className="font-medium text-foreground"><a
              href="tel:+919791509443"
            >
               +91 9791509443
            </a></span>.
          </p>
        </section>

        {/* Last Updated */}
        <div className="mt-12 p-6 bg-muted rounded-lg text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Last updated: January 2024. ShopStreak reserves the right to update this Privacy
            Policy at any time. Changes will take effect immediately upon posting.
          </p>
        </div>
      </main>
    </div>
  );
}
