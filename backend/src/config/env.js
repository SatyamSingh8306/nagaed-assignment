const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]?.trim()) throw new Error(`Missing required environment variable: ${key}`);
}
if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be 1-65535');
const proxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (![0, 1].includes(proxyHops)) throw new Error('TRUST_PROXY_HOPS must be 0 or 1');
export const config = { port, proxyHops };
