import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "jsr:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function clean(value: unknown, max = 5000): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  return v ? v.slice(0, max) : null;
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sendEmail(payload: Record<string, unknown>) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return { skipped: true, reason: "RESEND_API_KEY not configured" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Email delivery failed: ${JSON.stringify(data)}`);
  return { skipped: false, data };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!secretKey) return json({ error: "Server configuration error" }, 500);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json();
    const fullName = clean(body.full_name, 120);
    const email = clean(body.email, 320)?.toLowerCase() || null;
    const organization = clean(body.organization, 180);
    const phone = clean(body.phone, 80);
    const serviceInterest = clean(body.service_interest, 160);
    const preferredContactMethod = clean(body.preferred_contact_method, 20);
    const message = clean(body.message, 5000);
    const consent = body.consent === true;
    const honeypot = clean(body.company_website, 300);

    if (honeypot) return json({ ok: true });
    if (!fullName || fullName.length < 2) return json({ error: "Please enter your name." }, 400);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Please enter a valid email address." }, 400);
    if (!message || message.length < 10) return json({ error: "Please enter a message of at least 10 characters." }, 400);
    if (!consent) return json({ error: "Consent is required before submitting." }, 400);
    if (preferredContactMethod && !["email", "phone", "whatsapp"].includes(preferredContactMethod)) {
      return json({ error: "Invalid preferred contact method." }, 400);
    }

    const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ipSource = forwarded || req.headers.get("cf-connecting-ip") || "unknown";
    const ipHash = await sha256(`${ipSource}:${Deno.env.get("CONTACT_RATE_SALT") || "dvl-contact-v1"}`);

    const { data: allowed, error: rateError } = await supabase.rpc("consume_contact_rate_limit", {
      p_ip_hash: ipHash,
      p_limit: 5,
      p_window_minutes: 15,
    });
    if (rateError) throw rateError;
    if (!allowed) return json({ error: "Too many messages. Please try again later." }, 429);

    const { data: contact, error: insertError } = await supabase
      .from("contact_messages")
      .insert({
        full_name: fullName,
        email,
        organization,
        phone,
        service_interest: serviceInterest,
        preferred_contact_method: preferredContactMethod,
        message,
        consent,
        source: "website",
        ip_hash: ipHash,
        user_agent: clean(req.headers.get("user-agent"), 1000),
      })
      .select("id, reference_no, created_at")
      .single();
    if (insertError) throw insertError;

    const fromEmail = Deno.env.get("DVL_FROM_EMAIL") || "Delight Ventures <onboarding@resend.dev>";
    const inboxEmail = Deno.env.get("DVL_INBOX_EMAIL");
    const subject = `New website enquiry ${contact.reference_no}`;

    let adminEmail = { skipped: true as boolean, reason: "DVL_INBOX_EMAIL not configured" } as Record<string, unknown>;
    if (inboxEmail) {
      adminEmail = await sendEmail({
        from: fromEmail,
        to: [inboxEmail],
        reply_to: email,
        subject,
        html: `<h2>New Delight Ventures enquiry</h2><p><strong>Reference:</strong> ${contact.reference_no}</p><p><strong>Name:</strong> ${fullName}</p><p><strong>Email:</strong> ${email}</p><p><strong>Organization:</strong> ${organization || "—"}</p><p><strong>Phone/WhatsApp:</strong> ${phone || "—"}</p><p><strong>Service:</strong> ${serviceInterest || "—"}</p><p><strong>Preferred contact:</strong> ${preferredContactMethod || "email"}</p><hr><p>${message.replace(/\n/g, "<br>")}</p>`,
      });
    }

    const clientEmail = await sendEmail({
      from: fromEmail,
      to: [email],
      subject: `We received your message — ${contact.reference_no}`,
      html: `<h2>Thank you for contacting Delight Ventures</h2><p>Hello ${fullName},</p><p>We have received your message and our team will review it shortly.</p><p><strong>Your enquiry reference is ${contact.reference_no}.</strong></p><p>Please keep this reference if you need to follow up.</p><p>Delight Ventures Limited<br>Helping Businesses Launch, Digitize & Grow.</p>`,
    });

    return json({
      ok: true,
      reference_no: contact.reference_no,
      email_delivery: {
        admin_notification: adminEmail.skipped ? "pending_configuration" : "sent",
        client_acknowledgement: clientEmail.skipped ? "pending_configuration" : "sent",
      },
    }, 201);
  } catch (error) {
    console.error("contact-message error", error);
    return json({ error: "We could not send your message right now. Please try again shortly." }, 500);
  }
});
