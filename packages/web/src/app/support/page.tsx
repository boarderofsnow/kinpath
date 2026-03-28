import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Mail, Clock, ArrowRight } from "lucide-react";
import { FadeInUp, ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { AccordionGroup } from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Support & FAQ | Kinpath",
  description:
    "Get answers to common questions about Kinpath — subscriptions, adding children, sharing with partners and caregivers, and more. Contact our support team.",
};

const FAQ_CATEGORIES = [
  {
    title: "Getting Started",
    items: [
      {
        question: "What is Kinpath?",
        answer:
          "Kinpath is a personalized, evidence-based parenting resource platform for pregnancy through age 5. Our content is sourced from leading health organizations including the AAP, CDC, WHO, and ACOG, and adapts to your family's beliefs, lifestyle, and your child's age.",
      },
      {
        question: "How do I create an account?",
        answer:
          "Tap \"Get Started Free\" to create an account with your email, or sign up with Google or Apple. No credit card is required for the free plan. After signing up, you'll complete a short onboarding to personalize your experience.",
      },
      {
        question: "What happens during onboarding?",
        answer:
          "Onboarding takes about two minutes. You'll add your first child (or due date if expecting), then optionally share preferences like feeding plans, vaccination approach, dietary needs, and parenting style. These choices personalize the resources you see — you can update them anytime in Settings.",
      },
    ],
  },
  {
    title: "Children & Profiles",
    items: [
      {
        question: "How do I add a child profile?",
        answer:
          "Go to your Dashboard and tap \"Add Child.\" Enter your child's name and date of birth (or due date if expecting). Content will automatically adapt to their age and developmental stage.",
      },
      {
        question: "How many child profiles can I have?",
        answer:
          "The free plan supports 1 child profile. Premium and Family plans support unlimited child profiles, so you can track resources and milestones for each of your children individually.",
      },
      {
        question: "Does the content change as my child grows?",
        answer:
          "Yes. Kinpath is age-adaptive — resources, checklists, and milestones automatically update as your child grows. You'll always see content relevant to their current developmental stage, from prenatal through age 5.",
      },
    ],
  },
  {
    title: "Household & Sharing",
    items: [
      {
        question: "How do I add a partner or caregiver?",
        answer:
          "Go to Settings and find the Household section. Enter their email address and choose a role — Partner (co-parent) or Caregiver (grandparent, babysitter, nanny). They'll receive an email invitation to join your household. If they already have a Kinpath account, they're linked instantly.",
      },
      {
        question: "What's the difference between a Partner and a Caregiver?",
        answer:
          "Both roles have the same level of access — they can see all your children's profiles, checklists, and resources. The distinction helps you organize your household. Partners are co-parents, while Caregivers include grandparents, babysitters, nannies, and other trusted adults in your child's life.",
      },
      {
        question: "How many people can I add to my household?",
        answer:
          "Premium plans include 1 additional household member (a co-parent). Family plans let you add up to 5 members with any mix of Partner and Caregiver roles. Members inherit your subscription tier automatically — no separate subscription needed.",
      },
      {
        question: "What happens if I remove someone from my household?",
        answer:
          "They'll lose access to your shared children, checklists, and resources immediately. Their account reverts to the free plan. You can re-invite them anytime.",
      },
    ],
  },
  {
    title: "Subscriptions & Billing",
    items: [
      {
        question: "What's included in the free plan?",
        answer:
          "The free plan includes full access to the resource library, 1 child profile, and 5 AI-powered questions per month. No credit card required.",
      },
      {
        question: "What do I get with Premium or Family?",
        answer:
          "Premium ($12.99/month or $99.99/year) adds unlimited child profiles, unlimited AI questions, child-specific content filtering, bookmarks, printable checklists, weekly email digests, and the ability to share with 1 co-parent. Family ($19.99/month or $149.99/year) includes everything in Premium plus up to 5 household members with Partner or Caregiver roles.",
      },
      {
        question: "Can I change or cancel my plan anytime?",
        answer:
          "Yes. You can upgrade, downgrade, or cancel at any time from your account Settings. If you downgrade, you'll keep your current plan benefits until the end of your billing period. If you have household members that exceed the new plan's limit, they'll be automatically removed.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit and debit cards through Stripe, including Visa, Mastercard, and American Express. Annual plans save you up to $90 per year compared to monthly billing.",
      },
    ],
  },
  {
    title: "Features",
    items: [
      {
        question: "How does the AI chat work?",
        answer:
          "The AI chat lets you ask parenting questions and get personalized answers drawn from our evidence-based resource library. Free users get 5 questions per month. Premium and Family subscribers get unlimited questions, plus the ability to save conversations for future reference.",
      },
      {
        question: "What's in the resource library?",
        answer:
          "The library covers prenatal care, newborn care, nutrition, sleep, vaccines, developmental milestones, safety, emotional wellness, and more. All resources are reviewed and sourced from major health organizations. Premium and Family subscribers can filter resources by specific child and bookmark their favorites.",
      },
      {
        question: "What are email digests and checklists?",
        answer:
          "Premium and Family subscribers receive weekly email digests with personalized content for their children. Checklists are age-appropriate developmental milestones and doctor discussion topics you can track and print — great for bringing to pediatrician visits.",
      },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      {
        question: "What data does Kinpath collect?",
        answer:
          "We collect the information you provide during signup and onboarding — your email, children's names and birth dates, and your optional preferences (feeding, vaccination approach, etc.). We do not store medical records. Your data is protected with row-level security so only you and your household members can access it.",
      },
      {
        question: "Is my family's data shared with third parties?",
        answer:
          "No. We do not sell or share your personal data with third parties for marketing purposes. We use essential services like Stripe for payments and Supabase for secure data storage. For full details, see our Privacy Policy.",
      },
    ],
  },
];

