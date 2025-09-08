# URL Shortener (Express Backend + Next.js Frontend)

A minimal URL shortener consisting of:

- Backend: Express microservice with in‑memory storage, redirect, logging middleware.
- Frontend: Next.js App Router UI to create shortened links of upto 5 urls.

---

## Project Structure

```
/backend
  index.js           # Express server, POST /shorturls + redirect
/:shortcode
  logger.js          # Sends logs to external evaluation-service
  package.json

/frontend
  app/
    layout.tsx       # Base layout
    page.tsx         # Simple form UI (native inputs)
  package.json
```

### Configure

Environment variables (optional):

- PORT (default: 3001)
- LOG_SERVICE_URL

- Frontend is running at PORT: 3000
- Backend is running at PORT:3001
