# Readiness

Readiness is a mobile-first government-exam readiness and progress-tracking MVP. It is not positioned as another mock-test product; it gives aspirants a current observed readiness snapshot and a way to return after 7 or 10 days to compare progress.

## Stack

- Next.js App Router, React, TypeScript
- Prisma ORM with PostgreSQL
- Zod validation
- First-party PostgreSQL analytics
- Docker Compose with `app`, `postgres`, and `caddy`

## Local Setup

```bash
cd readiness
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:push
npm run db:seed
npm run admin:create -- admin@example.com 'strong-password-12+'
npm run dev
```

Open `http://localhost:3000/r/demo`.

The seeded physical-poster pilot campaign is available at:

```bash
http://localhost:3000/r/UPSC-AZM-001
```

## Important Scripts

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run questions:pregenerate
npm run test:e2e
docker compose config
```

## Local Docker Redeploy

```bash
docker compose build app
docker compose up -d postgres
docker compose run --rm app npx prisma db push --skip-generate
docker compose run --rm app npm run db:seed
docker compose up -d --force-recreate app
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
curl -I http://localhost:3000/r/UPSC-AZM-001
```

## Feature Flags

- `FEATURE_AI=false`
- `FEATURE_AI_QUESTIONS=false`
- `FEATURE_CURRENT_AFFAIRS=false`
- `FEATURE_WHATSAPP_SAVE=true`
- `WHATSAPP_CLOUD_API_ENABLED=false`
- `FEATURE_CALENDAR=true`
- `FEATURE_CALENDAR_REMINDER=true`
- `FEATURE_PAYMENTS=false`
- `FEATURE_SUBSCRIPTIONS=false`
- `FEATURE_PUBLIC_RESULT_SHARE=true`

## AI Strategy

AI generation happens at question-set level only. Question sets are keyed by exam, stage, subject profile, language, cycle, blueprint version, and prompt version. If AI is disabled or unavailable, approved fallback question sets keep assessments working.

AI question generation is disabled by default for the MVP and generated question sets are not auto-approved by default.

## WhatsApp Strategy

Release 1 uses user-controlled WhatsApp deep links after the result. There is no unofficial WhatsApp automation and no dependency on Meta Business verification.

## Fixed-Cost Deployment

The target deployment is one fixed DigitalOcean Droplet running Caddy, Next.js, and PostgreSQL. There is no autoscaling, managed database, Redis, queue, paid analytics, or automatic infrastructure growth.

## Privacy

The first assessment requires no phone number, email, OTP, password, Aadhaar, address, or sensitive profile data. Private assessment and reminder tokens are opaque and stored as hashes where appropriate.
