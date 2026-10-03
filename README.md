# Notification Service

NestJS monorepo foundation with two independent applications:

- api: HTTP application
- worker: standalone Nest application context

Notification persistence is shared from `libs/notifications`. MySQL schema changes
are applied only through TypeORM migrations; automatic synchronization is disabled.

## Development

Install dependencies with npm install. Run npm run start:dev:api to start the
HTTP application and npm run start:dev:worker to start the independent worker.

Copy `.env.example` to `.env`, then start MySQL and RabbitMQ with
`docker compose up -d --wait mysql rabbitmq`. The example exposes MySQL on
localhost port 3307, RabbitMQ AMQP on 5672, and its Management UI on 15672.
Run `npm run migration:run` to create the `notifications` table. Use
`npm run migration:revert` to undo the last migration. Both applications need
MySQL running with the migration applied.

`POST /notifications` creates an EMAIL notification, saves it as PENDING, and
publishes a persistent message to RabbitMQ. After publisher confirm it returns
HTTP 202 with
`{"id":"uuid","status":"PENDING"}`. The request body contains `recipient`,
`type`, `subject`, and `message`; server-managed fields are not accepted.
The durable direct exchange `notifications.exchange` routes
`notification.requested` to the durable queue `notifications.process`. The
message contains `messageId`, `notificationId`, `event`, `version`, and
`occurredAt`, without notification content.

After the POST returns 202 and an id, poll `GET /notifications/:id` to read the
current database status (HTTP 200). For example, after processing:
`{"id":"uuid","type":"EMAIL","recipient":"user@example.com","status":"SENT","createdAt":"2026-10-03T12:00:00.000Z","processedAt":"2026-10-03T12:00:05.000Z"}`.
Before completion, `processedAt` is null. An invalid UUID returns 400; an
unknown valid UUID returns 404.

Publication has a 5000 ms timeout. If it fails, the API returns HTTP 503 while
the database row remains PENDING. This MySQL/RabbitMQ consistency gap is a known
MVP limitation. A publisher confirm timeout can also mean an unknown result:
the broker may receive the message after the API returns 503.

The worker consumes `notifications.process` with prefetch 1 and manual
acknowledgement. Successful processing saves PROCESSING, then SENT and
`processedAt` before ack. The `x-attempt` header starts at 1 (or defaults to 1
for older messages). Fake sender failures allow 3 total attempts: after attempts
1 and 2, the worker saves PENDING with `processedAt = null`, confirms publication
to `notifications.retry`, then acks the original. The durable retry queue uses a
fixed 5000 ms TTL and dead-letters back to `notifications.process`. On attempt 3,
the worker saves FAILED and `processedAt`, then nacks without requeue into
`notifications.dlq`. Set `FAKE_EMAIL_FORCE_FAILURE=true` locally to exercise
this path deterministically; the default fake sender succeeds without external
calls.

SENT redelivery is acked without another send. FAILED final redelivery is sent
again to the DLQ; PROCESSING can be reprocessed. Invalid messages and missing
Notifications go straight to the DLQ. Database or retry publication failures
use `nack(requeue=true)` exceptionally, without ack. Delivery is at least once,
so duplicates remain possible around connection or confirm failures. This MVP
declares DLX and TTL as queue arguments. RabbitMQ policies are preferable in
production when operators need to change these settings without recreating
queues. An existing local `notifications.process` queue without DLX arguments
must be replaced only after confirming it has zero Ready and Unacked messages.

## Delivery semantics and idempotency

This flow uses at-least-once delivery: RabbitMQ redelivery is expected after a
worker or connection failure. The persisted Notification status is the MVP's
idempotency guard. Once SENT is saved, another delivery is acked without sending
again. A final FAILED delivery is rejected into the DLQ without sending again.
PENDING and PROCESSING remain processable because a worker can die after saving
PROCESSING but before completing the work.

One crash window remains: an external effect can succeed, then saving SENT can
fail. Redelivery can run the effect again while the row remains PROCESSING. A real
provider's idempotency key, based on a stable notificationId or messageId, could
reduce this risk in a future integration. Another window exists after retry
publisher confirm but before ack of the original: both the confirmed retry and
the redelivered original can exist, with the same messageId. Neither window
provides exactly-once processing. The current prefetch of 1 limits this worker's
concurrency; multiple concurrent consumers would need additional protection
against races on the same Notification, outside this MVP.

Run npm run build, npm run lint, npm run format:check, and npm test to validate
the foundation.
