# Notification Service

NestJS monorepo foundation with two independent applications:

- api: HTTP application
- worker: standalone Nest application context

## Development

Install dependencies with npm install. Run npm run start:dev:api to start the
HTTP application, or npm run start:dev:worker to initialize the worker.
The worker exits after initialization until a consumer is introduced in a
later checkpoint.

Run npm run build, npm run lint, npm run format:check, and npm test to validate
the foundation.
