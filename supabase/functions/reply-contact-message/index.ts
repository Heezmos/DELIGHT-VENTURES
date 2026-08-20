import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", {status:405});
  const auth = req.headers.get("Authorization");
  if (!auth) return Response.json({success:false,detail:"Authentication required"},{status:401});
  const url=Deno.env.get("SUPABASE_URL")!, anon=Deno.env.get("SUPABASE_ANON_KEY")!, service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const {data:{user}}=await userClient.auth.getUser();
  if(!user) return Response.json({success:false,detail:"Invalid session"},{status:401});
  // Before deployment, connect this to Delight Hub admin/manager authorization.
  const {message_id,subject,body}=await req.json();
  const admin=createClient(url,service);
  const {data:msg,error}=await admin.from("contact_messages").select("id,email,name,reference").eq("id",message_id).single();
  if(error||!msg) return Response.json({success:false,detail:"Message not found"},{status:404});
  const resendKey=Deno.env.get("RESEND_API_KEY");
  if(!resendKey) return Response.json({success:false,detail:"Email provider not configured"},{status:503});
  const from=Deno.env.get("CONTACT_FROM_EMAIL") ?? "Delight Ventures <info@delightventures.com>";
  const sent=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${resendKey}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[msg.email],subject,html:`<p>Hello ${msg.name},</p><div>${String(body).replaceAll('<','&lt;').replaceAll('\\n','<br>')}</div><p>Reference: ${msg.reference}</p>`})});
  const provider=await sent.json();
  if(!sent.ok) return Response.json({success:false,detail:"Email delivery failed"},{status:502});
  await admin.from("contact_replies").insert({message_id:msg.id,sender_user_id:user.id,recipient_email:msg.email,subject,body,email_provider_id:provider.id});
  await admin.from("contact_messages").update({status:"replied",replied_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",msg.id);
  return Response.json({success:true});
});
