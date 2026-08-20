# Delight Ventures Limited

Official repository for the Delight Ventures public website and the private Delight Hub platform.

## Current production scope

### Public website
- Premium Delight Ventures website (`index.html`)
- BUILD, GROW and POWER capability pillars
- About, process, case studies, insights, sectors and contact sections
- Responsive desktop/tablet/mobile layout
- Live contact form connected to Supabase Edge Functions

### Website backend
Supabase project: **Delight Ventures Platform**

Project ref: `ialobcshxbesmncngixx`

The website backend includes:
- `contact_messages`
- `contact_replies`
- `website_leads`
- `subscribers`
- `website_settings`
- `contact_submission_limits`
- automatic lead creation
- enquiry reference numbers
- rate limiting and honeypot protection
- `contact-message` Edge Function
- Resend transactional-email integration (requires secrets before real email delivery)

## Repository structure

```text
.
├── index.html
├── dvl-rebranded.html
├── docs/
├── supabase/
│   ├── config.toml
│   ├── functions/
│   │   ├── contact-message/
│   │   └── reply-contact-message/
│   └── migrations/
├── .env.example
└── vercel.json
```

## Required production secrets

Set these in Supabase Edge Function Secrets — never commit their real values to GitHub:

```text
RESEND_API_KEY=
DVL_INBOX_EMAIL=
DVL_FROM_EMAIL=
CONTACT_RATE_SALT=
```

Recommended values after the Delight Ventures domain is ready:

```text
DVL_INBOX_EMAIL=info@delightventures.com
DVL_FROM_EMAIL=Delight Ventures <noreply@delightventures.com>
```

## Deployment

The website is configured as a static Vercel deployment. Connect this repository to Vercel and deploy from the `main` branch.

A Vercel-hosted address can be used first (for example `delight-ventures.vercel.app`), then a custom Delight Ventures domain can be connected later.

## Delight Hub

Delight Hub is a separate **private internal operating system**. It is not advertised or exposed on the public website. Its architecture and planned modules are documented under `docs/DELIGHT-HUB.md`.
