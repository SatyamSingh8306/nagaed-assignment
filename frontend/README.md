# React frontend

Node.js 22+. From this directory:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Open http://localhost:5173. Run the Node API on port 3000 and FastAPI on port 8000.
Vite proxies API calls in development; Nginx proxies them in Docker. The app uses
relative same-origin URLs and needs no browser credentials or API keys.

```powershell
npm run build
npm run format
npm run format:check
```

Register -> sign in -> fetch protected profile -> dashboard. All HTTP requests
live in `src/api.js`; forms display API errors and disable submission while busy.
The JWT is stored in sessionStorage for the tab and cleared on sign-out. This
assessment keeps login state in memory; refreshing requires signing in again.
The password is cleared after registration/login and is never persisted.

Username suggestions are optional. Enter comma-separated interests and select a
suggestion to fill the username field. A missing Groq key leaves normal account
creation available. Labels, keyboard focus, error announcements and mobile layout
are included. No external fonts or frontend secrets are required.
