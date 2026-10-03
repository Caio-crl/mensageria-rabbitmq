# Notification Service

NestJS monorepo foundation with two independent applications:

- api: HTTP application
- worker: standalone Nest application context

Notification persistence is shared from `libs/notifications`. MySQL schema changes
are applied only through TypeORM migrations; automatic synchronization is disabled.

## Development

Install dependencies with npm install. Run npm run start:dev:api to start the
HTTP application, or npm run start:dev:worker to initialize the worker.
The worker exits after initialization until a consumer is introduced in a
later checkpoint.

Copy `.env.example` to `.env`, then start MySQL with `docker compose up -d --wait mysql`.
The example exposes MySQL on localhost port 3307. Run `npm run migration:run` to
create the `notifications` table. Use `npm run migration:revert` to undo the last
migration. The API needs MySQL running with the migration applied.

`POST /notifications` creates an EMAIL notification and returns HTTP 201 with
`{"id":"uuid","status":"PENDING"}`. The request body contains `recipient`,
`type`, `subject`, and `message`; server-managed fields are not accepted.

Run npm run build, npm run lint, npm run format:check, and npm test to validate
the foundation.
