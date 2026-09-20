# Readiness Architecture

Readiness is a fixed-cost modular monolith for competitive-exam readiness diagnostics. The release-1 path is intentionally short: scan, choose exam, answer 10 questions, see a deterministic readiness snapshot, save a next checkpoint, and return for comparison.

## High-Level Flow

```mermaid
flowchart TD
  QR["Physical QR"] --> Campaign["Campaign Router /r/{campaign}"]
  Campaign --> Onboarding["Exam, Stage, Language"]
  Onboarding --> Assessment["Assessment Service"]
  Assessment --> Cache["Question Set Cache"]
  Cache --> Scoring["Deterministic Scoring"]
  Cache -. miss .-> AI["AI Generator with Budget Guard"]
  AI --> Validate["Validation Pipeline"]
  Validate --> Cache
  Scoring --> Result["Readiness Report"]
  Result --> Checkpoint["7/10 Day Checkpoint"]
  Checkpoint --> Return["Return Assessment"]
  Return --> Progress["Progress Comparison"]
```

## Link Classes

```mermaid
flowchart TD
  R["/r/{campaignCode}"] --> NewVisitor["New acquisition journey"]
  A["/a/{privateToken}"] --> Resume["Resume existing assessment"]
  S["/s/{publicShareToken}"] --> Referral["Share referral"]
  Referral --> NewVisitor
  N["/next/{signedToken}"] --> Eligibility["Eligibility check"]
  Eligibility --> NextAttempt["Next assessment"]
```

Private assessment tokens are random opaque values stored only as hashes. A started assessment also requires a browser ownership cookie before answers or results can be modified.

## WhatsApp

```mermaid
flowchart TD
  Result["Result page"] --> Save["Save on WhatsApp"]
  Save --> UserShare["User-controlled wa.me deep link"]
  Future["Future scheduler"] -. disabled .-> Meta["Meta Cloud API template"]
```

Release 1 does not need Meta Business verification, templates, webhooks, or outbound WhatsApp automation.

## AI

AI generates reusable question sets, not per-student content.

```mermaid
flowchart TD
  Request["Assessment requested"] --> Cache["Cache lookup"]
  Cache -->|hit| Use["Use approved set"]
  Cache -->|miss| Guard["AI budget guard"]
  Guard --> Lock["DB generation lock planned"]
  Lock --> Generate["Generate"]
  Generate --> Validate["Schema and quality validation"]
  Validate --> Persist["Persist approved set"]
  Persist --> Use
  Guard -->|blocked| Fallback["Fallback seed set"]
  Validate -->|failed| Fallback
```

The current implementation includes cache keys, validation, budget checks, AI usage records, and fallback behavior. A production AI provider adapter can be added behind the existing `LlmProvider` interface.

## Deployment

```mermaid
flowchart TD
  Internet --> Caddy
  Caddy --> App["Next.js app"]
  App --> Postgres["PostgreSQL"]
```

No autoscaling, no managed database, no Redis, no queue, and no third-party analytics are required.
