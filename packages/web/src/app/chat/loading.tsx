import { AppNav } from "@/components/nav/app-nav";

export default function ChatLoading() {
  return (
    <div className="flex h-screen flex-col bg-[#f0eeec]">
      <AppNav currentPath="/chat" />
      <div className="flex flex-1 flex-col animate-pulse">
        {/* Child selector skeleton */}
        <div className="border-b border-stone-200/60 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <div className="h-8 w-24 rounded-full bg-stone-200" />
            <div className="h-8 w-24 rounded-full bg-stone-100" />
          </div>
        </div>

        {/* Chat messages area skeleton */}
        <div className="flex-1 overflow-hidden px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-4">
            {/* Welcome message skeleton */}
            <div className="flex gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-sage-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-stone-200" />
                <div className="h-3 w-full max-w-md rounded bg-stone-100" />
                <div className="h-3 w-3/4 max-w-sm rounded bg-stone-100" />
              </div>
            </div>
          </div>
        </div>

        {/* Input area skeleton */}
        <div className="border-t border-stone-200/60 bg-white px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="h-12 w-full rounded-xl bg-stone-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
