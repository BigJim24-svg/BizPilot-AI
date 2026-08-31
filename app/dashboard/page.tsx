"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase";

type Row = any;

export default function Dashboard() {
  const router=useRouter();
  const [loading,setLoading]=useState(true),[email,setEmail]=useState(""),[customers,setCustomers]=useState<Row[]>([]),[leads,setLeads]=useState<Row[]>([]),[sales,setSales]=useState<Row[]>([]),[expenses,setExpenses]=useState<Row[]>([]),[question,setQuestion]=useState(""),[answer,setAnswer]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");

  useEffect(()=>{(async()=>{
    const {data:{session}}=await supabaseClient.auth.getSession();
    if(!session){router.replace("/login");return;}
    setEmail(session.user.email||"");
    const h={Authorization:`Bearer ${session.access_token}`};
    try {
      const [c,l,s,e]=await Promise.all([fetch("/api/customers",{headers:h}),fetch("/api/leads",{headers:h}),fetch("/api/sales",{headers:h}),fetch("/api/expenses",{headers:h})]);
      const payloads=await Promise.all([c.json(),l.json(),s.json(),e.json()]);
      if([c,l,s,e].some(r=>r.status===401)) throw new Error("Your session expired. Please sign in again.");
      if([c,l,s,e].some(r=>!r.ok)) throw new Error(payloads.find(x=>x.error)?.error||"Could not load business data.");
      setCustomers(payloads[0].customers||[]);setLeads(payloads[1].leads||[]);setSales(payloads[2].sales||[]);setExpenses(payloads[3].expenses||[]);
    } catch(err:any){setError(err.message||"Could not load data.");}
    setLoading(false);
  })()},[router]);

  const revenue=sales.reduce((n,x)=>n+Number(x.amount||0),0), costs=expenses.reduce((n,x)=>n+Number(x.amount||0),0), pipeline=leads.reduce((n,x)=>n+Number(x.value||0),0);
  async function ask(){if(!question.trim()||busy)return;setBusy(true);setAnswer("");try{const {data:{session}}=await supabaseClient.auth.getSession();if(!session){router.replace("/login");return;}const r=await fetch("/api/ai/copilot",{method:"POST",headers:{Authorization:`Bearer ${session.access_token}`,"Content-Type":"application/json"},body:JSON.stringify({question})});const d=await r.json();setAnswer(d.answer||d.error||"No answer returned.");}catch(err:any){setAnswer(err.message||"AI request failed.");}finally{setBusy(false);}}
  async function signOut(){await supabaseClient.auth.signOut();router.replace("/login");}
  if(loading)return <main className="center"><div>Loading BizPilot…</div></main>;
  return <main className="container"><div className="topbar"><div><div className="brand">BizPilot AI</div><div className="muted">{email}</div></div><button className="btn secondary" onClick={signOut}>Sign out</button></div>
    {error&&<div className="card"><div className="error">{error}</div><p className="muted">If this is your first login, run the latest <code>schema.sql</code> in Supabase.</p></div>}
    <div className="grid"><div className="card stat"><h3>Total sales</h3><strong>${revenue.toLocaleString()}</strong></div><div className="card stat"><h3>Expenses</h3><strong>${costs.toLocaleString()}</strong></div><div className="card stat"><h3>Customers</h3><strong>{customers.length}</strong></div><div className="card stat"><h3>Lead pipeline</h3><strong>${pipeline.toLocaleString()}</strong></div></div>
    <div className="two section"><section className="card"><h2>Top leads</h2>{leads.slice(0,8).map((l,i)=><div className="row" key={l.id||i}><span>{l.customers?.name||"Lead"}</span><span className="pill">{l.score} • {l.temperature}</span></div>)}{!leads.length&&<p className="muted">No leads yet. Import your business data to get started.</p>}</section><section className="card"><h2>Recent sales</h2>{sales.slice(0,8).map((s,i)=><div className="row" key={s.id||i}><span>{s.product||"Sale"} <small className="muted">{s.sale_date}</small></span><strong>${Number(s.amount||0).toLocaleString()}</strong></div>)}{!sales.length&&<p className="muted">No sales yet.</p>}</section></div>
    <section className="card section"><h2>Ask BizPilot</h2><p className="muted">Ask about your sales, expenses, customers, or leads.</p><div className="chat"><input value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")ask()}} placeholder="Why are my sales changing?"/><button className="btn" onClick={ask} disabled={busy}>{busy?"Thinking…":"Ask"}</button></div>{answer&&<div className="answer">{answer}</div>}</section>
  </main>;
}
