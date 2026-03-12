/**
 * Support — required for App Store submission.
 *
 * Provides contact info and FAQs for parents and students.
 */

export const metadata = {
  title: "Support — Aauti Learn",
  description: "Get help with the Aauti Learn educational platform.",
};

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Support</h1>
        <p className="text-sm text-gray-500 mb-10">
          We&apos;re here to help you and your child succeed.
        </p>

        <div className="prose prose-gray max-w-none">
          <Section title="Contact Us">
            <p>
              Have a question, suggestion, or need help with your account? Reach
              out to our support team:
            </p>
            <p className="mt-2">
              <strong>Email:</strong>{" "}
              <a
                href="mailto:support@aautilearn.com"
                className="text-purple-600 hover:underline"
              >
                support@aautilearn.com
              </a>
            </p>
            <p className="mt-1 text-sm text-gray-500">
              We typically respond within 24 hours on business days.
            </p>
          </Section>

          <Section title="Frequently Asked Questions">
            <FAQ
              q="How does my child log in?"
              a="After you create a parent account and add your child, they can log in using the username and 4-digit PIN you set for them. No email address is needed for children."
            />
            <FAQ
              q="How does the adaptive learning work?"
              a="Aauti Learn uses a mastery-based system that tracks your child's understanding of each concept. Questions automatically adjust in difficulty based on their performance, ensuring they're always challenged at the right level."
            />
            <FAQ
              q="What subjects and grade levels are covered?"
              a="We currently offer Math and English Language Arts for Kindergarten through Grade 12. Our curriculum is continuously expanding with new topics and content."
            />
            <FAQ
              q="Is my child's data safe?"
              a="Yes. We take children's privacy seriously and comply with COPPA. We collect only what's needed to provide the educational service, never show ads, and never share children's data with third parties. See our Privacy Policy for full details."
            />
            <FAQ
              q="Can I delete my child's data?"
              a="Yes. Parents can request deletion of their child's account and all associated learning data at any time by contacting us at support@aautilearn.com."
            />
            <FAQ
              q="How do streaks work?"
              a="Your child earns a streak day by completing at least one learning session. Streaks reset if they miss a day. The daily reminder notification can help them stay consistent."
            />
            <FAQ
              q="What devices are supported?"
              a="Aauti Learn is available as a web app (any modern browser) and as a native iOS app. Android support is coming soon."
            />
            <FAQ
              q="Is there a cost?"
              a="Aauti Learn offers a free tier with core learning features. Premium features are available through subscription plans — see pricing details in the app."
            />
          </Section>

          <Section title="Troubleshooting">
            <FAQ
              q="The app is showing an error or crashing"
              a="Try closing and reopening the app. If the issue persists, make sure you have the latest version installed. You can also contact us with a description of the problem."
            />
            <FAQ
              q="My child forgot their PIN"
              a="Parents can reset their child's PIN from the parent dashboard on the web app. Log in to your parent account and go to Settings."
            />
            <FAQ
              q="Questions seem too easy or too hard"
              a="The adaptive system calibrates over several sessions. If questions seem off after 5+ sessions, try running a new diagnostic assessment to re-calibrate your child's level."
            />
          </Section>

          <Section title="Feedback">
            <p>
              We love hearing from families! If you have suggestions for new
              features, content, or improvements, please email us at{" "}
              <a
                href="mailto:feedback@aautilearn.com"
                className="text-purple-600 hover:underline"
              >
                feedback@aautilearn.com
              </a>
              .
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
      <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-3">
      <p className="font-semibold text-gray-900 mb-1">{q}</p>
      <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
    </div>
  );
}
