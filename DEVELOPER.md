# Developer guide

This guide covers installing, configuring, building, running, and maintaining the
NagaEd assignment. Commands use **Windows PowerShell**, unless stated otherwise.
Run commands from the repository root except where a section changes directory.

## 1. Prerequisites

For the complete Docker setup:

- Docker Desktop, running with Linux containers and Docker Compose v2.
- Internet access for the first image/dependency download and live Groq requests.
- A Groq API key for username suggestions.
- Python to run the smoke test locally, or use the container alternative below.

For development without Docker, also install Node.js 22, Python 3.12, and MySQL 8.4.
Python 3.12 matches the AI Docker image; use it for consistent dependency behavior.

```powershell
docker version
docker compose version
# Needed only for local development:
node --version
npm --version
py -3.12 --version
mysql --version
```

## 2. Environment files

### Docker: use the root .env

Create the file only if it does not already exist. This preserves an existing key
and database credentials:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

| Variable | Purpose |
| --- | --- |
| `DB_NAME` | Database created on the first MySQL startup. |
| `DB_USER` | Application database user, distinct from root. |
| `DB_PASSWORD` | Password for the application database user. |
| `DB_ROOT_PASSWORD` | MySQL administrator password. |
| `JWT_SECRET` | Signing secret, at least 32 characters; use a random value. |
| `GROQ_API_KEY` | Your Groq key. Empty disables live username suggestions. |
| `GROQ_MODEL` | Set to `openai/gpt-oss-120b`. |
| `WEB_PORT` | Published web port; defaults to `8080`. |

Generate a secret locally and paste the output into `JWT_SECRET`:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

The example database/JWT values work for local evaluation. Use unique random
values for deployment. Do not commit `.env`, paste keys into logs, or put secrets
in frontend code. Environment examples are safe to commit; real environment files
are excluded from Git and submission packaging.

Compose reads the **root** `.env` and injects the variables listed under each
service's `environment`. It does not read `backend/.env` or `ai-service/.env`.
`DB_HOST=db` and the trusted-proxy setting are supplied by Compose.

### Local development: use service-specific files

```powershell
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (-not (Test-Path ai-service/.env)) { Copy-Item ai-service/.env.example ai-service/.env }
if (-not (Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
```

- `backend/.env`: use your local MySQL credentials and `DB_HOST=localhost`.
  Keep `TRUST_PROXY_HOPS=0` when connecting directly to the Node server.
- `ai-service/.env`: set `GROQ_API_KEY` and `GROQ_MODEL=openai/gpt-oss-120b`.
  Optional settings are `GROQ_TIMEOUT_SECONDS` (default 8, maximum 10) and
  `LOG_LEVEL` (default `INFO`). These two optional settings currently apply to
  local Python execution; Compose does not forward them.
- `frontend/.env`: no values are required. API URLs are relative, and the Vite
  development proxy is configured in `frontend/vite.config.js`.

## 3. Build and start the complete application

```powershell
# Validate without printing resolved secret values:
docker compose config --quiet
# Build application images:
docker compose build
# Create/start containers and wait for health checks:
docker compose up -d --wait
docker compose ps
```

Alternatively, build and start in one command:

```powershell
docker compose up --build -d --wait
```

The first build can take several minutes. MySQL initializes its database, user,
and schema automatically on the first startup of a new data volume.

| URL | Purpose |
| --- | --- |
| http://localhost:8080 | React application. |
| http://localhost:8080/docs | FastAPI Swagger UI, including live request testing. |
| http://localhost:8080/openapi.json | FastAPI API schema. |
| http://localhost:8080/health | Nginx health endpoint only. |

If `WEB_PORT` is changed, replace `8080` in browser and smoke-test URLs.
Only Nginx publishes a host port. Inside Docker, it uses `api:3000` and `ai:8000`;
the API connects to `db:3306`. Do not change these service names to localhost.

### Rebuild after changes

| Changed files | Command from root |
| --- | --- |
| Express source or dependencies | `docker compose up -d --build api` |
| Python source or dependencies | `docker compose up -d --build ai` |
| React source or Nginx configuration | `docker compose up -d --build web` |
| Root Groq key/model only | `docker compose up -d --force-recreate ai` |
| Root JWT secret only | `docker compose up -d --force-recreate api` |
| Published web port | `docker compose up -d --force-recreate web` |

