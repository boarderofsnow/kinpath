import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface HouseholdContext {
  /** The user_id to use for data queries — the owner's id for partners, own id for owners. */
  effectiveOwnerId: string;
  isPartner: boolean;
  /** The household id the partner belongs to (null for owners). */
  householdId: string | null;
}

/**
 * Resolves the effective owner for data queries.
 * - For household owners: returns their own user_id.
 * - For accepted partners: returns the owner's user_id so they can read shared data.
 */
export async function getHouseholdContext(userId: string): Promise<HouseholdContext> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("household_members")
    .select("household_id, households!inner(owner_user_id)")
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();

  if (data) {
    const households = (data as unknown as {
      household_id: string;
      households: { owner_user_id: string };
    }).households;

    return {
      effectiveOwnerId: households.owner_user_id,
      isPartner: true,
      householdId: (data as { household_id: string }).household_id,
    };
  }

  return { effectiveOwnerId: userId, isPartner: false, householdId: null };
}
