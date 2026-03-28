import Link from "next/link";
import Image from "next/image";
import {
  CalendarClock,
  ShieldCheck,
  Heart,
  MessageCircle,
  LayoutGrid,
  Lock,
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
    <main id="main-content" className="flex min-h-screen flex-col font-sans text-stone-900 bg-[#FAFAF7]">
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
      <section className="relative flex flex-col items-center justify-center overflow-hidden bg-[#FAFAF7] px-6 py-12 lg:py-20 lg:px-12">
        <div className="relative z-10 mx-auto max-w-7xl w-full grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="max-w-2xl">
            <FadeInUp>
              <h1 className="font-serif text-4xl font-bold tracking-tight text-[#1C1C19] sm:text-5xl lg:text-5xl xl:text-6xl leading-tight">
                Parenting guidance that grows with your child
              </h1>
            </FadeInUp>
            <FadeInUp delay={0.15}>
              <p className="mt-6 text-lg text-[#394E53] leading-relaxed">
                Evidence-based resources from trusted institutions, personalized to
                your family&apos;s values. From pregnancy through age 5, always
                the right information at the right time.
              </p>
            </FadeInUp>
            <FadeInUp delay={0.3}>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/auth/register"
                  className="inline-flex justify-center rounded-2xl bg-[#5B8A72] px-8 py-3.5 text-base font-medium text-white shadow-sm hover:shadow-md hover:bg-[#4a725e] transition-colors duration-150"
                >
                  Start Your Free Journey
                </Link>
                <Link
                  href="#features"
                  className="inline-flex justify-center rounded-2xl border border-[#D8E5DC] bg-[#E8F0EB] px-8 py-3.5 text-base font-medium text-[#2B3D35] hover:bg-[#D8E5DC] transition-colors"
                >
                  Learn more
                </Link>
              </div>
            </FadeInUp>
          </div>
          
          <FadeInUp delay={0.4} className="relative hidden lg:block">
            {/* Interactive Image Container */}
            <div className="relative aspect-[4/3] w-full rounded-[24px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-transform duration-500 hover:rotate-2 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
              <Image
                src="/pregnant-parents-sanctuary-home.png"
                alt="A warm, sunlit moment capturing pregnant parents preparing for their child"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 0px, (max-width: 1280px) 50vw, 672px"
              />
            </div>
            {/* Decorative soft backing */}
            <div className="absolute -inset-4 -z-10 rounded-[28px] bg-[#E8F0EB] opacity-60" />
          </FadeInUp>
        </div>
      </section>

      {/* Features overview */}
      <section id="features" className="bg-[#F3F1EC] px-6 py-24 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="max-w-2xl text-center mx-auto lg:text-left lg:mx-0">
              <h2 className="font-serif text-3xl font-bold text-[#1C1C19] sm:text-4xl">
                Built for real families
              </h2>
              <p className="mt-4 text-lg text-[#6B6B68]">
                Everything you need to navigate parenthood with confidence and calm.
              </p>
            </div>
          </ScrollReveal>
          
          <StaggerContainer className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Age-Adaptive",
                description: "Resources automatically update as your child grows. Always relevant, never overwhelming.",
                icon: CalendarClock,
              },
              {
                title: "Trusted Sources",
                description: "Resources sourced from leading institutions like the AAP, CDC, WHO, and ACOG. Evidence-based, always.",
                icon: ShieldCheck,
              },
              {
                title: "Personalized to You",
                description: "Your beliefs, lifestyle, and parenting style shape what you see. No judgment, just support.",
                icon: Heart,
              },
              {
                title: "Find Answers Fast",
                description: "Our chat feature makes it effortless to find exactly what you need from our library, no searching required.",
                icon: MessageCircle,
              },
              {
                title: "All-in-One",
                description: "Nutrition, sleep, milestones, vaccines, and emotional wellness all in one place.",
                icon: LayoutGrid,
              },
              {
                title: "Your Privacy, Protected",
                description: "We never store health records or medical data. Your family's information stays yours.",
                icon: Lock,
              },
            ].map((feature) => {
              const IconComponent = feature.icon;
              return (
                <StaggerItem key={feature.title}>
                  <div className="h-full rounded-[24px] bg-[#FFFFFF] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D8E5DC]">
                      <IconComponent className="h-6 w-6 text-[#5B8A72]" />
                    </div>
                    <h3 className="font-sans text-xl font-semibold text-[#1C1C19]">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-base text-[#6B6B68] leading-relaxed">
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
      <section id="how-it-works" className="bg-[#FAFAF7] px-6 py-24 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <h2 className="text-center font-serif text-3xl font-bold text-[#1C1C19] sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-center text-lg text-[#6B6B68] max-w-xl mx-auto">
              Get personalized parenting guidance in three simple steps
            </p>
          </ScrollReveal>
          
          <div className="mt-16 grid gap-12 sm:grid-cols-3 relative px-4">
            {/* Soft decorative connector line (visible on large screens) */}
            <div className="hidden sm:block absolute top-[28px] left-[16%] right-[16%] h-[2px] bg-[#E8F0EB]" />
            
            {[
              {
                step: 1,
                title: "Tell us about your family",
                description: "Share your child's age, your interests, and parenting values during a quick onboarding.",
              },
              {
                step: 2,
                title: "Get personalized resources",
                description: "We surface evidence-based articles, guides, and checklists tailored to exactly where you are right now.",
              },
              {
                step: 3,
                title: "Grow together",
                description: "As your child reaches new stages, your feed adapts automatically. No setup needed.",
              },
            ].map((item, idx) => (
              <ScrollReveal key={item.step} delay={idx * 0.12}>
                <div className="relative text-center z-10 px-2 lg:px-6">
                  <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#FAFAF7] border-[3px] border-[#5B8A72] text-[#5B8A72] text-xl font-bold box-border shadow-sm">
                    {item.step}
                  </div>
                  <h3 className="font-sans text-xl font-semibold text-[#1C1C19]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[#6B6B68] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className="bg-[#F3F1EC] px-6 py-24 lg:px-12">
        <div className="mx-auto max-w-7xl grid gap-16 lg:grid-cols-2 lg:items-center">
          
          <div className="order-2 lg:order-1 relative hidden sm:block">
            <FadeInUp>
              <div className="relative aspect-[4/5] w-full max-w-md mx-auto rounded-[24px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-transform duration-500 hover:-rotate-2 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                <Image
                  src="/parents-toddler-learning-play-home.png"
                  alt="Parents interacting with their child in a warm sunlit room"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 0px, (max-width: 1024px) 448px, 448px"
                />
              </div>
            </FadeInUp>
          </div>

          <div className="order-1 lg:order-2">
            <ScrollReveal>
              <h2 className="font-serif text-3xl font-bold text-[#1C1C19] sm:text-4xl leading-tight">
                Trusted by families, backed by science
              </h2>
            </ScrollReveal>

            {/* Testimonial */}
            <ScrollReveal delay={0.1}>
              <div className="mt-10 rounded-[24px] bg-[#FFFFFF] p-8 lg:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative">
                <span className="absolute top-4 left-6 font-serif text-6xl leading-none text-[#E8F0EB]">
                  &ldquo;
                </span>
                <p className="relative z-10 text-xl font-serif text-[#1E3226] leading-snug mt-4">
                  Finally, a parenting resource I can trust. Everything is
                  evidence-based and tailored to exactly where we are in our
                  journey.
                </p>
                <div className="relative z-10 mt-8 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#E8F0EB] flex items-center justify-center font-bold text-[#5B8A72]">
                    K
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-[#6B6B68]">
                    Kinpath Parent
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Stats grid */}
            <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-3">
              {[
                { number: "65+", label: "EVIDENCE-BASED RESOURCES" },
                { number: "13", label: "EXPERT TOPICS COVERED" },
                { number: "13", label: "TRUSTED INSTITUTIONS" },
              ].map((stat, idx) => (
                <ScrollReveal key={stat.label} delay={0.2 + (idx * 0.1)}>
                  <div className="font-serif text-4xl font-bold text-[#5B8A72]">
                    {stat.number}
                  </div>
                  <div className="mt-3 text-[11px] font-semibold tracking-wider text-[#6B6B68]">
                    {stat.label}
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Deep Accent CTA Banner (Sparingly dark surface) */}
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

      {/* Enhanced Footer */}
      <footer className="border-t border-[#E5E5E0] bg-[#FAFAF7] px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Column 1: About */}
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

            {/* Column 2: Product */}
            <div>
              <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-[#1C1C19]">
                Product
              </h3>
              <ul className="mt-6 space-y-4 text-sm">
                <li>
                  <Link href="#features" className="text-[#6B6B68] hover:text-[#5B8A72] transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="text-[#6B6B68] hover:text-[#5B8A72] transition-colors">
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

            {/* Column 3: Support */}
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

          {/* Bottom bar */}
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