A plain `docker compose restart` does not load changed environment variables.
Changing the JWT secret invalidates existing access tokens; users must sign in
again. Changing MySQL passwords in `.env` does not change an existing MySQL user.

## 4. Check that it works

### Automated integration smoke test

With the stack running:

```powershell
python scripts/smoke-test.py
# For a different published port:
python scripts/smoke-test.py http://localhost:8090
```

Without local Python, stream the script into the AI container using PowerShell:

```powershell
Get-Content -Raw scripts/smoke-test.py | docker compose exec -T ai python - http://web:8080
```

The test creates one account with a random email. It checks database registration,
duplicate email rejection, login, JWT protection, profile ownership, OpenAPI, and
invalid AI input. It prints `PASS` when those checks succeed. It does not test
browser rendering or call Groq.

### Manual browser check

1. Open the application and create an account with a new email address.
2. Sign in; confirm the dashboard shows the correct username, email, and address.
3. Sign out, then check incorrect credentials and duplicate registration errors.
4. On registration, expand username inspiration and enter `music, science`.
5. Request suggestions; confirm three names appear and selecting one fills the
   username field. This requires a valid Groq key and access to the selected model.
6. Open `/docs` and confirm Swagger renders and can send a suggestion request.

Login state is kept in memory; refreshing currently requires signing in again.
The JWT is stored in tab-scoped sessionStorage and cleared on sign-out.

## 5. Run services locally

### MySQL

Use a separate local MySQL installation. The Compose database does not expose a
host port. Connect as your local MySQL administrator:

```powershell
mysql -u root -p
```

In the MySQL client, create a development database and application user. Replace
the password placeholder below with the value you put in `backend/.env`:

```sql
CREATE DATABASE IF NOT EXISTS nagaed CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nagaed_app'@'localhost' IDENTIFIED BY '<your-local-db-password>';
GRANT SELECT, INSERT ON nagaed.* TO 'nagaed_app'@'localhost';
USE nagaed;
SOURCE D:/assignment-job/nagaed/backend/database/001-users.sql;
```

Adjust the absolute schema path if you cloned elsewhere. Run `SOURCE` as the
administrator so the application user does not need schema-changing privileges.
If the user already exists, update its password explicitly when necessary.

### Express: terminal 1

```powershell
cd backend
npm install
node --env-file=.env src/server.js
```

The API listens on port 3000 by default. Node does not need a compilation step;
its Docker build installs production dependencies and copies the source.
`npm start` expects environment variables already loaded in the process, so use
the explicit `--env-file` command above for local development.

### FastAPI: terminal 2

