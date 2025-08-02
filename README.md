# 📊 Event Analytics Platform (Node.js + MongoDB)

A modular backend system for ingesting and analyzing event data using Express.js, MongoDB, and Redis. Features include funnel analytics, user retention, custom metrics, rate limiting, API key auth, and OpenAPI documentation.

### ✨ Features
- ✅ Event ingestion (via queue)
- ✅ Funnel analytics
- ✅ User journey tracking
- ✅ Cohort retention
- ✅ Event metrics with time bucketing
- ✅ API key authentication
- ✅ Per-key rate limiting
- ✅ Redis-based caching
- ✅ WebSocket for live event counts
- ✅ OpenAPI documentation
- ✅ Modular and testable TypeScript code

### 🏗 Architecture & Design
```css
Client
  ↓
[Express API Gateway]
  ↓
[Redis Queue]  ←→  [Event Processor Worker]
  ↓
[MongoDB]
```
- MongoDB: Stores raw events; optimized via indexes.
- Redis: Used for event queues and caching analytics results.
- BullMQ: For async ingestion of high-throughput events.
- Swagger/OpenAPI: For static API documentation.
- Rate Limiting: Per API key using express-rate-limit.
- Logger: Winston-based structured logging.
- Multi-tenancy: orgId and projectId required in all analytics requests.

### 🚀 Local Setup
1. Prerequisites: 
- Docker + Docker Compose
- Node.js (if running locally)
- Redis and MongoDB

2. Run with Docker Compose
```bash
docker-compose up --build
```
Services:   
- event-backend on `http://localhost:8080`
- MongoDB on `mongodb://localhost:27017/analyticsdb`
- Redis on `redis://localhost:6379`

3. Run Locally (Without Docker)
```bash
# Install dependencies
npm install

# Start in dev mode
npm run dev
```

### 📂 Project Structure
```bash
src/
├── analytics/              # Funnel, retention, metrics logic
├── events/                 # Event ingestion controller and schema
├── middleware/             # Auth, tenant validation, rate limiter
├── queue/                  # BullMQ queue setup and worker
├── utils/                  # Logger, Redis client, caching helpers
├── config/                 # Configuration & env
└── main.ts                 # App entrypoint
```

### 📬 API Usage
All requests must include x-api-key in headers.

#### Ingest Events
```
POST /events
Headers: { x-api-key: YOUR_KEY }

Body:
{
  "events": [
    {
      "orgId" : "org1",
      "projectId" : "proj1"
      "userId": "user123",
      "event": "signup",
      "timestamp": "2025-08-01T12:00:00Z",
      "properties": {
        "platform": "web"
      }
    }
  ]
}
```

#### Funnel Analytics
```
POST /analytics/funnels
Headers: { x-api-key: YOUR_KEY }

Body:
{
  "orgId": "org1",
  "projectId": "proj1",
  "steps": [
    { "event": "signup" },
    { "event": "onboarding" },
    { "event": "purchase" }
  ],
  "startDate": "2025-07-01",
  "endDate": "2025-08-01"
}
```

#### Retention
```
GET /analytics/retention?cohort=signup&days=7
Headers: { x-api-key: YOUR_KEY }

Body:
{
    "orgId" : "org1",
    "projectId" : "proj1"
}
```

#### Metrics
```
GET /analytics/metrics?event=signup&interval=daily
Headers: { x-api-key: YOUR_KEY }

Body:
{
    "orgId" : "org1",
    "projectId" : "proj1"
}
```

#### User Journey
```
GET /analytics/users/:userId/journey
Headers: { x-api-key: YOUR_KEY }

Body:
{
    "orgId" : "org1",
    "projectId" : "proj1"
}
```

### Seed Events (Example)
```bash
npx ts-node scripts/seed-events.ts
```

### 🔐 API Key Auth
- Every request must include a valid `x-api-key`.
- Keys are stored in-memory in `api-key.store.ts.`

### 🧱 Caching
- Redis is used to cache analytics results (funnel, metrics, retention) for `5 minutes`.
- You can customize TTLs in `analytics.service.ts`.

### 📦 Docker Commands
Build image manually:

```bash
docker build -t event-backend .
```
Run locally

```bash
docker run -p 8080:8080 --env-file .env event-backend
```