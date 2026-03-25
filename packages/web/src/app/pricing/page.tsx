'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X, Star, Users, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { FadeInUp, ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  subscription_tier: 'free' | 'premium' | 'family';
}

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user;

        if (authUser) {
          const { data, error } = await supabase
            .from('users')
            .select('id, email, subscription_tier')
            .eq('id', authUser.id)
            .single();

          if (!error && data) {
            setUser(data);
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleCheckout = async (plan: 'premium' | 'family') => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setCheckoutLoading(plan);
    try {
      const { data, error: apiError } = await api.stripe.checkout({
        plan,
        interval: billingInterval,
      });

      if (apiError) {
        throw new Error(apiError);
      }

      const checkoutData = data as { url?: string } | null;
      if (checkoutData?.url) {
        window.location.href = checkoutData.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    setCheckoutLoading('manage');
    try {
      const { data, error: apiError } = await api.stripe.portal();
      if (apiError) throw new Error(apiError);
      const portalData = data as { url?: string } | null;
      if (portalData?.url) window.location.href = portalData.url;
    } catch (error) {
      console.error('Portal error:', error);
      setCheckoutLoading(null);
    }
  };

  const plans = [
    {
      name: 'Free',
      icon: Sparkles,
      monthlyPrice: 0,
      yearlyPrice: 0,
      badge: null,
      highlighted: false,
      features: [
        { name: '5 AI questions per month', included: true },
        { name: '1 child profile', included: true },
        { name: 'Full resource library', included: true },
        { name: 'Child-specific filtering', included: false },
        { name: 'Bookmarks & checklists', included: false },
        { name: 'Email digests', included: false },
        { name: 'Partner sharing', included: false },
      ],
      buttonText: user?.subscription_tier === 'free' ? 'Current Plan' : 'Downgrade',
      buttonAction: 'downgrade',
      buttonDisabled: user?.subscription_tier === 'free',
    },
    {
      name: 'Premium',
      icon: Star,
      monthlyPrice: 12.99,
      yearlyPrice: 99.99,
      badge: 'Most Popular',
      highlighted: true,
      features: [
        { name: 'Unlimited AI questions', included: true },
        { name: 'Unlimited child profiles', included: true },
        { name: 'Full resource library with child filtering', included: true },
        { name: 'Bookmarks & checklists', included: true },
        { name: 'Weekly email digests', included: true },
        { name: 'Partner sharing (1 partner)', included: true },
      ],
      buttonText: user?.subscription_tier === 'premium' ? 'Current Plan' : 'Get Premium',
      buttonAction: user?.subscription_tier === 'premium' ? 'manage' : 'checkout',
      buttonPlan: 'premium',
      buttonDisabled: user?.subscription_tier === 'premium',
    },
    {
      name: 'Family',
      icon: Users,
      monthlyPrice: 19.99,
      yearlyPrice: 149.99,
      badge: null,
      highlighted: false,
      features: [
        { name: 'Everything in Premium', included: true },
        { name: 'Up to 5 additional caregivers', included: true },
        { name: 'Invite grandparents, babysitters & more', included: true },
      ],
      buttonText: user?.subscription_tier === 'family' ? 'Current Plan' : 'Get Family',
      buttonAction: user?.subscription_tier === 'family' ? 'manage' : 'checkout',
      buttonPlan: 'family',
      buttonDisabled: user?.subscription_tier === 'family',
    },
  ];

  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const yearlyIfMonthly = monthlyPrice * 12;
    const savings = yearlyIfMonthly - yearlyPrice;
    return Math.round(savings);
  };

  const currentPrice = (plan: { monthlyPrice: number; yearlyPrice: number }) => {
    return billingInterval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  return (
    <main className="flex min-h-screen flex-col font-sans text-[#1C1C19] bg-[#FAFAF7]">
      {/* Nav — matches landing page */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12 backdrop-blur-md bg-white/90 sticky top-0 z-50">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kinpath-logo.png" alt="Kinpath" width={144} height={36} className="h-9 w-auto" />
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
      <section className="bg-[#FAFAF7] px-6 py-16 lg:py-24 lg:px-12">
        <div className="mx-auto max-w-7xl text-center">
          <FadeInUp>
            <h1 className="mb-4 font-serif text-4xl font-bold text-[#1C1C19] sm:text-5xl lg:text-5xl leading-tight">
              Simple, transparent pricing
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-[#6B6B68] leading-relaxed">
              Evidence-based parenting guidance, tailored to your family.
              Start free and upgrade as you grow.
            </p>
          </FadeInUp>

          {/* Billing Toggle */}
          <FadeInUp delay={0.1}>
            <div className="mt-10 flex justify-center">
              <div className="relative inline-flex rounded-full border border-[#E5E5E0] bg-white p-1">
                <button
                  onClick={() => setBillingInterval('monthly')}
                  className={`relative z-10 rounded-full px-6 py-2 text-sm font-medium transition-all ${
                    billingInterval === 'monthly'
                      ? 'bg-[#2B3D35] text-white shadow-sm'
                      : 'text-[#6B6B68] hover:text-[#1C1C19]'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval('annual')}
                  className={`relative z-10 rounded-full px-6 py-2 text-sm font-medium transition-all ${
                    billingInterval === 'annual'
                      ? 'bg-[#2B3D35] text-white shadow-sm'
                      : 'text-[#6B6B68] hover:text-[#1C1C19]'
                  }`}
                >
                  Annual
                  <span className="ml-1.5 inline-block rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs font-semibold text-[#92400E]">
                    Save
                  </span>
                </button>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Pricing Cards — surface-dim background for contrast */}
      <section className="bg-[#F3F1EC] px-6 py-16 lg:py-24 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <StaggerContainer className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => {
              const PlanIcon = plan.icon;
              const currentPlanPrice = currentPrice(plan);
              const savings =
                billingInterval === 'annual' && plan.yearlyPrice > 0
                  ? calculateSavings(plan.monthlyPrice, plan.yearlyPrice)
                  : 0;
              const isDark = plan.highlighted;

              return (
                <StaggerItem key={plan.name}>
                  <div
                    className={`relative h-full rounded-[24px] p-8 transition-all duration-300 hover:-translate-y-1 ${
                      isDark
                        ? 'bg-[#2B3D35] shadow-[0_4px_24px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.16)]'
                        : 'bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]'
                    }`}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <div className={`mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        isDark
                          ? 'bg-[#5B8A72] text-white'
                          : 'bg-[#E8F0EB] text-[#1E3226]'
                      }`}>
                        {plan.badge}
                      </div>
                    )}

                    {/* Plan Header */}
                    <div className="mb-6 flex items-center gap-3">
                      <PlanIcon className={`h-6 w-6 ${isDark ? 'text-[#D8E5DC]' : 'text-[#8B6F47]'}`} />
                      <h2 className={`font-serif text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1C1C19]'}`}>
                        {plan.name}
                      </h2>
                    </div>

                    {/* Price */}
                    <div className="mb-2">
                      <span className={`font-sans text-5xl font-bold ${isDark ? 'text-white' : 'text-[#1C1C19]'}`}>
                        ${currentPlanPrice.toFixed(2)}
                      </span>
                      <span className={`text-base ${isDark ? 'text-[#D8E5DC]' : 'text-[#6B6B68]'}`}>
                        /{billingInterval === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>

                    {/* Savings Badge */}
                    {savings > 0 && (
                      <div className={`mb-6 text-sm font-medium ${isDark ? 'text-[#D8E5DC]' : 'text-[#5B8A72]'}`}>
                        Save ${savings}/yr
                      </div>
                    )}

                    {/* Button */}
                    <button
                      onClick={() => {
                        if (plan.buttonAction === 'checkout') {
                          handleCheckout(plan.buttonPlan as 'premium' | 'family');
                        } else if (plan.buttonAction === 'manage') {
                          handleManageSubscription();
                        }
                      }}
                      disabled={
                        plan.buttonDisabled ||
                        checkoutLoading === plan.buttonPlan ||
                        checkoutLoading === 'downgrade'
                      }
                      className={`mb-8 w-full rounded-2xl py-3.5 font-semibold transition-all ${
                        plan.buttonDisabled
                          ? isDark
                            ? 'bg-white/20 text-white/50 cursor-not-allowed'
                            : 'bg-[#E5E5E0] text-[#6B6B68] cursor-not-allowed'
                          : isDark
                            ? 'bg-[#5B8A72] text-white hover:bg-[#4a725e] shadow-sm hover:shadow-md'
                            : 'border border-[#E5E5E0] text-[#1C1C19] hover:border-[#D8E5DC] hover:bg-[#FAFAF7]'
                      }`}
                    >
                      {checkoutLoading === plan.buttonPlan || checkoutLoading === 'downgrade' ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        plan.buttonText
                      )}
                    </button>

                    {/* Features List */}
                    <div className="space-y-4">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className={`mt-0.5 h-5 w-5 flex-shrink-0 ${isDark ? 'text-[#5B8A72]' : 'text-[#5B8A72]'}`} />
                          ) : (
                            <X className={`mt-0.5 h-5 w-5 flex-shrink-0 ${isDark ? 'text-white/20' : 'text-[#E5E5E0]'}`} />
                          )}
                          <span
                            className={
                              feature.included
                                ? isDark ? 'text-[#E8F0EB]' : 'text-[#1C1C19]'
                                : isDark ? 'text-white/30' : 'text-[#6B6B68]/60'
                            }
                          >
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-[#FAFAF7] px-6 py-24 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <h2 className="mb-12 text-center font-serif text-3xl font-bold text-[#1C1C19] sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              <div>
                <h3 className="mb-2 font-sans font-semibold text-[#1C1C19]">Can I change plans anytime?</h3>
                <p className="text-sm text-[#6B6B68] leading-relaxed">
                  Yes! You can upgrade, downgrade, or cancel your subscription at any time from your account settings.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-sans font-semibold text-[#1C1C19]">What payment methods do you accept?</h3>
                <p className="text-sm text-[#6B6B68] leading-relaxed">
                  We accept all major credit and debit cards through Stripe, including Visa, Mastercard, and American Express.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-sans font-semibold text-[#1C1C19]">Is there a free trial?</h3>
                <p className="text-sm text-[#6B6B68] leading-relaxed">
                  Our Free plan gives you access to core features with no credit card required. Upgrade anytime to unlock more.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-sans font-semibold text-[#1C1C19]">What&apos;s the difference between Premium and Family?</h3>
                <p className="text-sm text-[#6B6B68] leading-relaxed">
                  Premium includes partner sharing for co-parents. Family plans let you add up to 5 caregivers &mdash; grandparents, babysitters, nannies, and more.
                </p>
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

      {/* Footer — matches landing page */}
      <footer className="border-t border-[#E5E5E0] bg-[#FAFAF7] px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Link href="/">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
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
                  <a href="mailto:support@kinpath.family" className="text-[#6B6B68] hover:text-[#5B8A72] transition-colors">
                    Contact
                  </a>
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
