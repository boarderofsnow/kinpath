"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface AccountSectionProps {
  userId: string;
}

export function AccountSection({ userId }: AccountSectionProps) {
  const router = useRouter();
  const supabase = createClient();

  const [accountLoading, setAccountLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleSignOut = useCallback(async () => {
    setAccountLoading(true);
    await supabase.auth.signOut();
    router.push("/");
  }, [supabase, router]);

  const handleDeleteAccount = useCallback(async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setDeleteLoading(true);
    try {
      const { error: apiError } = await api.account.delete();
      if (apiError) {
        throw new Error(apiError);
      }
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Failed to delete account:", error);
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  }, [supabase, router, deleteConfirm]);

  return (
    <section className="rounded-2xl border border-stone-200/60 bg-white shadow-card p-6">
      <h2 className="text-lg font-semibold text-stone-900 mb-4">Account</h2>

      <div className="space-y-3">
        <button
          onClick={handleSignOut}
          disabled={accountLoading}
          className="w-full rounded-xl bg-brand-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {accountLoading ? "Signing out..." : "Sign Out"}
        </button>

        <button
          onClick={handleDeleteAccount}
          disabled={deleteLoading}
          className={`w-full rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            deleteConfirm
              ? "bg-red-600 text-white hover:bg-red-700"
              : "border border-red-200 text-red-600 hover:bg-red-50"
          }`}
        >
          {deleteLoading
            ? "Deleting..."
            : deleteConfirm
            ? "Confirm: Delete my account permanently"
            : "Delete Account"}
        </button>
        {deleteConfirm && !deleteLoading && (
          <button
            onClick={() => setDeleteConfirm(false)}
            className="w-full rounded-xl px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700"
          >
            Cancel
          </button>
        )}
      </div>
    </section>
  );
}
