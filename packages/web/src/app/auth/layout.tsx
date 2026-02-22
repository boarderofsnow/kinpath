export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-brand-50 via-white to-sage-50">
      {/* Ambient decorative shapes */}
      <div className="pointer-events-none fixed right-[-5rem] top-[10%] h-72 w-72 rounded-full bg-brand-100/40 blur-3xl" />
      <div className="pointer-events-none fixed bottom-[10%] left-[-5rem] h-72 w-72 rounded-full bg-sage-100/40 blur-3xl" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
