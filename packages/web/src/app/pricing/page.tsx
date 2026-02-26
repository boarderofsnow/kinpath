'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Star, Users, Sparkles, Loader2 } from 'lucide-react';
import { AppNav } from '@/components/nav/app-nav';
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
        const { data: { user: authUser } } = await supabase.auth.getUser();

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
        { name: 'Basic resource access', included: true },
        { name: 'Full resource library', included: false },
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
      monthlyPrice: 9.99,
      yearlyPrice: 79.99,
      badge: 'Most Popular',
      highlighted: true,
      features: [
        { name: 'Unlimited AI questions', included: true },
        { name: 'Up to 5 child profiles', included: true },
        { name: 'Full resource library', included: true },
        { name: 'Bookmarks & checklists', included: true },
        { name: 'Weekly email digests', included: true },
        { name: 'Partner sharing', included: false },
        { name: 'Priority support', included: false },
      ],
      buttonText: user?.subscription_tier === 'premium' ? 'Current Plan' : 'Get Premium',
      buttonAction: user?.subscription_tier === 'premium' ? 'manage' : 'checkout',
      buttonPlan: 'premium',
      buttonDisabled: user?.subscription_tier === 'premium',
    },
    {
      name: 'Family',
      icon: Users,
      monthlyPrice: 14.99,
      yearlyPrice: 99.99,
      badge: null,
      highlighted: false,
      features: [
        { name: 'Everything in Premium', included: true },
        { name: 'Partner/co-parent sharing', included: true },
        { name: 'Priority support', included: true },
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
    <div className="min-h-screen" style={{ backgroundColor: '#f0eeec' }}>
      <AppNav currentPath="/pricing" />

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <FadeInUp>
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-stone-900 sm:text-5xl">
              Choose Your Plan
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-stone-600">
              Evidence-based parenting guidance, tailored to your family
            </p>
          </div>
        </FadeInUp>

        {/* Billing Toggle */}
        <FadeInUp delay={0.1}>
          <div className="mb-12 flex justify-center">
            <div className="relative inline-flex rounded-full border border-stone-200/60 bg-white p-1">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`relative z-10 rounded-full px-6 py-2 text-sm font-medium transition-all ${
                  billingInterval === 'monthly'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('annual')}
                className={`relative z-10 rounded-full px-6 py-2 text-sm font-medium transition-all ${
                  billingInterval === 'annual'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Annual
                <span className="ml-1.5 inline-block rounded-full bg-accent-100 px-1.5 py-0.5 text-xs font-semibold text-accent-800">
                  Save
                </span>
              </button>
            </div>
          </div>
        </FadeInUp>

        {/* Pricing Cards */}
        <StaggerContainer className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const PlanIcon = plan.icon;
            const currentPlanPrice = currentPrice(plan);
            const savings =
              billingInterval === 'annual' && plan.yearlyPrice > 0
                ? calculateSavings(plan.monthlyPrice, plan.yearlyPrice)
                : 0;

            return (
              <StaggerItem key={plan.name}>
                <div
                  className={`relative rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 ${
                    plan.highlighted
                      ? 'border-2 border-brand-500 bg-white shadow-lg hover:shadow-xl'
                      : 'border border-stone-200/60 bg-white shadow-card hover:shadow-card-hover'
                  } p-8`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="mb-4 inline-block rounded-full bg-accent-100 px-3 py-1 text-sm font-semibold text-accent-800">
                      {plan.badge}
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="mb-6 flex items-center gap-3">
                    <PlanIcon className="h-6 w-6 text-brand-500" />
                    <h2 className="font-sans text-2xl font-bold text-stone-900">{plan.name}</h2>
                  </div>

                  {/* Price */}
                  <div className="mb-2">
                    <span className="font-sans text-5xl font-bold text-stone-900">${currentPlanPrice.toFixed(2)}</span>
                    <span className="text-stone-600">/{billingInterval === 'monthly' ? 'month' : 'year'}</span>
                  </div>

                  {/* Savings Badge */}
                  {savings > 0 && (
                    <div className="mb-6 text-sm text-brand-600 font-medium">
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
                    className={`mb-8 w-full rounded-xl py-3 font-semibold transition-all ${
                      plan.buttonDisabled
                        ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                        : plan.highlighted
                          ? 'bg-accent-500 text-white hover:bg-accent-600 shadow-sm'
                          : 'border border-stone-200 text-stone-900 hover:border-stone-300 hover:bg-stone-50'
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
                          <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-500" />
                        ) : (
                          <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-stone-300" />
                        )}
                        <span
                          className={
                            feature.included ? 'text-stone-700' : 'text-stone-400'
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

        {/* FAQ Section */}
        <ScrollReveal>
          <div className="mt-20 rounded-2xl border border-stone-200/60 bg-white p-8 shadow-card">
            <h2 className="mb-8 text-2xl font-bold text-stone-900">Frequently Asked Questions</h2>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-sans font-semibold text-stone-900">Can I change plans anytime?</h3>
                <p className="text-sm text-stone-600">
                  Yes! You can upgrade, downgrade, or cancel your subscription at any time from your account settings.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-sans font-semibold text-stone-900">What payment methods do you accept?</h3>
                <p className="text-sm text-stone-600">
                  We accept all major credit and debit cards through Stripe, including Visa, Mastercard, and American Express.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-sans font-semibold text-stone-900">Is there a free trial?</h3>
                <p className="text-sm text-stone-600">
                  Our Free plan gives you access to core features with no credit card required. Upgrade anytime to unlock more.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-sans font-semibold text-stone-900">What&apos;s the difference between Premium and Family?</h3>
                <p className="text-sm text-stone-600">
                  Family plans include co-parent sharing and priority support, perfect for couples managing parenting together.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
}
