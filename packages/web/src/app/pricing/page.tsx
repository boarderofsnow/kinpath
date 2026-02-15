'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Crown, Star, Users, Sparkles, Loader2 } from 'lucide-react';
import { AppNav } from '@/components/nav/app-nav';
import { createClient } from '@/lib/supabase/client';

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
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          interval: billingInterval,
        }),
      });

      if (!response.ok) {
        throw new Error('Checkout failed');
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
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
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to open portal');
      const data = await response.json();
      if (data.url) window.location.href = data.url;
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
        { name: '', included: false },
        { name: '', included: false },
        { name: '', included: false },
        { name: '', included: false },
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
    <div className="min-h-screen bg-stone-50" style={{ backgroundColor: '#f0eeec' }}>
      <AppNav currentPath="/pricing" />

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-stone-900 sm:text-5xl">
            Choose Your Plan
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-stone-600">
            Evidence-based parenting guidance, tailored to your family
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mb-12 flex justify-center">
          <div className="inline-flex rounded-lg border border-stone-200/60 bg-white p-1">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 font-medium transition-all ${
                billingInterval === 'monthly'
                  ? 'bg-stone-100 text-stone-900'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('annual')}
              className={`relative px-6 py-2 font-medium transition-all ${
                billingInterval === 'annual'
                  ? 'bg-stone-100 text-stone-900'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Annual
              {billingInterval === 'annual' && (
                <span className="absolute -top-2 -right-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                  Save
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const PlanIcon = plan.icon;
            const currentPlanPrice = currentPrice(plan);
            const savings =
              billingInterval === 'annual' && plan.yearlyPrice > 0
                ? calculateSavings(plan.monthlyPrice, plan.yearlyPrice)
                : 0;

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border transition-all ${
                  plan.highlighted
                    ? 'border-2 border-cyan-600 bg-white shadow-lg'
                    : 'border border-stone-200/60 bg-white'
                } p-8`}
                style={
                  plan.highlighted
                    ? { borderColor: '#10b89f', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }
                    : { boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }
                }
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="mb-4 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
                    {plan.badge}
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6 flex items-center gap-3">
                  <PlanIcon className="h-6 w-6 text-cyan-600" style={{ color: '#10b89f' }} />
                  <h2 className="text-2xl font-bold text-stone-900">{plan.name}</h2>
                </div>

                {/* Price */}
                <div className="mb-2">
                  <span className="text-5xl font-bold text-stone-900">${currentPlanPrice.toFixed(2)}</span>
                  <span className="text-stone-600">/{billingInterval === 'monthly' ? 'month' : 'year'}</span>
                </div>

                {/* Savings Badge */}
                {savings > 0 && (
                  <div className="mb-6 text-sm text-stone-600">
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
                  className={`mb-8 w-full py-3 font-semibold transition-all rounded-lg ${
                    plan.buttonDisabled
                      ? 'bg-stone-300 text-stone-600 cursor-not-allowed'
                      : plan.highlighted
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'border border-stone-200 text-stone-900 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                  style={
                    plan.highlighted && !plan.buttonDisabled
                      ? { backgroundColor: '#f59e0b' }
                      : {}
                  }
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
                    feature.name && (
                      <div key={index} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-600" style={{ color: '#10b89f' }} />
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
                    )
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 rounded-2xl border border-stone-200/60 bg-white p-8">
          <h2 className="mb-8 text-2xl font-bold text-stone-900">Frequently Asked Questions</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold text-stone-900">Can I change plans anytime?</h3>
              <p className="text-stone-600">
                Yes! You can upgrade, downgrade, or cancel your subscription at any time from your account settings.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-stone-900">What payment methods do you accept?</h3>
              <p className="text-stone-600">
                We accept all major credit and debit cards through Stripe, including Visa, Mastercard, and American Express.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-stone-900">Is there a free trial?</h3>
              <p className="text-stone-600">
                Our Free plan gives you access to core features with no credit card required. Upgrade anytime to unlock more.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-stone-900">What&apos;s the difference between Premium and Family?</h3>
              <p className="text-stone-600">
                Family plans include co-parent sharing and priority support, perfect for couples managing parenting together.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
