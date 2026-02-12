import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
        <span className="text-xl font-bold text-brand-600">KinPath</span>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-gray-700 hover:text-brand-600"
          >
            Log in
          </Link>
          <Link
            href="/auth/register"
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          Parenting guidance that{" "}
          <span className="text-brand-500">grows with your child</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-gray-600">
          Evidence-based resources, professionally vetted and personalized to your
          family&apos;s values. From pregnancy through age 5, always the right
          information at the right time.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/auth/register"
            className="rounded-full bg-brand-500 px-8 py-3 text-base font-medium text-white shadow-lg hover:bg-brand-600 transition-colors"
          >
            Start Your Journey — Free
          </Link>
          <Link
            href="#features"
            className="text-base font-medium text-sage-600 hover:text-sage-700"
          >
            Learn more
          </Link>
        </div>
      </section>

      {/* Features overview */}
      <section id="features" className="bg-white px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Built for real families
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Age-Adaptive",
                description:
                  "Resources automatically update as your child grows. Always relevant, never overwhelming.",
              },
              {
                title: "Professionally Vetted",
                description:
                  "Every resource reviewed by credentialed healthcare professionals. Evidence-based, always.",
              },
              {
                title: "Personalized to You",
                description:
                  "Your beliefs, lifestyle, and parenting style shape what you see. No judgment, just support.",
              },
              {
                title: "AI-Powered Answers",
                description:
                  "Ask questions and get trustworthy answers grounded in our vetted resource library.",
              },
              {
                title: "All-in-One",
                description:
                  "Nutrition, sleep, milestones, vaccines, emotional wellness — everything in one place.",
              },
              {
                title: "Your Privacy, Protected",
                description:
                  "We never store health records or medical data. Your family's information stays yours.",
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl bg-brand-50 p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} KinPath. All rights reserved.</p>
        <p className="mt-1">
          Not medical advice. Always consult your pediatrician for health decisions.
        </p>
      </footer>
    </main>
  );
}