```powershell
cd ai-service
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Pydantic Settings automatically reads `ai-service/.env`. Local Swagger is at
http://localhost:8000/docs. Calling the virtual environment's Python directly
avoids PowerShell activation-policy issues.

### React: terminal 3

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies general API requests to port 3000 and
username suggestions to port 8000. Keep both backend services running.

### Standalone React production build

```powershell
cd frontend
npm run build
```

Output is `frontend/dist/`; the web Docker image copies it into Nginx.
`npm run preview` only previews static build output and does not configure an API
proxy. Use Compose to test the production build with working API routes.

## 6. Tests and formatting

Run in the specified service directory after installing its dependencies:

```powershell
cd backend
npm test
npm run format
npm run format:check
cd ../frontend
npm run build
npm run format
npm run format:check
cd ../ai-service
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
# Optional Python development tooling:
.\.venv\Scripts\python.exe -m pip install ruff
.\.venv\Scripts\python.exe -m ruff check --no-cache .
.\.venv\Scripts\python.exe -m ruff format --check --no-cache .
```

Backend HTTP tests use an injected in-memory repository; they do not need MySQL.
AI tests mock Groq and do not consume provider quota. The integration smoke test
covers the real database path. There is no automated frontend browser test suite.

Prettier writes formatting with `format`; `format:check` reports differences.
Ruff's `format --check` does not modify files; omit `--check` to apply formatting.

The first JavaScript dependency installation creates `package-lock.json`.
Keep lockfiles in version control. The current Dockerfiles use `npm install`;
for reproducible CI, commit the generated lockfiles and change Docker installation
steps to `npm ci`. `--omit=dev` must remain on the API production dependency step.

## 7. Architecture and where changes belong

| Location | Responsibility |
| --- | --- |
| `backend/src/routes` | HTTP route registration and route-specific limits. |
| `backend/src/controllers` | Translate HTTP input/output and enforce profile ownership. |
| `backend/src/services` | Registration/login logic, bcrypt and JWT creation. |
| `backend/src/repositories` | Parameterized database queries and safe projections. |
| `backend/src/middleware` | Validation, authentication, throttling and errors. |
| `backend/src/config` | Startup environment validation and MySQL connection pool. |
| `backend/database` | Initial SQL schema. |
| `frontend/src/api.js` | HTTP calls, request timeout and API error translation. |
| `frontend/src/main.jsx` | Registration, login, dashboard and suggestion UI. |
| `frontend/nginx.conf` | Production proxy, security headers and AI request limits. |
| `ai-service/app/api` | Routes and route registration. |
| `ai-service/app/services` | AI orchestration, overall timeout and safe error messages. |
| `ai-service/app/providers` | LangChain ChatGroq integration and provider interface. |
| `ai-service/app/schemas` | Request and response validation. |
| `ai-service/app/core` | Settings, logging and exception handlers. |
| `ai-service/app/prompts` | Username generation instructions. |
| `ai-service/app/utils` | Bounded transient retry. |

See [architecture.png](architecture.png) for service communication and ports.

## 8. Troubleshooting

```powershell
docker compose ps
docker compose logs --tail=100 api ai db web
# Follow AI logs; Ctrl+C stops following logs, not the container:
docker compose logs -f ai
```

| Symptom | Action |
| --- | --- |
| Docker daemon unavailable | Start Docker Desktop and wait for its engine, then run `docker version`. |
| Port 8080 is occupied | Set `WEB_PORT=8090` in root `.env` and recreate `web`. |
| Database unhealthy | Inspect `db` logs; confirm credentials match the initialized database. |
| API unhealthy | Inspect `api` logs and database health; verify required environment values. |
| Groq key missing / 503 | Set the root key for Docker, or `ai-service/.env` for local execution. |
| Groq model not found / 503 | Set `GROQ_MODEL=openai/gpt-oss-120b`, verify model access, and recreate `ai`. |
| Provider failure / 502 | Check the AI log exception type, provider connectivity, key access and quota. |
| Too many requests / 429 | Wait for the relevant limit window; avoid repeated rapid retries. |
| Swagger layout or scripts do not load | Check browser connectivity to FastAPI's default Swagger CDN. |
| Changes do not appear | Rebuild the relevant service; image source is copied at build time. |

AI health only confirms the HTTP service is alive; it does not validate your key,
model permission, or Groq availability. The configured provider has one transient
retry, an eight-second per-attempt timeout and a 19-second overall deadline.
Model responses are validated before reaching the frontend.

Nginx limits suggestions to 6/minute/IP with a burst of 3. Node limits general API
requests to 100/15 minutes/IP, registration to 10/hour/IP, and failed login attempts
to 10/15 minutes/IP. Node's limits are per-process and reset on restart.

## 9. Database persistence and stopping

```powershell
# Stop and remove containers/network; retain database data:
docker compose down
# Start again, using existing images and database:
docker compose up -d --wait
```

The `mysql_data` named volume persists accounts. Initial SQL runs only on a new
volume. Editing `001-users.sql` does not migrate an existing database; apply a
reviewed SQL migration explicitly for schema changes. Do not delete a volume to
fix credentials if its data matters. Volume deletion permanently removes accounts.

## 10. Deployment and submission

Before public deployment, use HTTPS, unique secrets, database backups and
monitoring. Keep API/AI/MySQL ports private and use a shared rate-limit store when
scaling Node replicas. The current JWT design has no server-side logout revocation,
refresh tokens, email verification or password recovery.

Recreate the source package after documentation or source changes:

```powershell
python scripts/package-submission.py
```

This writes `nagaed-submission.zip` and includes this guide, source, Docker files,
environment examples and the architecture diagram. It excludes real `.env` files,
dependencies, build output, caches and existing ZIPs. Inspect the final package
before uploading. Candidate details are in the root README.

The architecture generator uses Pillow and Windows Segoe UI fonts. Run
`python scripts/create-architecture.py` only when the diagram needs updating;
Pillow is a documentation-tool dependency, not an application runtime dependency.