// Build JSON-LD FAQ structured data for SEO rich results
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_CATEGORIES.flatMap((category) =>
    category.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    }))
  ),
};

export default function SupportPage() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col font-sans text-stone-900 bg-[#FAFAF7]">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12 backdrop-blur-md bg-white/90 sticky top-0 z-50">
        <Link href="/">
          <Image src="/kinpath-logo.png" alt="Kinpath" width={144} height={36} className="h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-[#1E3226] hover:text-[#5B8A72]"
          >
            Log in
          </Link>
          <Link
            href="/auth/register"
            className="rounded-2xl bg-[#5B8A72] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#4a725e] transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-[#E5E5E0] bg-white px-6 py-16 text-center lg:py-20">
        <div className="mx-auto max-w-2xl">
          <FadeInUp>
            <p className="text-sm font-medium uppercase tracking-wider text-[#5B8A72]">Support</p>
            <h1 className="mt-2 font-serif text-4xl font-bold text-[#1C1C19] sm:text-5xl">
              How can we help?
            </h1>
            <p className="mt-6 text-[#6B6B68] leading-relaxed">
              Find answers to common questions about Kinpath below, or reach out
              to our support team directly.
            </p>
          </FadeInUp>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <StaggerContainer className="space-y-12">
            {FAQ_CATEGORIES.map((category) => (
              <StaggerItem key={category.title}>
                <h2 className="mb-4 font-serif text-2xl font-bold text-[#1C1C19]">
                  {category.title}
                </h2>
                <AccordionGroup items={category.items} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Contact Section */}
      <section className="border-t border-[#E5E5E0] bg-white px-6 py-16 lg:py-24">
        <div className="mx-auto max-w-xl text-center">
          <ScrollReveal>
            <h2 className="font-serif text-3xl font-bold text-[#1C1C19]">
              Still have questions?
            </h2>
            <p className="mt-4 text-[#6B6B68] leading-relaxed">
              Our support team is here to help. Send us an email and we&apos;ll
              get back to you as soon as we can.
            </p>

            <div className="mt-10 rounded-2xl border border-[#E5E5E0] bg-[#FAFAF7] p-8">
              <div className="flex flex-col items-center gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D8E5DC]">
                  <Mail className="h-6 w-6 text-[#5B8A72]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1C1C19]">Email Support</h3>
                  <a
                    href="mailto:support@kinpath.family"
                    className="mt-1 inline-block text-[#5B8A72] hover:underline"
                  >
                    support@kinpath.family
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#6B6B68]">
                  <Clock className="h-4 w-4" />
                  <span>We typically respond within 24 hours</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-[#2B3D35] px-6 py-24 text-center lg:px-12">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
              Ready to start your parenting journey?
            </h2>
            <p className="mt-6 text-lg text-[#E8F0EB]">
              Join families getting personalized, evidence-based guidance.
            </p>
            <div className="mt-10 flex justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#5B8A72] px-8 py-4 text-base font-medium text-white shadow-sm hover:shadow-md hover:bg-[#4a725e] transition-colors duration-150"
              >
                Get Started Free <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E0] bg-[#FAFAF7] px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Link href="/">
                <Image
                  src="/kinpath-logo.png"
                  alt="Kinpath"
                  width={112}
                  height={28}
                  className="h-7 w-auto"
                />
              </Link>
              <p className="mt-6 max-w-sm text-sm text-[#6B6B68] leading-relaxed">
                Evidence-based parenting guidance that grows with your family.
                Personalized, professional, and always there when you need it.
              </p>
            </div>

            <div>
              <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-[#1C1C19]">
                Product
              </h3>
              <ul className="mt-6 space-y-4 text-sm">
                <li>
                  <Link href="/#features" className="text-[#6B6B68] hover:text-[#5B8A72] transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="text-[#6B6B68] hover:text-[#5B8A72] transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-[#6B6B68] hover:text-[#5B8A72] transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-[#1C1C19]">
                Support
              </h3>
              <ul className="mt-6 space-y-4 text-sm">
                <li>
                  <Link href="/support" className="text-[#6B6B68] hover:text-[#5B8A72] transition-colors">
                    Help & FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-[#6B6B68] hover:text-[#5B8A72] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-[#6B6B68] hover:text-[#5B8A72] transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 border-t border-[#E5E5E0] pt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-sm text-[#6B6B68]">
              &copy; {new Date().getFullYear()} Kinpath Family, LLC. All rights reserved.
            </p>
            <p className="text-xs text-[#6B6B68]">
              Not medical advice. Always consult your pediatrician for health decisions.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
