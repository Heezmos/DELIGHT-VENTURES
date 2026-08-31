# Delight Ventures Limited

Official repository for the Delight Ventures public website and supporting website backend.

**Positioning:** Helping Businesses Launch, Digitize & Grow.

## Current production scope

### Public website
- Premium Delight Ventures website (`index.html`)
- Three current service divisions:
  - Business & Compliance Services
  - Digital Solutions & Systems
  - Creative Media Services
- Service-level exploration and enquiry prefilling for the exact services offered by DVL
- About, process, case studies, insights, sectors and contact sections
- Responsive desktop/tablet/mobile layout
- Live contact form connected to the Supabase `contact-message` Edge Function

`index.html` is the production source of truth for the public website. `dvl-rebranded.html` is retained as a legacy design/reference file and should not be treated as the current production page.

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
- `reply-contact-message` Edge Function
- Resend transactional-email integration (requires production secrets for real email delivery)

## Repository structure

```text
.
├── index.html                 # current production public website
├── dvl-rebranded.html         # legacy/reference website file
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

The repository only contains example/non-secret values. Confirm the real inbox and sender identities in Supabase before production email delivery is relied upon.

## Deployment

The public website is static and can be deployed from `main` to Vercel. GitHub Pages is also configured from `main` and provides a deployment of the public site.

Production changes should be made against `main` through a short-lived feature branch and should not leave temporary transformation workflows in the production branch.

## Delight Hub

Delight Hub is a separate private internal operating-system concept. It must not be advertised or exposed as part of the public website unless DVL explicitly decides to launch it publicly. Its architecture notes are documented under `docs/DELIGHT-HUB.md`.
