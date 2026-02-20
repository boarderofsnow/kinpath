import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversation_id, title } = await request.json();

    if (!conversation_id) {
      return NextResponse.json(
        { error: "conversation_id is required" },
        { status: 400 }
      );
    }

    // Verify the conversation belongs to this user
    const { data: conversation } = await supabase
      .from("ai_conversations")
      .select("id, messages")
      .eq("id", conversation_id)
      .eq("user_id", user.id)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Auto-generate title from first user message if not provided
    const autoTitle =
      title ||
      (conversation.messages as Array<{ role: string; content: string }>)
        .find((m) => m.role === "user")
        ?.content.slice(0, 80) ||
      "Saved conversation";

    const { data: saved, error } = await supabase
      .from("saved_conversations")
      .upsert(
        {
          user_id: user.id,
          conversation_id,
          title: autoTitle,
        },
        { onConflict: "user_id,conversation_id" }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(saved);
  } catch (error) {
    console.error("Save conversation error:", error);
    return NextResponse.json(
      { error: "Failed to save conversation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversation_id } = await request.json();

    if (!conversation_id) {
      return NextResponse.json(
        { error: "conversation_id is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("saved_conversations")
      .delete()
      .eq("user_id", user.id)
      .eq("conversation_id", conversation_id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unsave conversation error:", error);
    return NextResponse.json(
      { error: "Failed to unsave conversation" },
      { status: 500 }
    );
  }
}
