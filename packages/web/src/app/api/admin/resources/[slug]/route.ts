import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const ALL_STATUSES = ["draft", "in_review", "published", "rejected", "archived"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Verify the requesting user is an admin
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse and validate body
  let body: {
    status?: string;
    assigned_reviewer_id?: string | null;
    publish?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { status, assigned_reviewer_id, publish } = body;

  if (status && !ALL_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Use service role to bypass RLS for the update
  const serviceSupabase = createServiceRoleClient();

  // Build the update object
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (status) updates.status = status;
  if ("assigned_reviewer_id" in body) {
    updates.assigned_reviewer_id = assigned_reviewer_id ?? null;
  }

  // If publishing, record vetted_at and vetted_by
  if (publish || status === "published") {
    updates.status = "published";
    updates.vetted_at = new Date().toISOString();
    updates.vetted_by = user.id;
  }

  const { error } = await serviceSupabase
    .from("resources")
    .update(updates)
    .eq("slug", slug);

  if (error) {
    console.error("Failed to update resource:", error);
    return NextResponse.json({ error: "Failed to update resource" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
