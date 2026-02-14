import Link from "next/link";
import {
  CalendarClock,
  ShieldCheck,
  Heart,
  Sparkles,
  LayoutGrid,
  Lock,
  BookOpen,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
        <span className="text-xl font-bold text-brand-600">KinPath</span>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-stone-700 hover:text-brand-600"
          >
            Log in
          </Link>
          <Link
            href="/auth/register"
            className="rounded-xl bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 px-6 py-20 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Parenting guidance that{" "}
          <span className="text-accent-400">grows with your child</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/90">
          Evidence-based resources, professionally vetted and personalized to your
          family&apos;s values. From pregnancy through age 5, always the right
          information at the right time.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/auth/register"
            className="rounded-xl bg-accent-500 px-8 py-3 text-base font-medium text-white shadow-lg hover:bg-accent-600 transition-colors"
          >
            Start Your Journey — Free
          </Link>
          <Link
            href="#features"
            className="rounded-xl border-2 border-white/30 px-6 py-2.5 text-base font-medium text-white hover:bg-white/10 transition-colors"
          >
            Learn more
          </Link>
        </div>
      </section>

      {/* Features overview */}
      <section id="features" className="bg-white px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-stone-900">
            Built for real families
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Age-Adaptive",
                description:
                  "Resources automatically update as your child grows. Always relevant, never overwhelming.",
                icon: CalendarClock,
              },
              {
                title: "Professionally Vetted",
                description:
                  "Every resource reviewed by credentialed healthcare professionals. Evidence-based, always.",
                icon: ShieldCheck,
              },
              {
                title: "Personalized to You",
                description:
                  "Your beliefs, lifestyle, and parenting style shape what you see. No judgment, just support.",
                icon: Heart,
              },
              {
                title: "AI-Powered Answers",
                description:
                  "Ask questions and get trustworthy answers grounded in our vetted resource library.",
                icon: Sparkles,
              },
              {
                title: "All-in-One",
                description:
                  "Nutrition, sleep, milestones, vaccines, emotional wellness — everything in one place.",
                icon: LayoutGrid,
              },
              {
                title: "Your Privacy, Protected",
                description:
                  "We never store health records or medical data. Your family's information stays yours.",
                icon: Lock,
              },
            ].map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-stone-200/60 bg-white shadow-card p-6"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                    <IconComponent className="h-6 w-6 text-brand-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-stone-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-stone-50 px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-stone-900">
            How it works
          </h2>
          <p className="mt-2 text-center text-stone-600">
            Get personalized parenting guidance in three simple steps
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: 1,
                title: "Tell us about your family",
                description:
                  "Share your child's age, your interests, and parenting values during a quick onboarding.",
              },
              {
                step: 2,
                title: "Get personalized resources",
                description:
                  "We surface evidence-based articles, guides, and checklists tailored to exactly where you are right now.",
              },
              {
                step: 3,
                title: "Grow together",
                description:
                  "As your child reaches new stages, your feed adapts automatically — no setup needed.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-stone-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-stone-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className="bg-white px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-stone-900">
              Trusted by families, backed by science
            </h2>
          </div>

          {/* Stats grid */}
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                number: "65+",
                label: "Resources",
                icon: BookOpen,
              },
              {
                number: "13",
                label: "Expert Topics",
                icon: GraduationCap,
              },
              {
                number: "100%",
                label: "Professionally Vetted",
                icon: ShieldCheck,
              },
            ].map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="flex justify-center mb-4">
                    <IconComponent className="h-8 w-8 text-brand-600" />
                  </div>
                  <div className="text-4xl font-bold text-brand-600">
                    {stat.number}
                  </div>
                  <div className="mt-2 text-stone-600">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Testimonial */}
          <div className="mt-12 text-center">
            <p className="mx-auto max-w-2xl text-lg italic text-stone-700">
              &ldquo;Finally, a parenting resource I can trust. Everything is
              evidence-based and tailored to exactly where we are in our
              journey.&rdquo;
            </p>
            <p className="mt-4 text-stone-600">— KinPath parent</p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-brand-700 to-brand-600 px-6 py-16 text-center lg:px-12">
        <h2 className="text-3xl font-bold text-white">
          Ready to start your parenting journey?
        </h2>
        <p className="mt-4 text-lg text-white/90">
          Join thousands of families getting personalized, evidence-based guidance.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-8 py-3 text-base font-medium text-white hover:bg-accent-600 transition-colors"
          >
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="border-t border-stone-200 bg-white px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-5xl">
          {/* Footer columns */}
          <div className="grid gap-8 sm:grid-cols-3">
            {/* Column 1: About */}
            <div>
              <h3 className="font-semibold text-stone-900">KinPath</h3>
              <p className="mt-2 text-sm text-stone-600">
                Evidence-based parenting guidance that grows with your family.
                Personalized, professional, and always there when you need it.
              </p>
            </div>

            {/* Column 2: Product */}
            <div>
              <h3 className="font-semibold text-stone-900">Product</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link
                    href="#features"
                    className="text-stone-600 hover:text-brand-600 transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#how-it-works"
                    className="text-stone-600 hover:text-brand-600 transition-colors"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-stone-600 hover:text-brand-600 transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Support */}
            <div>
              <h3 className="font-semibold text-stone-900">Support</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a
                    href="mailto:support@kinpath.com"
                    className="text-stone-600 hover:text-brand-600 transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-stone-600 hover:text-brand-600 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-stone-600 hover:text-brand-600 transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 border-t border-stone-200 pt-8">
            <div className="text-center text-sm text-stone-600">
              <p>&copy; {new Date().getFullYear()} KinPath. All rights reserved.</p>
              <p className="mt-2">
                Not medical advice. Always consult your pediatrician for health decisions.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
