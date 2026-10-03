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

Copy `.env.example` to `.env`, then start MySQL and RabbitMQ with
`docker compose up -d --wait mysql rabbitmq`. The example exposes MySQL on
localhost port 3307, RabbitMQ AMQP on 5672, and its Management UI on 15672.
Run `npm run migration:run` to
create the `notifications` table. Use `npm run migration:revert` to undo the last
migration. The API needs MySQL running with the migration applied.

`POST /notifications` creates an EMAIL notification, saves it as PENDING, and
publishes a persistent message to RabbitMQ. After publisher confirm it returns
HTTP 202 with
`{"id":"uuid","status":"PENDING"}`. The request body contains `recipient`,
`type`, `subject`, and `message`; server-managed fields are not accepted.
The durable direct exchange `notifications.exchange` routes
`notification.requested` to the durable queue `notifications.process`. The
message contains `messageId`, `notificationId`, `event`, `version`, and
`occurredAt`, without notification content.

Publication has a 5000 ms timeout. If it fails, the API returns HTTP 503 while
the database row remains PENDING. This MySQL/RabbitMQ consistency gap is a known
MVP limitation. A publisher confirm timeout can also mean an unknown result:
the broker may receive the message after the API returns 503.

Run npm run build, npm run lint, npm run format:check, and npm test to validate
the foundation.
