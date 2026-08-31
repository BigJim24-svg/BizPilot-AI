import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, getBusinessIdForRequest } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const businessId = await getBusinessIdForRequest(token);
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin.from("customers").select("*").eq("business_id", businessId).order("lifetime_value", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ customers: data });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const businessId = await getBusinessIdForRequest(token);
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { data, error } = await supabaseAdmin.from("customers").insert({ ...body, business_id: businessId }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ customer: data });
}
