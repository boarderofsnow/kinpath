// Supabase Edge Function: AI Chat (alternative to Next.js API route)
// This can be used for direct mobile API calls without going through Next.js
//
// Deploy: supabase functions deploy ai-chat
// Note: The primary AI chat endpoint is in the Next.js API route.
// This edge function serves as an alternative for mobile clients that
// need to call Supabase directly without a web server intermediary.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

serve(async (req) => {
  // This is a placeholder — the full implementation mirrors
  // packages/web/src/app/api/ai/chat/route.ts
  //
  // Implement when mobile app needs direct Supabase Edge Function access.

  // Manual apikey check — required because verify_jwt = false in config.toml.
  // New publishable keys (sb_publishable_...) are not JWTs so Supabase's
  // built-in JWT verification is disabled; we validate the key here instead.
  const apiKey = req.headers.get("apikey");
  const expectedKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!apiKey || apiKey !== expectedKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      message: "AI chat edge function placeholder. Use the Next.js API route for now.",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
