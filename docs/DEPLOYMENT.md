# Deployment

## Server

1. Create one DigitalOcean Basic Droplet in BLR1, Ubuntu LTS, 1 vCPU / 2 GB RAM.
2. Add your SSH key.
3. Open only ports 22, 80, and 443 in the DigitalOcean firewall.
4. Install Docker and the Docker Compose plugin.
5. Point DNS `A` record for `APP_DOMAIN` to the droplet IP.

## Environment

Copy `.env.example` to `.env` and set:

- `APP_DOMAIN`
- `APP_BASE_URL`
- `POSTGRES_PASSWORD`
- `SESSION_SECRET`
- `TOKEN_SIGNING_SECRET`
- `ADMIN_SESSION_SECRET`
- AI provider values only if AI generation is enabled

Keep `WHATSAPP_CLOUD_API_ENABLED=false`, `FEATURE_PAYMENTS=false`, and `FEATURE_SUBSCRIPTIONS=false` for release 1.

## First Deploy

```bash
npm install
docker compose build
docker compose run --rm app npx prisma migrate deploy
docker compose run --rm app npm run db:seed
docker compose up -d
APP_BASE_URL=https://your-domain.example ./scripts/health-check.sh
docker compose run --rm app npm run admin:create -- admin@example.com 'strong-password-12+'
```

## Updates

```bash
git pull
./scripts/deploy.sh
```

The deploy script does not destroy the database.

## Backups

Run daily from cron:

```bash
DATABASE_URL='postgresql://readiness:password@localhost:5432/readiness?schema=public' ./scripts/backup.sh
```

Retention is 7 daily and 4 weekly files in `backups/`.

Restore:

```bash
DATABASE_URL='postgresql://readiness:password@localhost:5432/readiness?schema=public' ./scripts/restore.sh backups/daily/readiness-YYYYMMDD-HHMMSS.sql.gz
```

Test restore on a non-production database before using it on production.

## Monitoring

Use:

```bash
docker compose ps
docker compose logs --tail=100 app
df -h
free -m
```

If capacity becomes insufficient, resize the VM manually. The application must not create additional infrastructure automatically.

## Rollback

1. Keep the previous image or git tag.
2. Check the migration history before rollback.
3. Restore database backup only when data compatibility requires it.
4. Start containers and run health checks.
