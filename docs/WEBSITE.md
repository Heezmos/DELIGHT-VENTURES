# Delight Ventures Website

## Purpose

The public website is the customer-facing digital presence of Delight Ventures Limited. It presents the company, its capabilities, selected work, insights and contact channels.

It must **not expose or advertise Delight Hub, DVAI or the AI Executive Council**, because those are internal operating capabilities.

## Public information architecture

1. Hero
2. About
3. Capabilities
   - BUILD — Digital Products & Software
   - GROW — Data, AI & Digital Growth
   - POWER — Industry Platforms & Business Systems
4. How We Work
5. Case Studies
6. Why Delight Ventures
7. Insights
8. Who We Serve
9. Call to Action
10. Contact
11. Footer

## Contact architecture

```text
Visitor
  ↓
Website contact form
  ↓
Supabase Edge Function: contact-message
  ↓
Validation + honeypot + rate limit
  ↓
contact_messages
  ↓
Database trigger
  ↓
website_leads
  ↓
Resend email notification / acknowledgement
```

## Contact API

Endpoint:

```text
POST https://ialobcshxbesmncngixx.supabase.co/functions/v1/contact-message
```

Request body:

```json
{
  "full_name": "Client Name",
  "email": "client@example.com",
  "organization": "Example Ltd",
  "phone": "+232...",
  "service_interest": "Digital Products & Software",
  "preferred_contact_method": "email",
  "message": "Project enquiry...",
  "company_website": "",
  "consent": true
}
```

Successful response:

```json
{
  "ok": true,
  "reference_no": "DVL-XXXXXXXXXX",
  "email_delivery": {
    "admin_notification": "sent",
    "client_acknowledgement": "sent"
  }
}
```

## Production email secrets

Real values belong in Supabase Edge Function Secrets, never in GitHub.

- `RESEND_API_KEY`
- `DVL_INBOX_EMAIL`
- `DVL_FROM_EMAIL`
- `CONTACT_RATE_SALT`

## Deployment

Deployment target: Vercel.

The repository root is a static website with `index.html` as the production entry point. `vercel.json` contains the initial deployment and security-header configuration.
