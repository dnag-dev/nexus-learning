/**
 * Privacy Policy — required for App Store and COPPA compliance.
 *
 * This page is publicly accessible at /privacy and linked from
 * the mobile app's App Store listing.
 */

export const metadata = {
  title: "Privacy Policy — Aauti Learn",
  description: "Privacy Policy for the Aauti Learn educational platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Last updated: March 11, 2026
        </p>

        <div className="prose prose-gray max-w-none">
          <Section title="1. Introduction">
            <p>
              Aauti Learn (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;)
              provides an AI-powered adaptive tutoring platform for K-12
              students. This Privacy Policy explains how we collect, use, and
              protect information when you use our mobile application and
              website (collectively, the &quot;Service&quot;).
            </p>
            <p>
              We are committed to protecting the privacy of children and comply
              with the Children&apos;s Online Privacy Protection Act (COPPA) and
              other applicable privacy laws.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">
              Information provided by parents:
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Parent name and email address (for account creation)</li>
              <li>Child display name (chosen by parent)</li>
              <li>Child grade level</li>
              <li>Child login PIN (encrypted, not stored in plaintext)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">
              Information collected during use:
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Learning progress data (questions answered, accuracy, mastery
                levels)
              </li>
              <li>Session duration and activity timestamps</li>
              <li>Device type and operating system version</li>
              <li>
                Push notification tokens (only with parent permission)
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">
              Information we DO NOT collect:
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Real names of children (only display names chosen by parents)</li>
              <li>Photos, videos, or voice recordings</li>
              <li>Precise geolocation data</li>
              <li>Contacts or address book information</li>
              <li>Browsing history outside our Service</li>
              <li>
                Advertising identifiers or data for targeted advertising
              </li>
            </ul>
          </Section>

          <Section title="3. How We Use Information">
            <p>We use collected information solely to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Provide personalized, adaptive learning experiences tailored to
                each student&apos;s level
              </li>
              <li>
                Track learning progress and mastery for students and parents
              </li>
              <li>Generate progress reports for parents</li>
              <li>
                Send push notifications about learning reminders and
                achievements (with permission)
              </li>
              <li>Improve our educational content and algorithms</li>
              <li>Maintain and secure the Service</li>
            </ul>
            <p className="mt-4 font-semibold">
              We do NOT use student data for advertising, marketing, or any
              purpose unrelated to providing educational services.
            </p>
          </Section>

          <Section title="4. Children's Privacy (COPPA Compliance)">
            <p>
              We take children&apos;s privacy seriously and comply with COPPA:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Parental consent:</strong> A parent or guardian must
                create the account and add children. Children cannot create
                accounts independently.
              </li>
              <li>
                <strong>Minimal data:</strong> We collect only information
                necessary to provide the educational service.
              </li>
              <li>
                <strong>No third-party sharing:</strong> We do not share
                children&apos;s personal information with third parties for
                commercial purposes.
              </li>
              <li>
                <strong>No advertising:</strong> We do not display ads to
                children or use their data for advertising.
              </li>
              <li>
                <strong>Parental access:</strong> Parents can review, update, or
                delete their child&apos;s information at any time through the
                parent dashboard.
              </li>
              <li>
                <strong>Data retention:</strong> We retain learning data only as
                long as the account is active. Parents may request deletion at
                any time.
              </li>
            </ul>
          </Section>

          <Section title="5. Data Security">
            <p>
              We implement appropriate technical and organizational measures to
              protect personal information:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>All data transmitted over HTTPS/TLS encryption</li>
              <li>Authentication tokens stored securely on device</li>
              <li>Login PINs hashed using industry-standard algorithms</li>
              <li>Database access restricted to authorized personnel</li>
              <li>Regular security reviews of our infrastructure</li>
            </ul>
          </Section>

          <Section title="6. Data Sharing">
            <p>
              We do not sell, rent, or trade personal information. We may share
              data only in these limited circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Service providers:</strong> We use trusted third-party
                services (hosting, authentication) that process data on our
                behalf under strict data protection agreements.
              </li>
              <li>
                <strong>Legal requirements:</strong> We may disclose information
                if required by law, court order, or to protect safety.
              </li>
              <li>
                <strong>With parent consent:</strong> We will not share
                children&apos;s information with any third party without explicit
                parental consent.
              </li>
            </ul>
          </Section>

          <Section title="7. Third-Party Services">
            <p>Our Service uses the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Vercel:</strong> Web hosting and serverless functions
              </li>
              <li>
                <strong>Neon:</strong> Database hosting (PostgreSQL)
              </li>
              <li>
                <strong>Auth0:</strong> Parent authentication
              </li>
              <li>
                <strong>Anthropic (Claude AI):</strong> AI-powered tutoring
                content generation (no student personal data is sent to AI
                services)
              </li>
              <li>
                <strong>Expo:</strong> Mobile app infrastructure and push
                notifications
              </li>
            </ul>
          </Section>

          <Section title="8. Your Rights">
            <p>Parents and guardians have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access their child&apos;s personal information</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of their child&apos;s account and data</li>
              <li>Withdraw consent for data collection</li>
              <li>Opt out of push notifications</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact us at the email below.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will
              notify parents of any material changes via email or in-app
              notification. Continued use of the Service after changes
              constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <p>
              If you have questions about this Privacy Policy or our data
              practices, please contact us:
            </p>
            <p className="mt-2">
              <strong>Email:</strong>{" "}
              <a
                href="mailto:privacy@aautilearn.com"
                className="text-purple-600 hover:underline"
              >
                privacy@aautilearn.com
              </a>
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="text-gray-700 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}
