# Delight Hub — Internal Operating System

## Access model

Delight Hub is a **private internal operating system** for authorized Delight Ventures team members. It is not a public product page and must not be exposed through the company website navigation.

## Core modules

- Dashboard
- CRM / Leads
- Clients
- Projects
- Tasks
- Services
- Invoices
- Payments
- Reports
- Analytics
- Notifications
- Users & Roles
- Settings

## Website integration

Website enquiries flow into the same Supabase platform and will later appear inside Delight Hub as leads and messages.

```text
Public Website
   ↓
contact-message Edge Function
   ↓
contact_messages
   ↓
website_leads
   ↓
Delight Hub CRM / Enquiries
```

## DVAI

DVAI will be integrated inside Delight Hub, not on the public website. Planned functions include:

- business assistant
- business intelligence support
- project assistance
- report generation
- client and enquiry analysis
- document assistance

## AI Executive Council

The AI Executive Council will be an internal DVAI capability for structured strategic decision support across:

- Strategy & Growth
- Finance & Investment
- Technology & Innovation
- Business Intelligence
- Marketing & Brand
- Operations

## Backend direction

Delight Hub will share the **Delight Ventures Platform** Supabase project so website leads can become CRM records without duplicating data.

Before implementation, the Hub will receive a complete specification covering authentication, user roles, permissions, RLS policies, database schema, API design, workflows, business rules and technical specifications.
