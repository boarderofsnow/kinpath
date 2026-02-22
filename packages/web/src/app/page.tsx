import Link from "next/link";
import {
  CalendarClock,
  ShieldCheck,
  Heart,
  MessageCircle,
  LayoutGrid,
  Lock,
  BookOpen,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import {
  FadeInUp,
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/motion";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kinpath-logo.png" alt="KinPath" className="h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-stone-700 hover:text-brand-600"
          >
            Log in
          </Link>
          <Link
            href="/auth/register"
            className="rounded-xl bg-accent-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-600 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-noise relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-sage-900 px-6 py-24 text-center sm:py-28">
        {/* Ambient gradient orbs */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-sage-500/15 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-500/10 blur-3xl" />

        <div className="relative z-10">
          <FadeInUp>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Parenting guidance that{" "}
              <span className="text-accent-400">grows with your child</span>
            </h1>
          </FadeInUp>
          <FadeInUp delay={0.15}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/90">
              Evidence-based resources from trusted institutions, personalized to
              your family&apos;s values. From pregnancy through age 5, always
              the right information at the right time.
            </p>
          </FadeInUp>
          <FadeInUp delay={0.3}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/auth/register"
                className="rounded-xl bg-accent-500 px-8 py-3 text-base font-medium text-white shadow-lg hover:bg-accent-600 hover:shadow-xl transition-all"
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
          </FadeInUp>
        </div>
      </section>

      {/* Features overview */}
      <section id="features" className="bg-white px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <h2 className="text-center text-3xl font-bold text-stone-900">
              Built for real families
            </h2>
          </ScrollReveal>
          <StaggerContainer className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Age-Adaptive",
                description:
                  "Resources automatically update as your child grows. Always relevant, never overwhelming.",
                icon: CalendarClock,
              },
              {
                title: "Trusted Sources",
                description:
                  "Resources sourced from leading institutions like the AAP, CDC, WHO, and ACOG. Evidence-based, always.",
                icon: ShieldCheck,
              },
              {
                title: "Personalized to You",
                description:
                  "Your beliefs, lifestyle, and parenting style shape what you see. No judgment, just support.",
                icon: Heart,
              },
              {
                title: "Find Answers Fast",
                description:
                  "Our chat feature makes it effortless to find exactly what you need from our evidence-based resource library — no searching required.",
                icon: MessageCircle,
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
                <StaggerItem key={feature.title}>
                  <div className="rounded-2xl border border-stone-200/60 border-t-2 border-t-brand-300/40 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100">
                      <IconComponent className="h-6 w-6 text-brand-600" />
                    </div>
                    <h3 className="font-sans text-lg font-semibold text-stone-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-stone-600">
                      {feature.description}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="bg-stone-50 px-6 py-20 lg:px-12"
        style={{ backgroundColor: "#f7f5f3" }}
      >
        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <h2 className="text-center text-3xl font-bold text-stone-900">
              How it works
            </h2>
            <p className="mt-2 text-center text-stone-600">
              Get personalized parenting guidance in three simple steps
            </p>
          </ScrollReveal>
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
            ].map((item, idx) => (
              <ScrollReveal key={item.step} delay={idx * 0.12}>
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-lg font-bold text-white shadow-glow">
                    {item.step}
                  </div>
                  <h3 className="font-sans text-lg font-semibold text-stone-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-stone-600">
                    {item.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className="bg-white px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <h2 className="text-center text-3xl font-bold text-stone-900">
              Trusted by families, backed by science
            </h2>
          </ScrollReveal>

          {/* Stats grid */}
          <StaggerContainer className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                number: "65+",
                label: "Evidence-Based Resources",
                icon: BookOpen,
              },
              {
                number: "13",
                label: "Expert Topics Covered",
                icon: GraduationCap,
              },
              {
                number: "13",
                label: "Trusted Institutions",
                icon: ShieldCheck,
              },
            ].map((stat) => {
              const IconComponent = stat.icon;
              return (
                <StaggerItem key={stat.label}>
                  <div className="text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
                        <IconComponent className="h-7 w-7 text-brand-600" />
                      </div>
                    </div>
                    <div className="font-display text-4xl font-bold text-brand-600">
                      {stat.number}
                    </div>
                    <div className="mt-2 text-sm text-stone-600">
                      {stat.label}
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>

          {/* Testimonial */}
          <ScrollReveal>
            <div className="mt-16 text-center">
              <div className="mx-auto max-w-2xl rounded-2xl border border-stone-100 bg-stone-50/50 px-8 py-8">
                <span className="font-display text-5xl leading-none text-brand-200">
                  &ldquo;
                </span>
                <p className="-mt-4 text-lg italic text-stone-700">
                  Finally, a parenting resource I can trust. Everything is
                  evidence-based and tailored to exactly where we are in our
                  journey.
                </p>
                <p className="mt-4 text-sm font-medium text-stone-500">
                  — KinPath parent
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-noise relative overflow-hidden bg-gradient-to-r from-brand-800 via-brand-700 to-sage-800 px-6 py-16 text-center lg:px-12">
        <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-sage-500/15 blur-3xl" />
        <div className="relative z-10">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-white">
              Ready to start your parenting journey?
            </h2>
            <p className="mt-4 text-lg text-white/90">
              Join families getting personalized, evidence-based guidance.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-8 py-3 text-base font-medium text-white shadow-lg hover:bg-accent-600 hover:shadow-xl transition-all"
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="border-t border-stone-200 bg-white px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-5xl">
          {/* Footer columns */}
          <div className="grid gap-8 sm:grid-cols-3">
            {/* Column 1: About */}
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/kinpath-logo.png"
                alt="KinPath"
                className="h-7 w-auto"
              />
              <p className="mt-2 text-sm text-stone-600">
                Evidence-based parenting guidance that grows with your family.
                Personalized, professional, and always there when you need it.
              </p>
            </div>

            {/* Column 2: Product */}
            <div>
              <h3 className="font-sans font-semibold text-stone-900">
                Product
              </h3>
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
                    href="/pricing"
                    className="text-stone-600 hover:text-brand-600 transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Support */}
            <div>
              <h3 className="font-sans font-semibold text-stone-900">
                Support
              </h3>
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
                    href="/privacy"
                    className="text-stone-600 hover:text-brand-600 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
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
              <p>
                &copy; {new Date().getFullYear()} KinPath. All rights reserved.
              </p>
              <p className="mt-2">
                Not medical advice. Always consult your pediatrician for health
                decisions.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
