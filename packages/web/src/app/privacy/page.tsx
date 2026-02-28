
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | KinPath",
  description:
    "Learn how KinPath collects, uses, and protects your personal information and your family's data.",
};

const LAST_UPDATED = "February 20, 2026";
const EFFECTIVE_DATE = "February 20, 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f0eeec]">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kinpath-logo.png" alt="KinPath" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/auth/login"
              className="text-stone-600 hover:text-stone-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="rounded-xl bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-stone-200 bg-white px-6 py-12 text-center">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wider text-brand-600">Legal</p>
          <h1 className="mt-2 text-4xl font-bold text-stone-900">Privacy Policy</h1>
          <p className="mt-4 text-stone-500 text-sm">
            Effective {EFFECTIVE_DATE} &nbsp;·&nbsp; Last updated {LAST_UPDATED}
          </p>
          <p className="mt-6 text-stone-600 leading-relaxed">
            KinPath is built for parents and parents-to-be. We understand that
            the information you share with us about your family, your child,
            and your parenting journey is deeply personal. This policy explains
            exactly what we collect, why, and how we protect it.
          </p>
        </div>
      </div>

      {/* Table of contents + body */}
      <div className="mx-auto max-w-5xl px-6 py-12 lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">
              Contents
            </p>
            <nav className="space-y-2 text-sm">
              {[
                { href: "#who-we-are", label: "1. Who We Are" },
                { href: "#information-we-collect", label: "2. Information We Collect" },
                { href: "#how-we-use", label: "3. How We Use Your Information" },
                { href: "#sharing", label: "4. How We Share Information" },
                { href: "#data-retention", label: "5. Data Retention" },
                { href: "#your-rights", label: "6. Your Rights & Choices" },
                { href: "#children", label: "7. Children's Privacy" },
                { href: "#security", label: "8. Security" },
                { href: "#cookies", label: "9. Cookies & Tracking" },
                { href: "#third-party", label: "10. Third-Party Services" },
                { href: "#international", label: "11. International Users" },
                { href: "#changes", label: "12. Changes to This Policy" },
                { href: "#contact", label: "13. Contact Us" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block text-stone-600 hover:text-brand-600 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="space-y-12">
          {/* Callout */}
          <div className="rounded-2xl border border-brand-200 bg-brand-50 px-6 py-5">
            <p className="text-sm font-semibold text-brand-800">
              The short version
            </p>
            <ul className="mt-2 space-y-1 text-sm text-brand-700 list-disc list-inside">
              <li>We never sell your personal data to anyone, ever.</li>
              <li>We do not store health records or medical data.</li>
              <li>You can delete your account and all associated data at any time.</li>
              <li>We use your information only to provide and improve KinPath.</li>
            </ul>
          </div>

          {/* Section 1 */}
          <section id="who-we-are" className="scroll-mt-24">
            <SectionHeading number="1" title="Who We Are" />
            <Prose>
              <p>
                Kinpath Family, LLC (&ldquo;KinPath,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the KinPath
                website and mobile-optimized web application located at{" "}
                <span className="font-medium text-stone-800">kinpath.family</span>{" "}
                (the &ldquo;Service&rdquo;). KinPath provides evidence-based parenting
                resources, personalized guidance, and family planning tools for
                parents and parents-to-be from pregnancy through early childhood.
              </p>
              <p>
                This Privacy Policy applies to all users of the Service. By
                using KinPath, you agree to the collection and use of
                information described in this policy.
              </p>
            </Prose>
          </section>

          {/* Section 2 */}
          <section id="information-we-collect" className="scroll-mt-24">
            <SectionHeading number="2" title="Information We Collect" />
            <Prose>
              <p>
                We collect information you provide directly, information
                collected automatically when you use the Service, and
                information from third-party authentication providers.
              </p>
            </Prose>

            <SubHeading>2.1 Information You Provide Directly</SubHeading>
            <DataTable
              rows={[
                {
                  category: "Account information",
                  examples: "Email address, display name, password (hashed, never stored in plain text)",
                  purpose: "Create and manage your account",
                },
                {
                  category: "Child profile",
                  examples: "Child's name or nickname, date of birth or due date, whether the baby has been born",
                  purpose: "Personalize content to your child's developmental stage",
                },
                {
                  category: "Parenting preferences",
                  examples: "Birth preference, feeding approach, vaccine stance, dietary preference, parenting philosophy, topics of interest, religious or spiritual tradition",
                  purpose: "Tailor resource recommendations to your family's values",
                },
                {
                  category: "Chat messages",
                  examples: "Questions and follow-up messages you type in the chat feature",
                  purpose: "Provide AI-assisted answers; store saved conversations at your request",
                },
                {
                  category: "Family / household data",
                  examples: "Partner's email address, partner's display name (Family tier only)",
                  purpose: "Send household invitations and enable shared access",
                },
                {
                  category: "Notification preferences",
                  examples: "Weekly digest opt-in, email frequency settings",
                  purpose: "Send only the communications you want",
                },
              ]}
            />

            <SubHeading>2.2 Information Collected Automatically</SubHeading>
            <DataTable
              rows={[
                {
                  category: "Usage data",
                  examples: "Pages visited, features used, time spent, resources viewed",
                  purpose: "Understand how the Service is used so we can improve it",
                },
                {
                  category: "Device & browser data",
                  examples: "Browser type, operating system, screen resolution, language setting",
                  purpose: "Ensure the Service works correctly on your device",
                },
                {
                  category: "Log data",
                  examples: "IP address, referring URL, timestamps",
                  purpose: "Security monitoring and debugging",
                },
                {
                  category: "Authentication tokens",
                  examples: "Supabase session cookies used to keep you logged in",
                  purpose: "Maintain a secure, persistent login session",
                },
              ]}
            />

            <SubHeading>2.3 Information from Third Parties</SubHeading>
            <Prose>
              <p>
                If you sign in using Google or Apple, we receive your name and
                email address from those providers as permitted by your account
                settings with them. We do not receive your passwords or any
                other data from these providers beyond what is needed to create
                or link your KinPath account.
              </p>
            </Prose>

            <SubHeading>2.4 Information We Do NOT Collect</SubHeading>
            <Prose>
              <ul>
                <li>
                  <strong>Medical records or health records.</strong> KinPath is
                  not a medical provider. We do not collect, store, or process
                  Protected Health Information (PHI) as defined under HIPAA.
                </li>
                <li>
                  <strong>Payment card data.</strong> All payment processing is
                  handled by Stripe. We never see or store your full credit card
                  number, CVV, or bank account details.
                </li>
                <li>
                  <strong>Precise geolocation.</strong> We do not request
                  access to your device&rsquo;s GPS location.
                </li>
                <li>
                  <strong>Children&rsquo;s personal information.</strong> We
                  collect only a child&rsquo;s name/nickname and date of birth
                  for personalization purposes. We do not build profiles on
                  children and we are not directed at children under 13.
                </li>
              </ul>
            </Prose>
          </section>

          {/* Section 3 */}
          <section id="how-we-use" className="scroll-mt-24">
            <SectionHeading number="3" title="How We Use Your Information" />
            <Prose>
              <p>We use the information we collect to:</p>
              <ul>
                <li>
                  <strong>Provide the Service.</strong> Create your account,
                  authenticate you, and operate the features you use:
                  personalized resource recommendations, the checklist and
                  planning tool, the AI chat assistant, and household sharing.
                </li>
                <li>
                  <strong>Personalize your experience.</strong> Match resources
                  and content to your child&rsquo;s age, your parenting
                  preferences, dietary needs, and topics of interest.
                </li>
                <li>
                  <strong>Communicate with you.</strong> Send account-related
                  emails (email verification, password reset), transactional
                  notifications (subscription confirmations, household
                  invitations), and, if you opt in, weekly content digests.
                  You can unsubscribe from marketing emails at any time.
                </li>
                <li>
                  <strong>Process payments.</strong> Manage your subscription,
                  upgrades, and refunds through Stripe.
                </li>
                <li>
                  <strong>Improve the Service.</strong> Analyze aggregated,
                  de-identified usage patterns to understand which features are
                  most useful, fix bugs, and develop new content.
                </li>
                <li>
                  <strong>Ensure security and prevent fraud.</strong> Monitor
                  for unauthorized access, abuse, and violations of our Terms
                  of Service.
                </li>
                <li>
                  <strong>Comply with legal obligations.</strong> Respond to
                  lawful requests from courts or regulators and enforce our
                  legal rights.
                </li>
              </ul>
              <p>
                We rely on the following legal bases under applicable data
                protection law: <em>contract performance</em> (to provide the
                Service you signed up for), <em>legitimate interests</em>{" "}
                (security, fraud prevention, product improvement), <em>consent</em>{" "}
                (marketing emails, optional preferences), and{" "}
                <em>legal obligation</em> (compliance with law).
              </p>
            </Prose>
          </section>

          {/* Section 4 */}
          <section id="sharing" className="scroll-mt-24">
            <SectionHeading number="4" title="How We Share Your Information" />
            <Prose>
              <p>
                <strong>We do not sell your personal data.</strong> We share
                your information only in the following limited circumstances:
              </p>
              <ul>
                <li>
                  <strong>Service providers.</strong> We work with a small set
                  of vetted vendors who process data on our behalf:{" "}
                  <em>Supabase</em> (database and authentication),{" "}
                  <em>Stripe</em> (payment processing),{" "}
                  <em>Anthropic / OpenAI-compatible providers</em> (AI chat
                  inference; messages are sent to generate a response and are
                  not used to train models under our agreements), and{" "}
                  <em>transactional email providers</em> (account and
                  notification emails). Each vendor is contractually bound to
                  use your data only to perform services for us.
                </li>
                <li>
                  <strong>Household members.</strong> If you are on the Family
                  plan and invite a partner, they will be able to see shared
                  checklist items, your child profiles, and assigned tasks. They
                  will not see your full account preferences or billing
                  information.
                </li>
                <li>
                  <strong>Professional reviewers.</strong> Resources on KinPath
                  may be reviewed by licensed healthcare professionals. Reviewers
                  see only resource content, never your personal information.
                </li>
                <li>
                  <strong>Legal requirements.</strong> We may disclose
                  information if required by law, court order, or government
                  request, or when we believe disclosure is necessary to protect
                  the rights, property, or safety of KinPath, our users, or the
                  public.
                </li>
                <li>
                  <strong>Business transfers.</strong> If KinPath is acquired,
                  merged, or goes through a similar corporate event, your
                  information may be transferred as part of that transaction.
                  We will notify you via the email address on your account
                  before your information becomes subject to a materially
                  different privacy policy.
                </li>
                <li>
                  <strong>With your consent.</strong> We will share your
                  information with third parties when you explicitly direct us
                  to do so.
                </li>
              </ul>
            </Prose>
          </section>

          {/* Section 5 */}
          <section id="data-retention" className="scroll-mt-24">
            <SectionHeading number="5" title="Data Retention" />
            <Prose>
              <p>
                We retain your personal information for as long as your account
                is active or as needed to provide the Service. Specifically:
              </p>
              <ul>
                <li>
                  <strong>Account data</strong> is retained until you delete
                  your account or request deletion.
                </li>
                <li>
                  <strong>Chat conversations</strong> you have saved are
                  retained until you delete them or delete your account.
                  Unsaved chat sessions are not stored beyond the current
                  browser session.
                </li>
                <li>
                  <strong>Aggregated analytics data</strong> (de-identified,
                  not linked to you personally) may be retained indefinitely
                  for product improvement purposes.
                </li>
                <li>
                  <strong>Billing records</strong> are retained for up to 7
                  years as required for tax and financial compliance, even after
                  account deletion. These records are held by Stripe and contain
                  no payment card data.
                </li>
                <li>
                  <strong>Server logs</strong> containing IP addresses are
                  automatically purged after 90 days.
                </li>
              </ul>
              <p>
                When you delete your account, we delete or anonymize your
                personal information within 30 days, except where retention is
                required by law.
              </p>
            </Prose>
          </section>

          {/* Section 6 */}
          <section id="your-rights" className="scroll-mt-24">
            <SectionHeading number="6" title="Your Rights & Choices" />
            <Prose>
              <p>
                Depending on where you live, you may have the following rights
                regarding your personal data:
              </p>
              <ul>
                <li>
                  <strong>Access.</strong> Request a copy of the personal
                  information we hold about you.
                </li>
                <li>
                  <strong>Correction.</strong> Ask us to correct inaccurate or
                  incomplete information. Most account and preference data can
                  be updated directly in your{" "}
                  <Link href="/settings" className="text-brand-600 hover:underline">
                    Settings
                  </Link>{" "}
                  page.
                </li>
                <li>
                  <strong>Deletion.</strong> Request that we delete your
                  personal information. You can delete your account at any time
                  from your Settings page. This deletes your profile, child
                  profiles, preferences, chat history, and checklist data.
                </li>
                <li>
                  <strong>Portability.</strong> Request an export of your data
                  in a machine-readable format.
                </li>
                <li>
                  <strong>Objection / restriction.</strong> Object to certain
                  processing or request that we restrict how we use your data
                  in specific circumstances.
                </li>
                <li>
                  <strong>Withdraw consent.</strong> Where we rely on your
                  consent to process data (e.g., marketing emails), you can
                  withdraw consent at any time without affecting the lawfulness
                  of prior processing.
                </li>
                <li>
                  <strong>Opt out of marketing emails.</strong> Click
                  &ldquo;Unsubscribe&rdquo; in any email, or update your
                  notification preferences in Settings.
                </li>
              </ul>
              <p>
                To exercise any of these rights, email us at{" "}
                <a
                  href="mailto:privacy@kinpath.family"
                  className="text-brand-600 hover:underline"
                >
                  privacy@kinpath.family
                </a>
                . We will respond within 30 days. We may ask you to verify
                your identity before processing your request.
              </p>
              <p>
                <strong>California residents</strong> may have additional rights
                under the California Consumer Privacy Act (CCPA), including the
                right to know, delete, and opt out of the sale of personal
                information. We do not sell personal information.
              </p>
              <p>
                <strong>Residents of the European Economic Area, UK, or
                Switzerland</strong> may have additional rights under the GDPR
                or equivalent legislation, including the right to lodge a
                complaint with your local supervisory authority.
              </p>
            </Prose>
          </section>

          {/* Section 7 */}
          <section id="children" className="scroll-mt-24">
            <SectionHeading number="7" title="Children's Privacy" />
            <Prose>
              <p>
                KinPath is intended for use by adults (18 and older). We do not
                knowingly collect personal information from children under 13.
                If you believe a child under 13 has provided us with personal
                information, please contact us at{" "}
                <a
                  href="mailto:privacy@kinpath.family"
                  className="text-brand-600 hover:underline"
                >
                  privacy@kinpath.family
                </a>{" "}
                and we will promptly delete that information.
              </p>
              <p>
                Data about your children (name, date of birth) is collected
                only for the purpose of personalizing content to their
                developmental stage. We do not use this data for advertising,
                share it with third parties for their own purposes, or build
                independent profiles on minors.
              </p>
            </Prose>
          </section>

          {/* Section 8 */}
          <section id="security" className="scroll-mt-24">
            <SectionHeading number="8" title="Security" />
            <Prose>
              <p>
                We take the security of your information seriously. Our
                technical and organizational measures include:
              </p>
              <ul>
                <li>
                  <strong>Encryption in transit.</strong> All data exchanged
                  between your browser and our servers is encrypted using
                  TLS&nbsp;1.2 or higher (HTTPS).
                </li>
                <li>
                  <strong>Encryption at rest.</strong> Your data is stored in
                  Supabase (hosted on AWS) with encryption at rest enabled.
                </li>
                <li>
                  <strong>Password hashing.</strong> Passwords are hashed using
                  bcrypt via Supabase Auth and are never stored in plain text.
                  We never have access to your raw password.
                </li>
                <li>
                  <strong>Row-Level Security (RLS).</strong> Our database
                  enforces strict access policies at the row level so that users
                  can only access their own data.
                </li>
                <li>
                  <strong>Service role isolation.</strong> Administrative
                  database operations use a separate service role key that is
                  never exposed to the client.
                </li>
                <li>
                  <strong>Access controls.</strong> Internal access to production
                  systems is limited to team members who require it, protected
                  by strong authentication.
                </li>
              </ul>
              <p>
                No method of transmission over the internet or electronic
                storage is 100% secure. While we strive to protect your
                information using commercially reasonable means, we cannot
                guarantee absolute security. In the event of a data breach that
                affects your rights and freedoms, we will notify you and
                applicable regulators as required by law.
              </p>
            </Prose>
          </section>

          {/* Section 9 */}
          <section id="cookies" className="scroll-mt-24">
            <SectionHeading number="9" title="Cookies & Tracking" />
            <Prose>
              <p>
                We use a minimal set of cookies and similar technologies
                necessary to operate the Service:
              </p>
              <ul>
                <li>
                  <strong>Authentication cookies.</strong> Supabase sets
                  first-party cookies to maintain your login session across
                  page loads. These are essential to the Service and cannot be
                  disabled while using KinPath.
                </li>
                <li>
                  <strong>Preference cookies.</strong> We may store lightweight
                  preferences (e.g., theme choice) in your browser&rsquo;s
                  local storage. No personal data is included.
                </li>
              </ul>
              <p>
                We do not use advertising cookies, cross-site tracking pixels,
                or behavioral advertising networks. We do not share cookie
                data with advertisers.
              </p>
              <p>
                Some third-party services we embed (such as Stripe&rsquo;s
                payment widget) may set their own cookies subject to their own
                privacy policies.
              </p>
            </Prose>
          </section>

          {/* Section 10 */}
          <section id="third-party" className="scroll-mt-24">
            <SectionHeading number="10" title="Third-Party Services" />
            <Prose>
              <p>
                KinPath integrates with the following third-party services. Each
                has its own privacy policy which governs their data practices:
              </p>
            </Prose>
            <DataTable
              rows={[
                {
                  category: "Supabase",
                  examples: "Database, authentication, file storage",
                  purpose: "supabase.com/privacy",
                },
                {
                  category: "Stripe",
                  examples: "Subscription billing, payment processing",
                  purpose: "stripe.com/privacy",
                },
                {
                  category: "Google",
                  examples: "OAuth sign-in (optional)",
                  purpose: "policies.google.com/privacy",
                },
                {
                  category: "Apple",
                  examples: "OAuth sign-in (optional)",
                  purpose: "apple.com/legal/privacy",
                },
                {
                  category: "AI inference provider",
                  examples: "Processes chat messages to generate responses",
                  purpose: "Messages are not used to train models under our data processing agreement",
                },
              ]}
            />
            <Prose>
              <p>
                Links to external resources on KinPath (e.g., articles from the
                AAP, CDC, WHO) lead to third-party websites. Once you leave
                KinPath, this Privacy Policy no longer applies. We encourage
                you to review the privacy policies of any external sites you
                visit.
              </p>
            </Prose>
          </section>

          {/* Section 11 */}
          <section id="international" className="scroll-mt-24">
            <SectionHeading number="11" title="International Users" />
            <Prose>
              <p>
                KinPath is operated from the United States. If you access the
                Service from outside the US, your information may be transferred
                to and processed in the United States, where data protection
                laws may differ from those in your country.
              </p>
              <p>
                For users in the European Economic Area, United Kingdom, or
                Switzerland, we rely on Standard Contractual Clauses (SCCs)
                adopted by the European Commission as the legal mechanism for
                transferring personal data to the United States.
              </p>
            </Prose>
          </section>

          {/* Section 12 */}
          <section id="changes" className="scroll-mt-24">
            <SectionHeading number="12" title="Changes to This Policy" />
            <Prose>
              <p>
                We may update this Privacy Policy from time to time. When we
                make material changes, we will:
              </p>
              <ul>
                <li>
                  Update the &ldquo;Last updated&rdquo; date at the top of this
                  page.
                </li>
                <li>
                  Send a notification email to the address on your account at
                  least 14 days before the changes take effect.
                </li>
                <li>
                  Display an in-app banner for logged-in users when you next
                  visit KinPath.
                </li>
              </ul>
              <p>
                Your continued use of the Service after the effective date of
                any changes constitutes your acceptance of the updated policy.
                If you do not agree with the changes, you may delete your
                account before the effective date.
              </p>
            </Prose>
          </section>

          {/* Section 13 */}
          <section id="contact" className="scroll-mt-24">
            <SectionHeading number="13" title="Contact Us" />
            <Prose>
              <p>
                If you have questions, concerns, or requests regarding this
                Privacy Policy or our data practices, please reach out:
              </p>
            </Prose>
            <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-700 space-y-1">
              <p className="font-semibold text-stone-900">KinPath Privacy Team</p>
              <p>
                Email:{" "}
                <a
                  href="mailto:privacy@kinpath.family"
                  className="text-brand-600 hover:underline"
                >
                  privacy@kinpath.family
                </a>
              </p>
              <p>
                General support:{" "}
                <a
                  href="mailto:support@kinpath.family"
                  className="text-brand-600 hover:underline"
                >
                  support@kinpath.family
                </a>
              </p>
              <p className="pt-2 text-stone-500 text-xs">
                We aim to respond to all privacy-related inquiries within 5
                business days and will resolve requests within 30 days.
              </p>
            </div>
          </section>

          {/* Bottom navigation */}
          <div className="border-t border-stone-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500">
            <Link href="/" className="hover:text-brand-600 transition-colors">
              ← Back to KinPath
            </Link>
            <div className="flex gap-6">
              <Link href="/privacy" className="font-medium text-brand-600">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-brand-600 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white px-6 py-8 text-center text-sm text-stone-500">
        <p>&copy; {new Date().getFullYear()} Kinpath Family, LLC. All rights reserved.</p>
        <p className="mt-1">
          Not medical advice. Always consult your pediatrician for health decisions.
        </p>
      </footer>
    </div>
  );
}

/* ─── Small reusable layout components ─── */

function SectionHeading({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
        {number}
      </span>
      <h2 className="text-xl font-bold text-stone-900">{title}</h2>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 mt-6 text-base font-semibold text-stone-800">
      {children}
    </h3>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-stone-600 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:font-semibold [&_strong]:text-stone-800">
      {children}
    </div>
  );
}

function DataTable({
  rows,
}: {
  rows: { category: string; examples: string; purpose: string }[];
}) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-stone-200 bg-white text-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 w-1/4">
              Data type
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 w-1/2">
              Examples / details
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
              Why we collect it
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((row, i) => (
            <tr key={i} className="align-top">
              <td className="px-4 py-3 font-medium text-stone-800">
                {row.category}
              </td>
              <td className="px-4 py-3 text-stone-600">{row.examples}</td>
              <td className="px-4 py-3 text-stone-600">{row.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
