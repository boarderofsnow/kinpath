
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | KinPath",
  description:
    "Read the Terms of Service governing your use of KinPath, the evidence-based parenting guidance platform.",
};

const LAST_UPDATED = "February 20, 2026";
const EFFECTIVE_DATE = "February 20, 2026";

export default function TermsOfServicePage() {
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
          <h1 className="mt-2 text-4xl font-bold text-stone-900">Terms of Service</h1>
          <p className="mt-4 text-stone-500 text-sm">
            Effective {EFFECTIVE_DATE} &nbsp;·&nbsp; Last updated {LAST_UPDATED}
          </p>
          <p className="mt-6 text-stone-600 leading-relaxed">
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of
            KinPath. Please read them carefully before using our Service. By
            creating an account or using KinPath, you agree to be bound by
            these Terms.
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
                { href: "#acceptance", label: "1. Acceptance of Terms" },
                { href: "#description", label: "2. Description of Service" },
                { href: "#eligibility", label: "3. Eligibility" },
                { href: "#accounts", label: "4. Accounts & Registration" },
                { href: "#subscriptions", label: "5. Subscriptions & Billing" },
                { href: "#acceptable-use", label: "6. Acceptable Use" },
                { href: "#content", label: "7. Content & Intellectual Property" },
                { href: "#medical-disclaimer", label: "8. Medical Disclaimer" },
                { href: "#ai-disclaimer", label: "9. AI Features Disclaimer" },
                { href: "#third-party", label: "10. Third-Party Links & Services" },
                { href: "#termination", label: "11. Termination" },
                { href: "#disclaimers", label: "12. Disclaimers" },
                { href: "#liability", label: "13. Limitation of Liability" },
                { href: "#indemnification", label: "14. Indemnification" },
                { href: "#disputes", label: "15. Dispute Resolution" },
                { href: "#governing-law", label: "16. Governing Law" },
                { href: "#changes", label: "17. Changes to These Terms" },
                { href: "#general", label: "18. General Provisions" },
                { href: "#contact", label: "19. Contact Us" },
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
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
            <p className="text-sm font-semibold text-amber-800">
              Important notice
            </p>
            <ul className="mt-2 space-y-1 text-sm text-amber-700 list-disc list-inside">
              <li>KinPath is <strong>not a medical provider</strong> and does not offer medical advice.</li>
              <li>Always consult a qualified healthcare professional for medical decisions.</li>
              <li>These Terms include a binding arbitration clause and class action waiver (Section 15).</li>
              <li>KinPath is for users 18 and older only.</li>
            </ul>
          </div>

          {/* Section 1 */}
          <section id="acceptance" className="scroll-mt-24">
            <SectionHeading number="1" title="Acceptance of Terms" />
            <Prose>
              <p>
                By accessing or using the KinPath website, web application, or
                any associated services (collectively, the &ldquo;Service&rdquo;), you
                agree to be bound by these Terms of Service and our{" "}
                <Link href="/privacy" className="text-brand-600 hover:underline">
                  Privacy Policy
                </Link>
                , which is incorporated into these Terms by reference. If you
                do not agree to these Terms, you must not use the Service.
              </p>
              <p>
                These Terms constitute a legally binding agreement between you
                (&ldquo;User,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;) and Kinpath Family, LLC
                (&ldquo;KinPath,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). If
                you are using the Service on behalf of an organization, you
                represent that you have authority to bind that organization to
                these Terms.
              </p>
            </Prose>
          </section>

          {/* Section 2 */}
          <section id="description" className="scroll-mt-24">
            <SectionHeading number="2" title="Description of Service" />
            <Prose>
              <p>
                KinPath is an evidence-based parenting guidance platform that
                provides:
              </p>
              <ul>
                <li>
                  Curated parenting resources sourced from trusted institutions
                  (such as the American Academy of Pediatrics, the CDC, WHO,
                  and ACOG), personalized to your child&rsquo;s age and your
                  family&rsquo;s preferences;
                </li>
                <li>
                  A birth-through-age-5 family planning checklist and task
                  manager;
                </li>
                <li>
                  An AI-assisted chat feature that answers parenting questions
                  grounded in our curated resource library;
                </li>
                <li>
                  Household sharing tools that allow Family plan members to
                  invite a partner and collaborate on checklists; and
                </li>
                <li>
                  A physician review program through which licensed healthcare
                  professionals may review and annotate content in our library.
                </li>
              </ul>
              <p>
                We reserve the right to modify, suspend, or discontinue any
                aspect of the Service at any time. Where material changes
                affect paid features, we will provide reasonable advance notice.
              </p>
            </Prose>
          </section>

          {/* Section 3 */}
          <section id="eligibility" className="scroll-mt-24">
            <SectionHeading number="3" title="Eligibility" />
            <Prose>
              <p>
                You must be at least <strong>18 years of age</strong> to create
                a KinPath account or use the Service. By using KinPath, you
                represent and warrant that you meet this age requirement and
                have the legal capacity to enter into a binding agreement in
                your jurisdiction.
              </p>
              <p>
                KinPath is designed for parents, parents-to-be, and caregivers.
                The Service is intended for personal, non-commercial use only
                unless you have entered into a separate written agreement with
                KinPath for commercial use.
              </p>
              <p>
                The Service is currently available only to users in the United
                States. We make no representations that the Service is
                appropriate or available in other locations. If you access the
                Service from outside the United States, you do so at your own
                risk and are responsible for compliance with local laws.
              </p>
            </Prose>
          </section>

          {/* Section 4 */}
          <section id="accounts" className="scroll-mt-24">
            <SectionHeading number="4" title="Accounts & Registration" />
            <Prose>
              <p>
                <strong>Account creation.</strong> To access most features of
                the Service, you must register for an account by providing an
                accurate email address and a secure password, or by
                authenticating through Google or Apple. You agree to provide
                truthful, current, and complete information.
              </p>
              <p>
                <strong>Account security.</strong> You are responsible for
                maintaining the confidentiality of your login credentials and
                for all activity that occurs under your account. You agree to
                immediately notify us at{" "}
                <a href="mailto:support@kinpath.family" className="text-brand-600 hover:underline">
                  support@kinpath.family
                </a>{" "}
                if you suspect unauthorized access to your account. KinPath
                will not be liable for any loss or damage arising from your
                failure to protect your credentials.
              </p>
              <p>
                <strong>One account per person.</strong> You may not create
                multiple accounts or transfer your account to another person
                without our prior written consent. Household sharing (Family
                plan) is the supported mechanism for giving a partner access
                to your KinPath data.
              </p>
              <p>
                <strong>Accuracy of information.</strong> We rely on the
                information you provide (such as your child&rsquo;s date of birth)
                to personalize your experience. You agree not to enter false
                information that could degrade the accuracy of personalized
                content.
              </p>
            </Prose>
          </section>

          {/* Section 5 */}
          <section id="subscriptions" className="scroll-mt-24">
            <SectionHeading number="5" title="Subscriptions & Billing" />

            <SubHeading>5.1 Subscription Plans</SubHeading>
            <Prose>
              <p>KinPath offers the following subscription tiers:</p>
            </Prose>
            <div className="mt-3 overflow-x-auto rounded-xl border border-stone-200 bg-white text-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Key features</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr className="align-top">
                    <td className="px-4 py-3 font-medium text-stone-800">Free</td>
                    <td className="px-4 py-3 text-stone-600">Up to 5 AI chat questions per month, 1 child profile, access to a curated subset of resources</td>
                  </tr>
                  <tr className="align-top">
                    <td className="px-4 py-3 font-medium text-stone-800">Premium</td>
                    <td className="px-4 py-3 text-stone-600">Unlimited AI chat, up to 5 child profiles, full resource library access, weekly content digest</td>
                  </tr>
                  <tr className="align-top">
                    <td className="px-4 py-3 font-medium text-stone-800">Family</td>
                    <td className="px-4 py-3 text-stone-600">Everything in Premium, plus partner/household sharing, shared checklist with assignee tagging, priority support</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <SubHeading>5.2 Billing & Renewal</SubHeading>
            <Prose>
              <p>
                Paid subscriptions are billed on a recurring monthly or annual
                basis through Stripe. By subscribing, you authorize us to
                charge your payment method on file at the start of each billing
                period. Subscriptions automatically renew unless cancelled
                before the renewal date.
              </p>
              <p>
                You are responsible for all charges incurred under your account,
                including applicable taxes. If a payment fails, we may
                downgrade your account to the Free plan after a grace period.
              </p>
            </Prose>

            <SubHeading>5.3 Cancellation</SubHeading>
            <Prose>
              <p>
                You may cancel your subscription at any time from your Settings
                page or by contacting{" "}
                <a href="mailto:support@kinpath.family" className="text-brand-600 hover:underline">
                  support@kinpath.family
                </a>
                . Upon cancellation, you retain access to paid features until
                the end of your current billing period, after which your account
                reverts to the Free plan.
              </p>
            </Prose>

            <SubHeading>5.4 Refunds</SubHeading>
            <Prose>
              <p>
                Monthly subscriptions are non-refundable once a billing cycle
                has begun. For annual subscriptions, we will issue a pro-rata
                refund for any complete months remaining at the time of
                cancellation, at our discretion, if requested within 30 days of
                the renewal charge. We reserve the right to issue refunds on a
                case-by-case basis.
              </p>
            </Prose>

            <SubHeading>5.5 Price Changes</SubHeading>
            <Prose>
              <p>
                We reserve the right to change subscription prices. We will
                notify you at least 30 days in advance of any price increase
                via the email address on your account. Your continued use of
                the Service after a price change takes effect constitutes
                acceptance of the new pricing.
              </p>
            </Prose>
          </section>

          {/* Section 6 */}
          <section id="acceptable-use" className="scroll-mt-24">
            <SectionHeading number="6" title="Acceptable Use" />
            <Prose>
              <p>
                You agree to use the Service only for lawful purposes and in
                accordance with these Terms. You agree <strong>not</strong> to:
              </p>
              <ul>
                <li>
                  Use the Service for any purpose that is illegal, fraudulent,
                  harmful, or deceptive;
                </li>
                <li>
                  Attempt to gain unauthorized access to any part of the
                  Service, other user accounts, or our backend systems;
                </li>
                <li>
                  Use automated tools (bots, scrapers, crawlers) to access,
                  index, or copy content from the Service without our express
                  written permission;
                </li>
                <li>
                  Reverse-engineer, decompile, or attempt to extract the source
                  code of the Service;
                </li>
                <li>
                  Introduce malicious code, viruses, or any software that
                  disrupts or interferes with the Service;
                </li>
                <li>
                  Submit false, misleading, or inaccurate information,
                  including false child profiles or impersonating another person;
                </li>
                <li>
                  Use the AI chat feature to generate, spread, or solicit
                  harmful, abusive, defamatory, or otherwise objectionable
                  content;
                </li>
                <li>
                  Circumvent, disable, or interfere with security features of
                  the Service, including row-level security controls; or
                </li>
                <li>
                  Use the Service in a way that could damage, overburden, or
                  impair our infrastructure.
                </li>
              </ul>
              <p>
                We reserve the right to investigate suspected violations of
                these rules and to suspend or terminate accounts engaged in
                prohibited conduct, without prior notice, at our sole
                discretion.
              </p>
            </Prose>
          </section>

          {/* Section 7 */}
          <section id="content" className="scroll-mt-24">
            <SectionHeading number="7" title="Content & Intellectual Property" />

            <SubHeading>7.1 KinPath Content</SubHeading>
            <Prose>
              <p>
                All content created, curated, or published by KinPath,
                including but not limited to resource articles, summaries,
                editorial curation, the AI chat system, user interface design,
                software code, logos, trademarks, and the &ldquo;KinPath&rdquo; name,
                is owned by or licensed to KinPath and is protected by
                copyright, trademark, and other applicable intellectual property
                laws.
              </p>
              <p>
                We grant you a limited, non-exclusive, non-transferable,
                revocable license to access and use the Service for your
                personal, non-commercial purposes. This license does not permit
                you to reproduce, distribute, modify, or create derivative works
                from KinPath content without our express written consent.
              </p>
            </Prose>

            <SubHeading>7.2 Third-Party Content</SubHeading>
            <Prose>
              <p>
                Resources in the KinPath library may link to or summarize
                content from third-party organizations such as the AAP, CDC,
                WHO, and ACOG. Such content belongs to its respective owners.
                We make reasonable efforts to ensure resource accuracy but are
                not responsible for the content of external sources.
              </p>
            </Prose>

            <SubHeading>7.3 User-Generated Content</SubHeading>
            <Prose>
              <p>
                You may submit content to the Service in the form of chat
                messages, checklist notes, and child profile information
                (&ldquo;User Content&rdquo;). You retain ownership of your User Content.
              </p>
              <p>
                By submitting User Content, you grant KinPath a limited,
                worldwide, royalty-free license to store, process, and display
                your User Content solely for the purpose of providing the
                Service to you. We do not use your User Content to train AI
                models or share it with third parties except as described in
                our{" "}
                <Link href="/privacy" className="text-brand-600 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
              <p>
                You represent and warrant that your User Content does not
                infringe any third-party rights and does not violate any
                applicable law.
              </p>
            </Prose>

            <SubHeading>7.4 Feedback</SubHeading>
            <Prose>
              <p>
                If you provide us with suggestions, ideas, or feedback about
                the Service (&ldquo;Feedback&rdquo;), you grant KinPath a perpetual,
                irrevocable, royalty-free license to use that Feedback for any
                purpose without compensation or attribution to you.
              </p>
            </Prose>
          </section>

          {/* Section 8 */}
          <section id="medical-disclaimer" className="scroll-mt-24">
            <SectionHeading number="8" title="Medical Disclaimer" />
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-6 py-5 mb-4">
              <p className="text-sm font-bold text-red-800 uppercase tracking-wide">
                Not Medical Advice
              </p>
              <p className="mt-2 text-sm text-red-700 leading-relaxed">
                The information provided through the KinPath Service, including
                all resources, articles, checklists, AI-generated responses,
                and any other content, is for <strong>general informational and
                educational purposes only</strong>. It does not constitute medical
                advice, diagnosis, or treatment and is not a substitute for
                professional medical care.
              </p>
            </div>
            <Prose>
              <p>
                KinPath is not a licensed medical provider, hospital, clinic,
                or healthcare organization. We do not create doctor-patient
                relationships. Our physician review program allows licensed
                professionals to annotate and approve content for accuracy; this
                does not convert the Service into a medical practice.
              </p>
              <p>
                <strong>Always seek the advice of your pediatrician, OB-GYN,
                midwife, or other qualified healthcare provider</strong> with any
                questions you may have regarding a medical condition, a child&rsquo;s
                health, pregnancy, medication, or treatment. Never disregard
                professional medical advice or delay seeking it because of
                something you have read on KinPath.
              </p>
              <p>
                If you or your child is experiencing a medical emergency, call
                911 (or your local emergency services) immediately.
              </p>
              <p>
                By using the Service, you acknowledge and agree that KinPath is
                not responsible for any health or medical decisions you make
                based on information you encounter on the Service.
              </p>
            </Prose>
          </section>

          {/* Section 9 */}
          <section id="ai-disclaimer" className="scroll-mt-24">
            <SectionHeading number="9" title="AI Features Disclaimer" />
            <Prose>
              <p>
                KinPath includes an AI-powered chat feature that uses large
                language models to generate responses to your parenting
                questions. You acknowledge and agree that:
              </p>
              <ul>
                <li>
                  <strong>AI responses may be inaccurate.</strong> AI-generated
                  content can contain errors, omissions, outdated information,
                  or &ldquo;hallucinations&rdquo; (plausible-sounding but incorrect
                  information). You should verify any AI-generated information
                  with authoritative sources or a qualified professional before
                  relying on it.
                </li>
                <li>
                  <strong>AI is not a substitute for professional advice.</strong>{" "}
                  AI responses do not constitute medical, legal, financial, or
                  other professional advice (see Section 8).
                </li>
                <li>
                  <strong>Responses are not personalized to your specific
                  circumstances</strong> in the way that advice from your own
                  healthcare provider would be. The AI has no access to your
                  or your child&rsquo;s medical history.
                </li>
                <li>
                  <strong>Conversations may be reviewed</strong> for quality
                  assurance, safety monitoring, and product improvement
                  purposes, in accordance with our{" "}
                  <Link href="/privacy" className="text-brand-600 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </li>
              </ul>
              <p>
                We strive to ground AI responses in our curated, evidence-based
                resource library. However, the accuracy or completeness of AI
                responses is not guaranteed, and KinPath expressly disclaims
                any liability arising from your reliance on AI-generated content.
              </p>
            </Prose>
          </section>

          {/* Section 10 */}
          <section id="third-party" className="scroll-mt-24">
            <SectionHeading number="10" title="Third-Party Links & Services" />
            <Prose>
              <p>
                The Service may contain links to third-party websites,
                resources, or services that are not owned or controlled by
                KinPath. These links are provided for convenience and
                informational purposes only.
              </p>
              <p>
                KinPath has no control over, and assumes no responsibility for,
                the content, privacy policies, or practices of any third-party
                websites. We do not endorse any third-party websites or
                services. By clicking a third-party link, you acknowledge that
                you are leaving the KinPath Service and that your interactions
                with those sites are governed by their own terms.
              </p>
              <p>
                The Service is built on third-party infrastructure including
                Supabase (database and authentication), Stripe (payments), and
                AI inference providers. While we take care to select reputable
                vendors, we are not liable for any failure, outage, or data
                loss attributable to these third-party services.
              </p>
            </Prose>
          </section>

          {/* Section 11 */}
          <section id="termination" className="scroll-mt-24">
            <SectionHeading number="11" title="Termination" />

            <SubHeading>11.1 Termination by You</SubHeading>
            <Prose>
              <p>
                You may delete your account at any time from your Settings page.
                Account deletion is permanent and will result in the deletion of
                your profile, child profiles, checklist data, saved
                conversations, and preferences, as described in our Privacy
                Policy. If you are on a paid plan, your subscription will
                continue through the end of the current billing period.
              </p>
            </Prose>

            <SubHeading>11.2 Termination by KinPath</SubHeading>
            <Prose>
              <p>
                We reserve the right to suspend or permanently terminate your
                account, with or without notice, for any of the following
                reasons:
              </p>
              <ul>
                <li>Violation of these Terms or our Acceptable Use policy;</li>
                <li>Conduct that we determine, in our sole discretion, to be harmful to other users, KinPath, or third parties;</li>
                <li>Failure to pay subscription fees;</li>
                <li>A request from law enforcement or a court order; or</li>
                <li>Our discontinuation of the Service.</li>
              </ul>
              <p>
                If we terminate your account due to a Terms violation, you are
                not entitled to a refund of any prepaid subscription fees.
              </p>
            </Prose>

            <SubHeading>11.3 Effect of Termination</SubHeading>
            <Prose>
              <p>
                Upon termination, your license to use the Service immediately
                ends. Sections of these Terms that by their nature should
                survive termination, including Sections 7 (Content &amp;
                Intellectual Property), 8 (Medical Disclaimer), 9 (AI
                Disclaimer), 12 (Disclaimers), 13 (Limitation of Liability),
                14 (Indemnification), and 15 (Dispute Resolution), will
                continue to apply.
              </p>
            </Prose>
          </section>

          {/* Section 12 */}
          <section id="disclaimers" className="scroll-mt-24">
            <SectionHeading number="12" title="Disclaimers" />
            <Prose>
              <p>
                <strong>
                  THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
                  WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                </strong>{" "}
                TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, KINPATH
                DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul>
                <li>
                  IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                  PARTICULAR PURPOSE, AND NON-INFRINGEMENT;
                </li>
                <li>
                  WARRANTIES THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE,
                  OR SECURE;
                </li>
                <li>
                  WARRANTIES THAT ANY INFORMATION OBTAINED THROUGH THE SERVICE
                  WILL BE ACCURATE, COMPLETE, OR RELIABLE; AND
                </li>
                <li>
                  WARRANTIES THAT DEFECTS WILL BE CORRECTED OR THAT THE SERVICE
                  IS FREE FROM VIRUSES OR OTHER HARMFUL COMPONENTS.
                </li>
              </ul>
              <p>
                Some jurisdictions do not allow the exclusion of implied
                warranties. In such jurisdictions, the above exclusions apply
                only to the extent permitted by law.
              </p>
            </Prose>
          </section>

          {/* Section 13 */}
          <section id="liability" className="scroll-mt-24">
            <SectionHeading number="13" title="Limitation of Liability" />
            <Prose>
              <p>
                <strong>
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO
                  EVENT WILL KINPATH, ITS OFFICERS, DIRECTORS, EMPLOYEES,
                  AFFILIATES, OR SERVICE PROVIDERS BE LIABLE FOR ANY:
                </strong>
              </p>
              <ul>
                <li>
                  INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR
                  EXEMPLARY DAMAGES;
                </li>
                <li>
                  LOSS OF PROFITS, REVENUE, DATA, BUSINESS, OR GOODWILL;
                </li>
                <li>
                  PERSONAL INJURY OR HEALTH CONSEQUENCES ARISING FROM RELIANCE
                  ON CONTENT PROVIDED THROUGH THE SERVICE; OR
                </li>
                <li>
                  DAMAGES RESULTING FROM UNAUTHORIZED ACCESS TO OR ALTERATION
                  OF YOUR ACCOUNT OR DATA;
                </li>
              </ul>
              <p>
                EVEN IF KINPATH HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH
                DAMAGES.
              </p>
              <p>
                IN ANY CASE, KINPATH&rsquo;S TOTAL CUMULATIVE LIABILITY TO YOU FOR
                ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE WILL NOT
                EXCEED THE GREATER OF: (A) THE TOTAL FEES PAID BY YOU TO
                KINPATH IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) ONE
                HUNDRED US DOLLARS ($100).
              </p>
              <p>
                Some jurisdictions do not allow the limitation of liability for
                certain types of damages. In such jurisdictions, the limitations
                above apply only to the extent permitted by law.
              </p>
            </Prose>
          </section>

          {/* Section 14 */}
          <section id="indemnification" className="scroll-mt-24">
            <SectionHeading number="14" title="Indemnification" />
            <Prose>
              <p>
                You agree to defend, indemnify, and hold harmless KinPath and
                its officers, directors, employees, contractors, and agents from
                and against any claims, damages, liabilities, costs, and
                expenses (including reasonable attorneys&rsquo; fees) arising from or
                related to:
              </p>
              <ul>
                <li>Your use of or access to the Service;</li>
                <li>Your violation of these Terms;</li>
                <li>Your violation of any law or the rights of a third party; or</li>
                <li>
                  Any User Content you submit to the Service that infringes a
                  third party&rsquo;s intellectual property or other rights.
                </li>
              </ul>
              <p>
                We reserve the right to assume exclusive control of any matter
                subject to indemnification by you, in which case you agree to
                cooperate with us in asserting any available defenses.
              </p>
            </Prose>
          </section>

          {/* Section 15 */}
          <section id="disputes" className="scroll-mt-24">
            <SectionHeading number="15" title="Dispute Resolution" />

            <SubHeading>15.1 Informal Resolution</SubHeading>
            <Prose>
              <p>
                Before initiating formal proceedings, you agree to contact us
                at{" "}
                <a href="mailto:legal@kinpath.family" className="text-brand-600 hover:underline">
                  legal@kinpath.family
                </a>{" "}
                and give us 30 days to attempt to resolve your concern
                informally. Most disputes can be resolved without litigation.
              </p>
            </Prose>

            <SubHeading>15.2 Binding Arbitration</SubHeading>
            <Prose>
              <p>
                If we cannot resolve a dispute informally, <strong>you and
                KinPath agree to resolve any dispute, claim, or controversy
                arising from or relating to these Terms or the Service through
                binding individual arbitration</strong>, rather than in court,
                except for disputes that qualify for small claims court.
              </p>
              <p>
                Arbitration will be administered by the American Arbitration
                Association (AAA) under its Consumer Arbitration Rules, which
                are available at{" "}
                <a
                  href="https://www.adr.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  adr.org
                </a>
                . The arbitrator&rsquo;s decision will be final and binding and may
                be entered as a judgment in any court of competent jurisdiction.
              </p>
            </Prose>

            <SubHeading>15.3 Class Action Waiver</SubHeading>
            <Prose>
              <p>
                <strong>
                  YOU AND KINPATH AGREE THAT EACH MAY BRING CLAIMS AGAINST THE
                  OTHER ONLY IN AN INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF
                  OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, OR
                  REPRESENTATIVE PROCEEDING.
                </strong>{" "}
                The arbitrator may not consolidate more than one person&rsquo;s
                claims and may not preside over any class or representative
                proceeding.
              </p>
            </Prose>

            <SubHeading>15.4 Opt-Out</SubHeading>
            <Prose>
              <p>
                You may opt out of the arbitration agreement by sending written
                notice to{" "}
                <a href="mailto:legal@kinpath.family" className="text-brand-600 hover:underline">
                  legal@kinpath.family
                </a>{" "}
                within 30 days of first creating your KinPath account. Your
                notice must include your name, email address, and a clear
                statement that you are opting out of arbitration. If you opt
                out, disputes will be resolved in court as described in
                Section 16.
              </p>
            </Prose>
          </section>

          {/* Section 16 */}
          <section id="governing-law" className="scroll-mt-24">
            <SectionHeading number="16" title="Governing Law" />
            <Prose>
              <p>
                These Terms are governed by the laws of the State of Delaware,
                United States, without regard to its conflict-of-law principles.
                To the extent that any dispute is not subject to arbitration
                under Section 15, you and KinPath agree to submit to the
                exclusive jurisdiction of the federal and state courts located
                in Delaware for resolution of such dispute.
              </p>
              <p>
                If you are a consumer located in the European Union, you may
                also have rights under mandatory consumer protection laws in
                your country that these Terms cannot override.
              </p>
            </Prose>
          </section>

          {/* Section 17 */}
          <section id="changes" className="scroll-mt-24">
            <SectionHeading number="17" title="Changes to These Terms" />
            <Prose>
              <p>
                We may update these Terms from time to time. When we make
                material changes, we will:
              </p>
              <ul>
                <li>Update the &ldquo;Last updated&rdquo; date at the top of this page;</li>
                <li>
                  Send a notification email to the address on your account at
                  least <strong>14 days</strong> before the new Terms take
                  effect; and
                </li>
                <li>Display a prominent notice in the app when you next log in.</li>
              </ul>
              <p>
                If you do not agree to the updated Terms, you must stop using
                the Service and may delete your account before the effective
                date. Your continued use of the Service after the effective
                date constitutes acceptance of the updated Terms.
              </p>
              <p>
                For material changes that reduce your rights or increase your
                obligations, the new Terms will apply only prospectively.
                Disputes arising from actions taken before the effective date
                will be governed by the Terms in effect at that time.
              </p>
            </Prose>
          </section>

          {/* Section 18 */}
          <section id="general" className="scroll-mt-24">
            <SectionHeading number="18" title="General Provisions" />
            <Prose>
              <p>
                <strong>Entire agreement.</strong> These Terms, together with
                our Privacy Policy and any other policies referenced herein,
                constitute the entire agreement between you and KinPath
                regarding the Service and supersede all prior agreements,
                understandings, and representations.
              </p>
              <p>
                <strong>Severability.</strong> If any provision of these Terms
                is found by a court or arbitrator to be unenforceable, that
                provision will be modified to the minimum extent necessary to
                make it enforceable, and the remaining provisions will remain
                in full force and effect.
              </p>
              <p>
                <strong>Waiver.</strong> Our failure to enforce any right or
                provision of these Terms does not constitute a waiver of that
                right or provision. Any waiver must be in writing and signed by
                an authorized representative of KinPath.
              </p>
              <p>
                <strong>Assignment.</strong> You may not assign or transfer
                your rights or obligations under these Terms without our prior
                written consent. KinPath may assign these Terms in connection
                with a merger, acquisition, or sale of all or substantially all
                of our assets, with notice to you.
              </p>
              <p>
                <strong>Force majeure.</strong> KinPath will not be liable for
                any delay or failure to perform resulting from causes outside
                our reasonable control, including natural disasters, war,
                terrorism, government action, internet outages, or
                third-party service failures.
              </p>
              <p>
                <strong>Headings.</strong> Section headings in these Terms are
                for convenience only and have no legal or contractual effect.
              </p>
              <p>
                <strong>No third-party beneficiaries.</strong> These Terms do
                not create any third-party beneficiary rights.
              </p>
            </Prose>
          </section>

          {/* Section 19 */}
          <section id="contact" className="scroll-mt-24">
            <SectionHeading number="19" title="Contact Us" />
            <Prose>
              <p>
                If you have questions about these Terms or need to reach our
                legal team, please contact us:
              </p>
            </Prose>
            <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-700 space-y-1">
              <p className="font-semibold text-stone-900">KinPath Legal</p>
              <p>
                Legal inquiries:{" "}
                <a
                  href="mailto:legal@kinpath.family"
                  className="text-brand-600 hover:underline"
                >
                  legal@kinpath.family
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
              <p>
                Privacy matters:{" "}
                <a
                  href="mailto:privacy@kinpath.family"
                  className="text-brand-600 hover:underline"
                >
                  privacy@kinpath.family
                </a>
              </p>
              <p className="pt-2 text-stone-500 text-xs">
                Arbitration opt-out notices must be sent to legal@kinpath.family
                within 30 days of account creation (see Section 15.4).
              </p>
            </div>
          </section>

          {/* Bottom navigation */}
          <div className="border-t border-stone-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500">
            <Link href="/" className="hover:text-brand-600 transition-colors">
              ← Back to KinPath
            </Link>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-brand-600 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="font-medium text-brand-600">
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
