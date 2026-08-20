# Delight Ventures Website — Phase 3 Contact Messaging

This package prepares a two-way contact workflow:

1. Website visitor submits the **Send Us a Message** form.
2. `contact-message` Edge Function validates and stores the enquiry in `contact_messages`.
3. The team inbox receives a notification email.
4. The visitor receives an automatic acknowledgement with a reference number.
5. Later, an authenticated Delight Hub admin/manager can reply using `reply-contact-message`; the reply is emailed to the client and logged in `contact_replies`.

## Required secrets before deployment
- `RESEND_API_KEY`
- `CONTACT_FROM_EMAIL`
- `CONTACT_INBOX_EMAIL`
- Standard Supabase function environment variables

## Important
The reply function includes a placeholder for the final Delight Hub role check. Do not deploy the reply endpoint for production until the Delight Hub admin/manager authorization rule is connected.

The public website HTML expects `window.DVL_CONTACT_API` to contain the deployed `contact-message` function URL. Without it, the form safely falls back to opening the visitor's email application.
