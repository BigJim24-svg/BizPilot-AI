import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, getBusinessIdForRequest } from "@/lib/supabase";
import { scoreLead, temperatureFromScore, explainScore } from "@/lib/scoring";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const businessId = await getBusinessIdForRequest(token);
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin.from("leads").select("*, customers(name, email)").eq("business_id", businessId).order("score", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: (data ?? []).map(l => ({ ...l, temperature: temperatureFromScore(l.score) })) });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const businessId = await getBusinessIdForRequest(token);
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { customerId, value, source, signals } = body;
  if (!signals) return NextResponse.json({ error: "signals are required" }, { status: 400 });
  const score = scoreLead(signals);
  const reason = explainScore(signals);
  const { data, error } = await supabaseAdmin.from("leads").insert({ business_id: businessId, customer_id: customerId || null, value: Number(value || 0), source: source || "manual", score, probability: score, last_interaction: new Date().toISOString() }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: { ...data, temperature: temperatureFromScore(score), reason } });
}
