import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const VALID_STATUSES = ["approved", "rejected", "needs_revision"];

export async function POST(req: NextRequest) {
  // Verify the requesting user is an active reviewer
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: reviewer } = await supabase
    .from("reviewers")
    .select("id")
    .eq("user_id", user.id)
    .eq("active", true)
    .single();

  if (!reviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    resource_id?: string;
    reviewer_id?: string;
    status?: string;
    review_notes?: string | null;
    credentials_verified?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { resource_id, status, review_notes, credentials_verified } = body;

  if (!resource_id) {
    return NextResponse.json({ error: "resource_id is required" }, { status: 400 });
  }
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Confirm this resource is actually assigned to this reviewer
  const { data: resource } = await supabase
    .from("resources")
    .select("id")
    .eq("id", resource_id)
    .eq("assigned_reviewer_id", reviewer.id)
    .single();

  if (!resource) {
    return NextResponse.json(
      { error: "Resource not found or not assigned to you" },
      { status: 404 }
    );
  }

  const serviceSupabase = createServiceRoleClient();

  // Upsert the review (one review per reviewer per resource)
  const { error: reviewError } = await serviceSupabase
    .from("professional_reviews")
    .upsert(
      {
        resource_id,
        reviewer_id: reviewer.id,
        status,
        review_notes: review_notes ?? null,
        credentials_verified: credentials_verified ?? false,
        reviewed_at: new Date().toISOString(),
      },
      { onConflict: "resource_id,reviewer_id" }
    );

  if (reviewError) {
    // If there's no unique constraint for upsert, fall back to insert/update
    // First try to find existing
    const { data: existing } = await serviceSupabase
      .from("professional_reviews")
      .select("id")
      .eq("resource_id", resource_id)
      .eq("reviewer_id", reviewer.id)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await serviceSupabase
        .from("professional_reviews")
        .update({
          status,
          review_notes: review_notes ?? null,
          credentials_verified: credentials_verified ?? false,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Failed to update review:", updateError);
        return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
      }
    } else {
      const { error: insertError } = await serviceSupabase
        .from("professional_reviews")
        .insert({
          resource_id,
          reviewer_id: reviewer.id,
          status,
          review_notes: review_notes ?? null,
          credentials_verified: credentials_verified ?? false,
          reviewed_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Failed to insert review:", insertError);
        return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
      }
    }
  }

  // If the review is approved, optionally update resource status to reflect it
  // (Admins still make the final publish decision)
  // But we could mark it as "needs attention" by the admin — no auto-publish here.

  return NextResponse.json({ success: true });
}
