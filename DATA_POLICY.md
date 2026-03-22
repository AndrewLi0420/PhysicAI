# PhysicAI Data Policy (Internal)

## HIPAA Applicability

PhysicAI is **not** subject to HIPAA. HIPAA applies to covered entities (healthcare providers, health plans, healthcare clearinghouses) and their business associates. PhysicAI is a consumer wellness app — it is not a healthcare provider, does not submit insurance claims, and has no covered entity relationship with users.

The product is positioned as "recovery guidance" and "educational information," not clinical diagnosis. This is consistent with how WebMD, symptom checkers, and consumer telehealth apps operate.

> If the business model changes (e.g., B2B to employer health plans or insurance), revisit HIPAA applicability.

## Data Collected

| Data | Identifiability | Retention |
|------|----------------|-----------|
| Injury type, severity grade | Authenticated: identifiable. Guest: pseudonymous (UUID token only). | Indefinite |
| Daily check-in responses (pain score, swelling, weight-bearing) | Authenticated: identifiable. Guest: pseudonymous. | Indefinite |
| Email address | Identifiable (authenticated users only) | Until user requests deletion |
| AI-generated recovery plan | Authenticated: identifiable. Guest: pseudonymous. | Indefinite |
| Assessment flags (decision tree outputs) | Linked to plan | Indefinite |

**Retention policy:** User data is retained indefinitely to support long-term recovery tracking and product improvement. Users may request deletion at any time via [contact method TBD].

## Guest Users

Guest users are identified only by a UUID token stored in their browser URL. No email or name is collected. Guest data is pseudonymous — linkable to a real person only if the user chooses to sign up and convert their session.

## Data Security

- All data stored in Supabase with Row Level Security (RLS) policies enforcing user-scoped access.
- Claude API calls are made server-side (Supabase Edge Function) — no user data passes through the client to the Anthropic API directly.
- Exercise library is static (no user data).

## What We Tell Users

Every recovery plan includes:
- "This is recovery guidance and educational information, not a substitute for medical advice."
- Red-flag escalation criteria: conditions under which users should seek professional care immediately.

## Open Questions Before Launch

- [ ] Confirm legal review of disclaimer language with a healthcare attorney.
- [ ] Define user-facing deletion request mechanism (email? in-app button?).
- [ ] Privacy policy page (public-facing version of this doc) before any user onboards.
