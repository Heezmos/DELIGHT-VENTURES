import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json = (body: unknown, status=200) => new Response(JSON.stringify(body), {status, headers:{...cors,"Content-Type":"application/json"}});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", {headers:cors});
  if (req.method !== "POST") return json({success:false, detail:"Method not allowed"},405);
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const message = String(body.message ?? "").trim();
    if (body.website) return json({success:true});
    if (!name || !email || !message || message.length > 5000) return json({success:false,detail:"Invalid submission"},400);
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return json({success:false,detail:"Invalid email"},400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const reference = `DVL-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
    const { error } = await supabase.from("contact_messages").insert({
      reference, name, email,
      company:String(body.company ?? "").trim() || null,
      phone:String(body.phone ?? "").trim() || null,
      service:String(body.service ?? "General Inquiry").trim(),
      preferred_contact:String(body.preferred_contact ?? "Email").trim(),
      message, source:String(body.source ?? "website").trim(),
      user_agent:req.headers.get("user-agent")
    });
    if (error) throw error;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("CONTACT_FROM_EMAIL") ?? "Delight Ventures <noreply@delightventures.com>";
    const inbox = Deno.env.get("CONTACT_INBOX_EMAIL") ?? "info@delightventures.com";
    if (resendKey) {
      const send = async (payload: unknown) => fetch("https://api.resend.com/emails", {method:"POST",headers:{Authorization:`Bearer ${resendKey}`,"Content-Type":"application/json"},body:JSON.stringify(payload)});
      await Promise.allSettled([
        send({from,to:[inbox],reply_to:email,subject:`New website enquiry — ${reference}`,html:`<h2>New Delight Ventures enquiry</h2><p><strong>${name}</strong> (${email})</p><p><strong>Service:</strong> ${body.service ?? 'General Inquiry'}</p><p>${message.replaceAll('<','&lt;')}</p><p>Reference: ${reference}</p>`}),
        send({from,to:[email],subject:`We received your message — ${reference}`,html:`<p>Hello ${name},</p><p>Thank you for contacting Delight Ventures Limited. We have received your enquiry and a team member will review it.</p><p><strong>Reference:</strong> ${reference}</p><p>Build. Grow. Power. Tomorrow.</p>`})
      ]);
    }
    return json({success:true, reference},201);
  } catch (e) {
    console.error(e);
    return json({success:false,detail:"Unable to process message"},500);
  }
});
