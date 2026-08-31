import { createClient } from "@supabase/supabase-js";

export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getBusinessIdForRequest(accessToken: string): Promise<string | null> {
  if (!accessToken) return null;
  const { data: { user }, error } = await supabaseClient.auth.getUser(accessToken);
  if (error || !user) return null;

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (business?.id) return business.id;

  const { data: created } = await supabaseAdmin
    .from("businesses")
    .insert({
      user_id: user.id,
      business_name: user.user_metadata?.business_name || "My Business",
      industry: user.user_metadata?.industry || "General",
      currency: user.user_metadata?.currency || "USD",
    })
    .select("id")
    .single();

  return created?.id ?? null;
}
