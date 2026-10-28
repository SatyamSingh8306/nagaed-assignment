# Node API

Node.js 22+, Express 5, MySQL 8.4. From this directory:

```powershell
Copy-Item .env.example .env
npm install
node --env-file=.env src/server.js
```

For local development, create the database/user named in `.env` and run
`mysql -h localhost -u <user> -p <database> < database/001-users.sql` from a shell
supporting input redirection, or run `SOURCE /absolute/path/001-users.sql;` in the
MySQL client. Docker initializes the schema automatically.

```powershell
npm test
npm run format
npm run format:check
```

Architecture: routes -> controllers -> services -> repositories -> MySQL.
Authentication, validation, throttling and error handling live in middleware;
environment and database configuration live in config. Application construction
is separate from the HTTP listener so tests can inject a repository without MySQL.

Responses: register 201, login/profile 200; invalid fields 400, invalid token or
credentials 401, another user's profile 403, missing profile 404, duplicate email
409, throttled request 429. Errors use `{ "error": { "message": "..." } }`.

A JWT is valid for one hour, HS256 only, with issuer/audience validation. Passwords
are bcrypt-hashed at cost 12; input is limited to 72 UTF-8 bytes. SQL uses bound
parameters and profile queries explicitly exclude the password hash.

Limits: 100 API requests / 15 minutes / IP; 10 registrations / hour / IP;
10 unsuccessful logins / 15 minutes / IP. Successful logins do not consume the
login-specific quota. Limits are in-memory and reset on restart; use a shared
store before scaling replicas. Set TRUST_PROXY_HOPS=1 only behind the included
single Nginx proxy, which overwrites forwarded client headers. Keep the API port
private. See the root README for deployment boundaries and Docker commands.
