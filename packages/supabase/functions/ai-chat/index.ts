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

  return new Response(
    JSON.stringify({
      message: "AI chat edge function placeholder. Use the Next.js API route for now.",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
