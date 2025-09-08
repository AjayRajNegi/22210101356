# URL Shortener (Express Backend + Next.js Frontend)

A minimal URL shortener consisting of:

- Backend: Express microservice with in‑memory storage, redirect, logging middleware.
- Frontend: Next.js App Router

## Project Structure

```
/backend
  index.js           # Express server, POST /shorturls + redirect /:shortcode
  logger.js          # Sends logs to external evaluation-service
  package.json

/frontend
  app/
    layout.tsx       # Base layout
    page.tsx         # Simple form UI (native inputs)
  package.json
```

---

## Prerequisites

- Node.js 18+ (recommended 20+)
- pnpm (recommended) or npm/yarn

---

## Backend

### Install

```bash
cd backend
pnpm install
```

### Configure

Environment variables (optional):

- PORT (default: 3001)
- LOG_SERVICE_URL (default: `http://20.244.56.144/evaluation-service/logs`)
- LOG_API_KEY (default: `dummy-key`)

Create `.env` (optional):

```
PORT=3001
LOG_SERVICE_URL=http://20.244.56.144/evaluation-service/logs
LOG_API_KEY=your-token
```

### Run

```bash
pnpm dev    # nodemon index.js
# or
pnpm start  # node index.js
```

Server runs at `http://localhost:3001` by default.

### API

- POST `/shorturls`

  - Body JSON example:
    ```json
    {
      "url": "https://example.com",
      "validity": 30,
      "shortcode": "mycode"
    }
    ```
  - Response JSON example:
    ```json
    {
      "shortcode": "abc123",
      "url": "https://example.com",
      "validity": 30,
      "expiresAt": 1730000000000,
      "shortUrl": "http://localhost:3001/abc123"
    }
    ```
  - Notes:
    - If the URL is missing a scheme, `http://` is auto‑prepended (e.g., `localhost:3000`).
    - In‑memory only (data is lost on restart).

- GET `/:shortcode`
  - Redirects to the original URL if found and not expired
  - Returns 404 if not found, 410 if expired (and removes entry)

---

## Frontend (Next.js)

### Install

```bash
cd frontend
pnpm install
```

### Configure

- Backend base URL can be configured; default is `http://localhost:3001`.
- Optional `.env.local`:

````

### Run

```bash
pnpm dev
````

Visit `http://localhost:3000`.

### Features

- Up to 5 rows to submit:
  - Long URL (required)
  - Validity (minutes, optional)
  - Preferred shortcode (optional)
- Client-side normalization adds `http://` if missing
- Results show original URL, short URL, and expiry timestamp

---

## Development Notes

- CORS enabled on backend
- Logging middleware posts to external service via `logger.js`
- No persistence layer in this basic version (consider DB/Redis for production)
- Stats endpoint is omitted for now (can be added later)

---

## Scripts Quick Reference

Backend (`backend/`):

- `pnpm dev` – start in watch mode
- `pnpm start` – start once

Frontend (`frontend/`):

- `pnpm dev` – run Next.js dev server

---
