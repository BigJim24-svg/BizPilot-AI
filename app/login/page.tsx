"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [name,setName] = useState("");
  const [signup,setSignup] = useState(false);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({data}) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      if (signup) {
        const {data,error} = await supabaseClient.auth.signUp({
          email,password,options:{data:{name,business_name:name ? `${name}'s Business` : "My Business"}}
        });
        if (error) throw error;
        if (data.session) router.replace("/dashboard");
        else setError("Account created. Check your email if email confirmation is enabled, then sign in.");
      } else {
        const {error} = await supabaseClient.auth.signInWithPassword({email,password});
        if (error) throw error;
        router.replace("/dashboard");
      }
    } catch (err: any) { setError(err.message || "Something went wrong"); }
    finally { setBusy(false); }
  }

  return <main className="center"><form className="card auth" onSubmit={submit}>
    <div className="brand">BizPilot AI</div><p className="muted">Your AI business copilot.</p>
    {signup && <div className="field"><label>Your name</label><input value={name} onChange={e=>setName(e.target.value)} required /></div>}
    <div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
    <div className="field"><label>Password</label><input type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} required /></div>
    {error && <p className="error">{error}</p>}
    <button className="btn" disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Sign in"}</button>
    <button type="button" className="btn ghost" onClick={()=>{setSignup(!signup);setError("")}}>{signup ? "Already have an account? Sign in" : "New here? Create an account"}</button>
  </form></main>;
}
